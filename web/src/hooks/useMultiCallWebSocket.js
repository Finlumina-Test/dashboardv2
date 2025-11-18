import { useState, useEffect, useRef } from "react";
import { initAudioContext, playAudioHQ } from "./audio/audioUtils";
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

// 🔥 NEW: Check call status from backend
const checkCallStatus = async (callId, restaurantId) => {
  try {
    const baseUrl = getBaseUrl(restaurantId);
    if (!baseUrl) {
      throw new Error(`No base URL configured for restaurant: ${restaurantId}`);
    }
    const response = await fetch(`${baseUrl}/call-status?callSid=${callId}`);

    if (!response.ok) {
      throw new Error(`Call status check failed: ${response.status}`);
    }

    const status = await response.json();
    console.log(`📊 Call status for ${callId}:`, status);
    return status;
  } catch (error) {
    console.error(`❌ Failed to check call status for ${callId}:`, error);
    throw error;
  }
};

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

  // 🔥 AUTO-RESUME: Resume audio context on first user interaction
  useEffect(() => {
    const handleUserInteraction = async () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        try {
          console.log("🔊 User interaction detected - resuming audio context...");
          await audioCtxRef.current.resume();
          console.log(`✅ Audio context resumed (state: ${audioCtxRef.current.state})`);
          if (audioCtxRef.current.state === 'running') {
            setAudioEnabled(true);
          }
        } catch (err) {
          console.warn("⚠️ Could not resume audio context:", err);
        }
      }
    };

    // Listen for first user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

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
        isAudioMuted: false, // 🔥 NEW: Per-call audio mute state
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
    setCalls((prev) => {
      const prevCall = prev[callId];
      if (!prevCall) return prev;

      // Handle functional updates
      const newData = typeof updates === 'function' ? updates(prevCall) : updates;

      return {
        ...prev,
        [callId]: {
          ...prevCall,
          ...newData,
        },
      };
    });
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
    console.log(`📞 ===== ENDING CALL SESSION: ${callId} =====`);

    const call = callsRef.current[callId];

    if (!call) {
      console.warn(`⚠️ Cannot end call - call ${callId} not found`);
      return;
    }

    // 🔥 FIX: Capture final duration when call ends
    const finalDuration = call?.startTime
      ? Math.floor((Date.now() - call.startTime) / 1000)
      : call?.duration || 0;

    console.log(`⏱️ Final call duration: ${finalDuration} seconds`);
    console.log(`⏱️ Setting isCallEnded = true for call ${callId}`);

    updateCall(callId, {
      isCallEnded: true,
      duration: finalDuration, // 🔥 FIX: Set final duration
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
    console.log(`💾 ===== MANUAL SAVE CALL ${callId} =====`);
    console.log(`💾 Audio chunks available: ${call.audioChunks?.length || 0}`);
    console.log(`💾 Transcript messages: ${call.transcript?.length || 0}`);

    try {
      // 🔥 NEW: Pass audioChunksRef directly - saveCallToDatabase will upload to Supabase
      const saveResult = await saveCallToDatabase(
        call.orderData || {},
        call.transcript || [],
        callId,
        call.startTime,
        null, // No pre-uploaded audio URL
        restaurantId,
        { current: call.audioChunks }, // Pass audio chunks for Supabase upload
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

    console.log(`💾 ===== AUTO-SAVING CALL ${callId} (${triggerReason}) =====`);
    console.log(`💾 Audio chunks available: ${call.audioChunks?.length || 0}`);
    console.log(`💾 Transcript messages: ${call.transcript?.length || 0}`);

    try {
      // 🔥 NEW: Pass audioChunksRef directly - saveCallToDatabase will upload to Supabase
      await saveCallToDatabase(
        call.orderData || {},
        call.transcript || [],
        callId,
        call.startTime,
        null, // No pre-uploaded audio URL
        restaurantId,
        { current: call.audioChunks }, // Pass audio chunks for Supabase upload
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
          // Only update duration if call has started and NOT ended
          if (call.startTime && !call.isCallEnded) {
            const newDuration = Math.floor(
              (Date.now() - call.startTime) / 1000,
            );
            if (newDuration !== call.duration) {
              updated[callId] = { ...call, duration: newDuration };
              hasChanges = true;
            }
          } else if (call.isCallEnded && call.startTime) {
            // Log when we skip updating a ended call (for debugging)
            if (!call._endedLogged) {
              console.log(`⏱️ Timer stopped for call ${callId} - call has ended`);
              updated[callId] = { ...call, _endedLogged: true };
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

      // 🔥 NEW: Check call-status endpoint to verify call state
      checkCallStatus(callId, restaurantId).then((status) => {
        if (status) {
          console.log(`✅ Call status verified:`, status);
        }
      }).catch((err) => {
        console.warn(`⚠️ Call status check failed:`, err.message);
      });

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

      const format = data.format || data.encoding || "mulaw";
      const sampleRate =
        data.sampleRate ||
        data.sample_rate ||
        (format === "pcm16" ? 24000 : 8000);

      const audioId =
        data.id ||
        data.audioId ||
        `audio_${data.timestamp || Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 🔥 CRITICAL FIX: Determine if we should PLAY audio (only for selected call)
      const currentSelectedCallId = selectedCallIdRef.current;
      const shouldPlayAudio = callId === currentSelectedCallId;

      const audioReady =
        audioCtxRef.current && audioCtxRef.current.state === "running";

      // 🔥 NEW: Determine mute state for this specific call
      const isMuted =
        !shouldPlayAudio || // Mute if not selected call
        !audioReady || // Mute if audio not ready
        call.isAudioMuted || // Mute if call is muted
        ((speaker === "AI" || speaker === "ai") && call.isTakenOver); // Mute AI if taken over

      if (!audioReady && shouldPlayAudio && !call.audioNotReadyWarned) {
        console.warn(`⚠️ Audio context not ready - click "Enable Audio" button`);
        updateCall(callId, { audioNotReadyWarned: true });
      }

      // 🔥 FIX: ALWAYS record audio (even for non-selected calls), but only PLAY for selected call
      try {
        // Create a temporary array to collect new chunks from playAudioHQ
        const tempChunksArray = [];
        const audioChunksRef = { current: tempChunksArray };

        playAudioHQ(
          base64Audio,
          audioCtxRef,
          audioChunksRef, // Pass mutable ref
          { current: true }, // callSessionActive - always record
          format,
          sampleRate,
          speaker,
          audioId,
          isMuted // Mute non-selected calls
        );

        // 🔥 FIX: Append new chunks to existing chunks (don't overwrite!)
        if (tempChunksArray.length > 0) {
          updateCall(callId, (prevCall) => {
            const newTotal = prevCall.audioChunks.length + tempChunksArray.length;
            console.log(`🎵 Audio chunks for ${callId}: ${prevCall.audioChunks.length} + ${tempChunksArray.length} = ${newTotal} total`);
            return {
              audioChunks: [...prevCall.audioChunks, ...tempChunksArray]
            };
          });
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

      // 🔥 FIX: Start timer on FIRST message from ANY speaker (AI or caller)
      if (!call.callTimerStarted) {
        console.log(`⏱️ Starting call timer for ${callId} (speaker: ${data.speaker})`);
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

  const toggleCallMute = (callId) => {
    // 🔥 FIXED: Accept callId parameter or use selected call
    const targetCallId = callId || selectedCallId;

    if (!targetCallId) {
      console.warn("⚠️ No call selected to mute");
      return;
    }

    const call = callsRef.current[targetCallId];
    if (!call) {
      console.warn(`⚠️ Call ${targetCallId} not found`);
      return;
    }

    const newMuteState = !call.isAudioMuted;
    console.log(`🔇 ${newMuteState ? 'Muting' : 'Unmuting'} call ${targetCallId}`);

    updateCall(targetCallId, {
      isAudioMuted: newMuteState,
    });

    // 🔥 Also update global state if it's the selected call
    if (targetCallId === selectedCallId) {
      setIsCallMuted(newMuteState);
    }
  };

  const toggleAudio = async () => {
    console.log(`🔊 toggleAudio called - current audioEnabled: ${audioEnabled}`);

    if (!audioEnabled) {
      console.log("🔊 Attempting to enable audio...");
      const success = await initAudioContext(
        audioCtxRef,
        setAudioEnabled,
        setError,
      );
      if (!success) {
        console.error("❌ Failed to enable audio");
        setError("Failed to enable audio - check browser permissions and ensure you've interacted with the page");
      } else {
        console.log("✅ Audio enabled successfully");
      }
    } else {
      console.log("🔇 Disabling audio...");
      if (audioCtxRef.current) {
        await audioCtxRef.current.suspend();
        setAudioEnabled(false);
        console.log("✅ Audio disabled");
      } else {
        console.warn("⚠️ No audio context to suspend");
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
      // 🔥 FIX: Auto-save before ending call manually
      const call = callsRef.current[callId];
      if (call && !call.hasBeenSaved) {
        console.log(`💾 Auto-saving before manual end...`);
        await performAutoSave(callId, "MANUAL_END_CALL");
      }

      // Send end call request to backend
      await performEndCall({ current: callId }, restaurantId);

      // Update call state
      updateCall(callId, {
        isTakenOver: false,
        isMicMuted: false,
        isCallEnded: true, // 🔥 FIX: Mark call as ended to stop timer
      });

      console.log(`✅ End call request sent for ${callId}`);

      // 🔥 FIX: End the call session after a brief delay to allow backend to process
      setTimeout(() => {
        endCallSession(callId);
      }, 1000);
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
