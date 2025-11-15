import { useState, useEffect, useRef } from "react";
import { initAudioContext } from "./audio/audioUtils";
import { uploadCallAudio } from "./audio/audioRecording";
import {
  takeOverCall as takeover,
  endTakeOver as endTakeover,
  endCall as performEndCall,
} from "./audio/takeoverLogic";
import {
  handleWebSocketMessage,
  saveCallToDatabase,
} from "./audio/websocketHandlers";
import { getBaseUrl } from "@/utils/restaurantConfig";
import useUpload from "@/utils/useUpload";

export function useMultiCallWebSocket(restaurantId) {
  // 🔥 NEW: Multi-call state structure
  // calls = { [callId]: { transcript, orderData, startTime, duration, isTakenOver, isMicMuted, audioChunks, hasBeenSaved, ... } }
  const [calls, setCalls] = useState({});
  const [activeCallIds, setActiveCallIds] = useState([]);
  const [selectedCallId, setSelectedCallId] = useState(null);

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioActivity, setAudioActivity] = useState({}); // { [callId]: activityLevel }
  const [isCallMuted, setIsCallMuted] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const audioCtxRef = useRef(null);
  const callSessionActiveRef = useRef(true);
  const isCallMutedRef = useRef(false);

  // 🔥 NEW: Refs for multi-call management
  const callsRef = useRef({});
  const selectedCallIdRef = useRef(null);
  const humanAudioWsRef = useRef({}); // { [callId]: ws }
  const micStreamRef = useRef({}); // { [callId]: stream }
  const audioProcessorRef = useRef({}); // { [callId]: processor }
  const micAudioCtxRef = useRef({}); // { [callId]: ctx }

  const [upload, { loading: uploading }] = useUpload();

  // Sync calls ref with state
  useEffect(() => {
    callsRef.current = calls;
  }, [calls]);

  useEffect(() => {
    isCallMutedRef.current = isCallMuted;
  }, [isCallMuted]);

  useEffect(() => {
    selectedCallIdRef.current = selectedCallId;
  }, [selectedCallId]);

  // 🔥 NEW: Initialize a new call
  const initializeCall = (callId) => {
    console.log(`📞 ===== NEW CALL STARTED =====`);
    console.log(`📞 Call ID: ${callId}`);

    setCalls((prev) => ({
      ...prev,
      [callId]: {
        id: callId,
        transcript: [],
        orderData: null,
        startTime: null,
        duration: 0,
        isTakenOver: false,
        isMicMuted: false,
        audioChunks: [],
        hasBeenSaved: false,
        isCallEnded: false,
        isSaving: false,
        lastSaveStatus: null,
        callTimerStarted: false,
      },
    }));

    setActiveCallIds((prev) => {
      if (!prev.includes(callId)) {
        return [...prev, callId];
      }
      return prev;
    });

    // 🔥 CRITICAL FIX: Auto-select new call IMMEDIATELY and update refs
    setSelectedCallId((currentSelected) => {
      console.log(
        `🎯 Current selected: ${currentSelected}, New call: ${callId}`,
      );
      if (!currentSelected) {
        console.log(`🎯 AUTO-SELECTING new call: ${callId}`);
        // 🔥 IMMEDIATELY update the ref too
        selectedCallIdRef.current = callId;
        return callId;
      }
      return currentSelected;
    });
  };

  // 🔥 NEW: Update specific call data
  const updateCall = (callId, updates) => {
    setCalls((prev) => ({
      ...prev,
      [callId]: {
        ...prev[callId],
        ...updates,
      },
    }));
  };

  // 🔥 NEW: Add transcript message to specific call
  const addTranscriptToCall = (callId, message) => {
    setCalls((prev) => {
      const call = prev[callId];
      if (!call) return prev;

      const isDuplicate = call.transcript.some(
        (msg) =>
          msg.speaker === message.speaker &&
          msg.text === message.text &&
          Math.abs(msg.timestampRaw - message.timestampRaw) < 2000,
      );

      if (isDuplicate) return prev;

      const updatedTranscript = [...call.transcript, message].sort(
        (a, b) => a.timestampRaw - b.timestampRaw,
      );

      return {
        ...prev,
        [callId]: {
          ...call,
          transcript: updatedTranscript,
        },
      };
    });
  };

  // 🔥 NEW: Remove/end a call
  const endCallSession = (callId) => {
    console.log(`📞 Ending call session: ${callId}`);

    updateCall(callId, {
      isCallEnded: true,
      isTakenOver: false,
      isMicMuted: false,
    });

    setActiveCallIds((prev) => prev.filter((id) => id !== callId));

    // If this was the selected call, select another active call
    setSelectedCallId((prev) => {
      if (prev === callId) {
        const remaining = activeCallIds.filter((id) => id !== callId);
        return remaining.length > 0 ? remaining[0] : null;
      }
      return prev;
    });

    setAudioActivity((prev) => {
      const newActivity = { ...prev };
      delete newActivity[callId];
      return newActivity;
    });
  };

  // 🔥 NEW: Manual save for specific call
  const manualSaveCall = async (callId) => {
    const call = callsRef.current[callId];
    if (!call) {
      console.error("❌ Call not found:", callId);
      return;
    }

    if (call.isSaving || uploading) {
      console.log("⚠️ Save already in progress");
      return;
    }

    const hasTranscript = call.transcript && call.transcript.length > 0;
    const hasOrderData =
      call.orderData &&
      (call.orderData.customer_name ||
        call.orderData.phone_number ||
        call.orderData.delivery_address ||
        call.orderData.total_price ||
        (call.orderData.order_items && call.orderData.order_items.length > 0));

    if (!hasTranscript && !hasOrderData) {
      const msg = "No call content to save";
      console.log("❌", msg);
      updateCall(callId, {
        lastSaveStatus: { success: false, error: msg, timestamp: new Date() },
      });
      return;
    }

    updateCall(callId, { isSaving: true, lastSaveStatus: null });
    console.log(`💾 Starting manual save for call ${callId}...`);

    try {
      const audioUrl = await uploadCallAudio(
        callId,
        { current: call.audioChunks },
        upload,
      );

      const saveResult = await saveCallToDatabase(
        call.orderData || {},
        call.transcript || [],
        callId,
        call.startTime,
        audioUrl,
        restaurantId,
      );

      updateCall(callId, {
        hasBeenSaved: true,
        isSaving: false,
        lastSaveStatus: { success: true, timestamp: new Date() },
      });

      console.log(`✅ Manual save complete for call ${callId}`);
    } catch (saveError) {
      console.error(
        `❌ Manual save failed for call ${callId}:`,
        saveError.message,
      );
      updateCall(callId, {
        isSaving: false,
        lastSaveStatus: {
          success: false,
          error: saveError.message,
          timestamp: new Date(),
        },
      });
    }
  };

  // 🔥 NEW: Auto-save for specific call
  const performAutoSave = async (callId, triggerReason) => {
    const call = callsRef.current[callId];
    if (!call || call.hasBeenSaved) return;

    const hasOrderData =
      call.orderData &&
      (call.orderData.customer_name ||
        call.orderData.phone_number ||
        call.orderData.delivery_address ||
        call.orderData.total_price ||
        (call.orderData.order_items && call.orderData.order_items.length > 0));

    if (!hasOrderData) return;

    console.log(`💾 Auto-saving call ${callId} (${triggerReason})...`);

    try {
      const audioUrl = await uploadCallAudio(
        callId,
        { current: call.audioChunks },
        upload,
      );

      await saveCallToDatabase(
        call.orderData || {},
        call.transcript || [],
        callId,
        call.startTime,
        audioUrl,
        restaurantId,
      );

      updateCall(callId, { hasBeenSaved: true });
      console.log(
        `✅ Auto-save complete for call ${callId} (${triggerReason})`,
      );
    } catch (saveError) {
      console.error(
        `❌ Auto-save failed for call ${callId}:`,
        saveError.message,
      );
    }
  };

  // Update call durations
  useEffect(() => {
    const interval = setInterval(() => {
      setCalls((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach((callId) => {
          const call = updated[callId];
          if (call.startTime && !call.isCallEnded) {
            const newDuration = Math.floor(
              (Date.now() - call.startTime) / 1000,
            );
            if (newDuration !== call.duration) {
              updated[callId] = { ...call, duration: newDuration };
              hasChanges = true;
            }
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // WebSocket connection
  const connect = () => {
    try {
      console.log("🔌 CONNECTING - Restaurant ID:", restaurantId);

      const baseUrl = getBaseUrl(restaurantId);
      if (!baseUrl) {
        setError(`No configuration found for restaurant: ${restaurantId}`);
        return;
      }

      const wsUrl = new URL(
        `${baseUrl.replace("https://", "wss://")}/dashboard-stream`,
      );
      wsUrl.searchParams.append("audio_format", "pcm16");
      wsUrl.searchParams.append("sample_rate", "24000");
      wsUrl.searchParams.append("restaurant_id", restaurantId); // 🔥 FIX: Add restaurant ID

      console.log(`🔌 Connecting to WebSocket: ${wsUrl.toString()}`);
      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log("✅ WebSocket CONNECTED to dashboard stream");
        console.log(`🏪 Restaurant: ${restaurantId}`);
        console.log(`🔗 URL: ${wsUrl.toString()}`);
        setIsConnected(true);
        setError(null);
        // Note: Audio context initialization requires user gesture - use "Enable Audio" button
        callSessionActiveRef.current = true;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Handle ping
        if (data.type === "ping") return;

        // Extract call ID
        const callId = data.callSid || data.call_id || data.callId;

        // 🔥 DEBUG: Log full message for first message of each call to see all fields
        if (callId && !callsRef.current[callId]) {
          console.log(`📨 First message for call ${callId}:`, JSON.stringify(data, null, 2));
        }

        // Initialize call if new
        if (callId && !callsRef.current[callId]) {
          initializeCall(callId);
          // 🔥 CRITICAL: Force immediate selection of new call if none selected
          if (!selectedCallIdRef.current) {
            console.log(`🎯 FORCE-SELECTING new call immediately: ${callId}`);
            selectedCallIdRef.current = callId;
            setSelectedCallId(callId);
          }
        }

        // Handle audio activity
        if (
          callId &&
          (data.messageType === "audio" || data.type === "audio") &&
          (data.audio || data.audioBase64)
        ) {
          setAudioActivity((prev) => ({
            ...prev,
            [callId]: Math.random() * 100 + 20,
          }));
          setTimeout(() => {
            setAudioActivity((prev) => ({
              ...prev,
              [callId]: 0,
            }));
          }, 300);
        }

        // Route message to specific call handler
        if (callId) {
          handleMultiCallMessage(callId, data);
        } else if (data.type !== "ping") {
          console.warn(`⚠️ Message without callId:`, data);
        }
      };

      ws.onclose = async (event) => {
        console.log("🔴 WebSocket DISCONNECTED");
        console.log(`   Code: ${event.code}, Reason: ${event.reason || "none"}, Clean: ${event.wasClean}`);
        setIsConnected(false);
        callSessionActiveRef.current = false;

        if (event.code !== 1000) {
          console.log("🔄 Will attempt reconnect in 3 seconds...");
          reconnectTimeoutRef.current = setTimeout(() => connect(), 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket ERROR:", error);
        console.error("   This usually means network issues or backend is down");
        setError("Connection error - check network and backend status");
        setIsConnected(false);
      };
    } catch (connectError) {
      console.error("❌ Connect error:", connectError);
      setError("Failed to connect to stream");
    }
  };

  // 🔥 NEW: Handle messages for specific call
  const handleMultiCallMessage = (callId, data) => {
    const call = callsRef.current[callId];
    if (!call) {
      console.warn(`⚠️ Message for unknown call: ${callId}`);
      return;
    }

    // 🔥 DEBUG: Log message types to see what's coming through
    if (data.messageType !== "audio" && data.type !== "audio") {
      console.log(`📨 Message for ${callId}: type=${data.messageType || data.type}, speaker=${data.speaker}`);
    }

    // Handle call ended
    if (data.messageType === "callEnded") {
      console.log(`📞 Call ${callId} ended`);
      performAutoSave(callId, "CALL_ENDED").finally(() => {
        endCallSession(callId);
      });
      return;
    }

    // Handle order update
    if (data.messageType === "orderUpdate" && data.orderData) {
      updateCall(callId, {
        orderData: { ...(call.orderData || {}), ...data.orderData },
      });
      return;
    }

    // Handle order complete
    if (data.messageType === "orderComplete" && data.orderData) {
      console.log(`🎯 Order complete for call ${callId}`);
      updateCall(callId, { orderData: data.orderData });
      setTimeout(() => {
        if (!call.hasBeenSaved) {
          performAutoSave(callId, "ORDER_COMPLETE");
        }
      }, 2000);
      return;
    }

    // 🔥 FIXED: Handle audio - Only play audio for the currently selected call
    if (
      (data.messageType === "audio" || data.type === "audio") &&
      (data.audio || data.audioBase64)
    ) {
      const base64Audio = data.audio || data.audioBase64;
      const speaker = data.speaker;

      // 🔥 DEBUG: Log audio reception
      if (!call.audioDebugLogged) {
        console.log(`🔊 First audio chunk received for call ${callId}`);
        console.log(`   Speaker: ${speaker}`);
        console.log(`   Audio context state: ${audioCtxRef.current?.state || 'NOT_INITIALIZED'}`);
        console.log(`   Audio enabled: ${audioEnabled}`);
        console.log(`   Is muted: ${isCallMutedRef.current}`);
        console.log(`   Is taken over: ${call.isTakenOver}`);
        updateCall(callId, { audioDebugLogged: true });
      }

      // Don't play AI audio if call is taken over
      if ((speaker === "AI" || speaker === "ai") && call.isTakenOver) {
        console.log(`🚫 Skipping AI audio for taken over call ${callId}`);
        return;
      }

      // 🔥 CRITICAL FIX: Only process and play audio for the currently selected call
      const currentSelectedCallId = selectedCallIdRef.current;
      const shouldPlayAudio = callId === currentSelectedCallId;

      const audioReady =
        audioCtxRef.current && audioCtxRef.current.state === "running";

      // Always store audio chunks for all calls (for recording purposes)
      const audioChunks = [...call.audioChunks];
      updateCall(callId, { audioChunks });

      // 🔥 CRITICAL: ONLY PLAY AUDIO FOR THE SELECTED CALL
      if (!shouldPlayAudio) {
        // Don't spam logs for non-selected calls
        return;
      }

      if (!audioReady) {
        if (!call.audioNotReadyWarned) {
          console.warn(`⚠️ Audio context not ready - click "Enable Audio" button`);
          updateCall(callId, { audioNotReadyWarned: true });
        }
        return;
      }

      if (isCallMutedRef.current) {
        return; // Silently skip if muted
      }

      const format = data.format || data.encoding || "mulaw";
      const sampleRate =
        data.sampleRate ||
        data.sample_rate ||
        (format === "pcm16" ? 24000 : 8000);

      try {
        // Convert base64 to array buffer
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Create audio buffer and play it
        if (format === "pcm16") {
          // PCM16 format
          const samples = new Int16Array(bytes.buffer);
          const audioBuffer = audioCtxRef.current.createBuffer(
            1,
            samples.length,
            sampleRate,
          );
          const channelData = audioBuffer.getChannelData(0);

          for (let i = 0; i < samples.length; i++) {
            channelData[i] = samples[i] / 32768.0; // Convert to float
          }

          const source = audioCtxRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioCtxRef.current.destination);
          source.start();

          console.log(`✅ Audio played successfully for call ${callId}`);
        } else {
          // μ-law format (fallback)
          console.warn("μ-law audio format not fully implemented for playback");
        }
      } catch (audioError) {
        console.error("❌ Audio playback error:", audioError);
      }
      return;
    }

    // Handle transcription
    if (
      (data.messageType === "text" ||
        data.messageType === "transcription" ||
        data.messageType === "transcript" ||
        data.type === "text" ||
        data.type === "transcript" ||
        (data.speaker && data.text)) &&
      data.speaker &&
      data.text &&
      data.timestamp
    ) {
      console.log(`💬 Transcript for ${callId}: [${data.speaker}] ${data.text.substring(0, 50)}...`);

      // Start timer on first customer message
      if (
        !call.callTimerStarted &&
        (data.speaker === "customer" || data.speaker === "Caller")
      ) {
        console.log(`⏱️ Starting call timer for ${callId}`);
        updateCall(callId, {
          callTimerStarted: true,
          startTime: Date.now(),
        });
      }

      const timestampMs = data.timestamp;
      const messageId =
        data.id ||
        `msg_${timestampMs}_${Math.random().toString(36).substr(2, 9)}`;

      const serverTime = new Date(timestampMs);
      const timestampStr = serverTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const newMessage = {
        id: messageId,
        speaker: data.speaker,
        text: data.text,
        timestamp: timestampStr,
        timestampRaw: timestampMs,
      };

      addTranscriptToCall(callId, newMessage);
      return;
    }
  };

  const disconnect = async () => {
    console.log("🔌 DISCONNECT called");

    // Save all active calls
    for (const callId of activeCallIds) {
      const call = callsRef.current[callId];
      if (call && !call.hasBeenSaved && call.orderData) {
        await performAutoSave(callId, "MANUAL_DISCONNECT");
      }
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.suspend();
    }
  };

  const toggleCallMute = () => {
    setIsCallMuted((prev) => !prev);
  };

  const toggleAudio = async () => {
    if (!audioEnabled) {
      const success = await initAudioContext(
        audioCtxRef,
        setAudioEnabled,
        setError,
      );
      if (!success) {
        setError("Failed to enable audio");
      }
    } else {
      if (audioCtxRef.current) {
        await audioCtxRef.current.suspend();
        setAudioEnabled(false);
      }
    }
  };

  // Call control functions for specific call
  const takeOverCall = async (callId) => {
    if (!callId) callId = selectedCallId;
    if (!callId) return;

    await takeover({
      currentCallIdRef: { current: callId },
      setError,
      setIsTakenOver: (value) => updateCall(callId, { isTakenOver: value }),
      humanAudioWsRef: { current: humanAudioWsRef.current[callId] },
      micStreamRef: { current: micStreamRef.current[callId] },
      audioProcessorRef: { current: audioProcessorRef.current[callId] },
      micAudioCtxRef: { current: micAudioCtxRef.current[callId] },
      isMicMutedRef: { current: calls[callId]?.isMicMuted || false },
      endTakeOver: () => endTakeOverHandler(callId),
      restaurantId,
    });
  };

  const endTakeOverHandler = async (callId) => {
    if (!callId) callId = selectedCallId;
    if (!callId) return;

    await endTakeover({
      micStreamRef: { current: micStreamRef.current[callId] },
      audioProcessorRef: { current: audioProcessorRef.current[callId] },
      micAudioCtxRef: { current: micAudioCtxRef.current[callId] },
      humanAudioWsRef: { current: humanAudioWsRef.current[callId] },
      currentCallIdRef: { current: callId },
      setIsTakenOver: (value) => updateCall(callId, { isTakenOver: value }),
      setIsMicMuted: (value) => updateCall(callId, { isMicMuted: value }),
      restaurantId,
    });
  };

  const toggleMicMute = (callId) => {
    if (!callId) callId = selectedCallId;
    if (!callId) return;

    const call = calls[callId];
    if (!call?.isTakenOver) {
      console.log("⚠️ Cannot toggle mic - takeover not active");
      return;
    }
    updateCall(callId, { isMicMuted: !call.isMicMuted });
  };

  const endCall = async (callId) => {
    if (!callId) callId = selectedCallId;
    if (!callId) return;

    console.log(`📞 ===== END CALL DEBUG =====`);
    console.log(`📞 Call ID: ${callId}`);
    console.log(`🏪 Restaurant ID (from URL): ${restaurantId}`);
    console.log(`📍 Current restaurant param: ${restaurantId}`);

    try {
      await performEndCall({ current: callId }, restaurantId);
      updateCall(callId, { isTakenOver: false, isMicMuted: false });
      console.log(`✅ End call request sent for ${callId}`);
    } catch (error) {
      console.error(`❌ ===== END CALL FAILED =====`);
      console.error(`❌ Call ID: ${callId}`);
      console.error(`❌ Restaurant ID sent: ${restaurantId}`);
      console.error(`❌ Error:`, error);
      console.error(`❌ Error message: ${error.message}`);
      setError(`Failed to end call: ${error.message}`);
    }
  };

  const clearTranscript = (callId) => {
    if (!callId) callId = selectedCallId;
    if (!callId) return;

    updateCall(callId, {
      transcript: [],
      duration: 0,
      isCallEnded: false,
      startTime: null,
      hasBeenSaved: false,
      lastSaveStatus: null,
    });
  };

  const clearOrder = (callId) => {
    if (!callId) callId = selectedCallId;
    if (!callId) return;

    updateCall(callId, {
      orderData: null,
      duration: 0,
      isCallEnded: false,
      startTime: null,
      hasBeenSaved: false,
      lastSaveStatus: null,
    });
  };

  useEffect(() => {
    if (restaurantId) {
      connect();
    }
    return () => disconnect();
  }, [restaurantId]);

  // Get selected call data
  const selectedCall = selectedCallId ? calls[selectedCallId] : null;

  return {
    // Multi-call state
    calls,
    activeCallIds,
    selectedCallId,
    setSelectedCallId,
    selectedCall,

    // Connection state
    isConnected,
    error,
    audioEnabled,
    audioActivity,
    isCallMuted,
    toggleCallMute,

    // Call-specific getters
    getCall: (callId) => calls[callId],

    // Actions
    manualSaveCall,
    connect,
    disconnect,
    clearTranscript,
    clearOrder,
    toggleAudio,
    initAudioContext: () =>
      initAudioContext(audioCtxRef, setAudioEnabled, setError),
    takeOverCall,
    endTakeOver: endTakeOverHandler,
    toggleMicMute,
    endCall,
  };
}
