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
import useUpload from "@/utils/useUpload"; // 🔥 NEW: Import upload hook

export function useWebSocketTranscript(restaurantId) {
  const [transcript, setTranscript] = useState([]);
  const [orderData, setOrderData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [isTakenOver, setIsTakenOver] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [audioActivity, setAudioActivity] = useState(0);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveStatus, setLastSaveStatus] = useState(null);
  // 🔥 FIXED: Call mute should default to false (audio enabled) when general audio is on
  const [isCallMuted, setIsCallMuted] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const audioCtxRef = useRef(null);

  const isMicMutedRef = useRef(false);
  const isTakenOverRef = useRef(false);
  // 🔥 FIXED: Ref should match new default state (false = audio enabled)
  const isCallMutedRef = useRef(false);

  const audioChunksRef = useRef([]);
  const currentCallIdRef = useRef(null);
  const callSessionActiveRef = useRef(false);
  const hasBeenSavedRef = useRef(false);
  const callTimerStartedRef = useRef(false);

  // 🔥 FIXED: Use refs to avoid stale closure issues
  const transcriptRef = useRef([]);
  const orderDataRef = useRef(null);

  const humanAudioWsRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioProcessorRef = useRef(null);
  const micAudioCtxRef = useRef(null);

  // 🔥 FIXED: Update refs when state changes
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    orderDataRef.current = orderData;
  }, [orderData]);

  // ✅ Debug logging function
  const logSaveConditions = (reason) => {
    // 🔥 REMOVED SPAMMY LOGS - only log if there's an actual issue
    const hasIssues =
      !restaurantId || !currentCallIdRef.current || hasBeenSavedRef.current;
    if (hasIssues) {
      console.log(
        `⚠️ Save skipped (${reason}): ${!restaurantId ? "no restaurant" : !currentCallIdRef.current ? "no call ID" : "already saved"}`,
      );
    }
  };

  // 🔥 NEW: Initialize upload hook for large files
  const [upload, { loading: uploading }] = useUpload();

  const manualSaveCall = async () => {
    if (isSaving || uploading) {
      console.log("⚠️ Save already in progress");
      return;
    }

    if (!currentCallIdRef.current || !restaurantId) {
      const msg = !currentCallIdRef.current
        ? "No active call ID to save"
        : "No restaurant ID available";
      console.log("❌", msg);
      setError(msg);
      setLastSaveStatus({ success: false, error: msg, timestamp: new Date() });
      return;
    }

    // ✅ FIXED: Better content validation
    const hasTranscript = transcript && transcript.length > 0;
    const hasOrderData =
      orderData &&
      (orderData.customer_name ||
        orderData.phone_number ||
        orderData.delivery_address ||
        orderData.total_price ||
        (orderData.order_items && orderData.order_items.length > 0));

    if (!hasTranscript && !hasOrderData) {
      const msg = "No call content to save";
      console.log("❌", msg);
      setError(msg);
      setLastSaveStatus({ success: false, error: msg, timestamp: new Date() });
      return;
    }

    setIsSaving(true);
    setLastSaveStatus(null);
    console.log("💾 Starting manual save...");

    try {
      // 🔥 NEW: Use frontend upload hook instead of backend API
      const audioUrl = await uploadCallAudio(
        currentCallIdRef.current,
        audioChunksRef,
        upload, // Pass upload function for large files
      );

      const saveResult = await saveCallToDatabase(
        orderData || {},
        transcript || [],
        currentCallIdRef.current,
        callStartTime,
        audioUrl,
        restaurantId,
      );

      hasBeenSavedRef.current = true;
      setLastSaveStatus({ success: true, timestamp: new Date() });
      console.log("✅ Manual save complete");
    } catch (saveError) {
      console.error("❌ Manual save failed:", saveError.message);
      setError(`Manual save failed: ${saveError.message}`);
      setLastSaveStatus({
        success: false,
        error: saveError.message,
        timestamp: new Date(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 🔥 FIXED: Use refs to get current values instead of stale closure
  const performAutoSave = async (triggerReason) => {
    // 🔥 FIXED: Get CURRENT values from refs, not stale closure
    const currentOrderData = orderDataRef.current;
    const currentTranscript = transcriptRef.current;

    if (hasBeenSavedRef.current) {
      return; // Silent skip if already saved
    }

    if (!currentCallIdRef.current || !restaurantId) {
      return; // Silent skip if missing required data
    }

    // 🔥 FIXED: Use current values from refs
    const hasTranscript = currentTranscript && currentTranscript.length > 0;
    const hasOrderData =
      currentOrderData &&
      (currentOrderData.customer_name ||
        currentOrderData.phone_number ||
        currentOrderData.delivery_address ||
        currentOrderData.total_price ||
        (currentOrderData.order_items &&
          currentOrderData.order_items.length > 0));

    // ✅ CHANGED: Only require ORDER DATA for auto-save (transcript is less critical)
    if (!hasOrderData) {
      return; // Silent skip if no meaningful order data
    }

    console.log(`💾 Auto-saving call (${triggerReason})...`);

    try {
      // 🔥 NEW: Use frontend upload hook instead of backend API
      const audioUrl = await uploadCallAudio(
        currentCallIdRef.current,
        audioChunksRef,
        upload, // Pass upload function for large files
      );

      // 🔥 FIXED: Use current values from refs
      const saveResult = await saveCallToDatabase(
        currentOrderData || {},
        currentTranscript || [],
        currentCallIdRef.current,
        callStartTime,
        audioUrl,
        restaurantId,
      );

      hasBeenSavedRef.current = true;
      console.log(`✅ Auto-save complete (${triggerReason})`);
    } catch (saveError) {
      console.error(
        `❌ Auto-save failed (${triggerReason}):`,
        saveError.message,
      );
    }
  };

  useEffect(() => {
    if (orderData) {
      // 🔥 REMOVED SPAMMY ORDER DATA LOGS
    }
  }, [orderData]);

  useEffect(() => {
    if (currentCallIdRef.current) {
      console.log("📞 Call ID updated:", currentCallIdRef.current);
    }
  }, [currentCallIdRef.current]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    isTakenOverRef.current = isTakenOver;
  }, [isTakenOver]);

  useEffect(() => {
    let interval;
    if (callStartTime && !isCallEnded) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStartTime, isCallEnded]);

  useEffect(() => {
    isCallMutedRef.current = isCallMuted;
  }, [isCallMuted]);

  // 🔥 NEW: Sync call mute state with general audio enabled state
  useEffect(() => {
    if (!audioEnabled) {
      // When general audio is disabled, mute calls
      setIsCallMuted(true);
    } else {
      // When general audio is enabled, unmute calls by default
      setIsCallMuted(false);
    }
  }, [audioEnabled]);

  // 🔥 NEW: Toggle call audio mute
  const toggleCallMute = () => {
    setIsCallMuted((prev) => {
      const newState = !prev;
      console.log(`🔊 Call audio ${newState ? "MUTED" : "UNMUTED"}`);
      return newState;
    });
  };

  const connect = () => {
    try {
      console.log("🔌 CONNECTING - Restaurant ID:", restaurantId);

      const baseUrl = getBaseUrl(restaurantId);
      if (!baseUrl) {
        setError(`No configuration found for restaurant: ${restaurantId}`);
        console.error("❌ No baseUrl found for:", restaurantId);
        return;
      }

      console.log("✅ Base URL found:", baseUrl);

      const wsUrl = new URL(
        `${baseUrl.replace("https://", "wss://")}/dashboard-stream`,
      );
      wsUrl.searchParams.append("audio_format", "pcm16");
      wsUrl.searchParams.append("sample_rate", "24000");

      console.log("📡 WebSocket URL:", wsUrl.toString());

      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log("✅ WebSocket CONNECTED");
        setIsConnected(true);
        setError(null);
        setIsCallEnded(false);

        await initAudioContext(audioCtxRef, setAudioEnabled, setError);

        callSessionActiveRef.current = true;
        audioChunksRef.current = [];
        currentCallIdRef.current = null;
        hasBeenSavedRef.current = false;
        callTimerStartedRef.current = false;

        console.log("✅ Session initialized - Waiting for call...");
      };

      // 🔥 FIXED: Remove duplicate message handling - just use handleWebSocketMessage
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Handle audio activity for UI
        if (
          (data.messageType === "audio" || data.type === "audio") &&
          (data.audio || data.audioBase64)
        ) {
          setAudioActivity(Math.random() * 100 + 20);
          setTimeout(() => setAudioActivity(0), 300);
        }

        // 🔥 FIXED: Use single message handler with auto-save callback
        handleWebSocketMessage(event, {
          currentCallIdRef,
          setOrderData,
          callSessionActiveRef,
          setTranscript,
          callStartTime,
          setCallStartTime: (time) => {
            setCallStartTime(time);
            if (time) {
              setIsCallEnded(false);
              hasBeenSavedRef.current = false;
            }
          },
          audioCtxRef,
          audioChunksRef,
          isTakenOverRef,
          restaurantId,
          callTimerStartedRef,
          isCallMutedRef, // 🔥 NEW: Pass mute ref
          // 🔥 NEW: Pass auto-save callback
          onOrderComplete: (orderData) => {
            console.log("🎯 ===== ORDER COMPLETE CALLBACK =====");
            console.log("📦 Order Data:", orderData);

            // Trigger auto-save after state updates
            setTimeout(() => {
              logSaveConditions("ORDER_COMPLETE_DELAYED");
              if (!hasBeenSavedRef.current) {
                performAutoSave("ORDER_COMPLETE");
              }
            }, 2000);
          },
          onCallEnded: () => {
            console.log("📞 ===== CALL ENDED CALLBACK =====");
            logSaveConditions("CALL_ENDED");

            // 🔥 FIXED: Preserve call ID for auto-save, then reset after save
            const callIdForSave = currentCallIdRef.current;

            if (callIdForSave && !hasBeenSavedRef.current) {
              console.log(
                "💾 Starting auto-save with preserved call ID:",
                callIdForSave,
              );
              performAutoSave("CALL_ENDED").finally(() => {
                // Reset call ID only after save completes (success or failure)
                console.log("🔄 Resetting call ID after auto-save attempt");
                currentCallIdRef.current = null;
              });
            } else {
              console.log(
                "⚠️ No call ID or already saved, resetting immediately",
              );
              currentCallIdRef.current = null;
            }

            setIsTakenOver(false);
            setIsMicMuted(false);
            setIsCallEnded(true);
            setAudioActivity(0);
            callSessionActiveRef.current = false;
          },
        });
      };

      ws.onclose = async (event) => {
        console.log("🔴 WebSocket CLOSED");
        logSaveConditions("DISCONNECT");

        setIsConnected(false);
        setIsCallEnded(true);
        setAudioActivity(0);

        // 🔥 FIXED: Use current ref values
        if (
          callSessionActiveRef.current &&
          orderDataRef.current &&
          currentCallIdRef.current &&
          !hasBeenSavedRef.current
        ) {
          console.log("💾 ===== AUTO-SAVE ON DISCONNECT =====");
          callSessionActiveRef.current = false;
          await performAutoSave("DISCONNECT");
        } else {
          console.log(
            "⚠️ Save skipped on disconnect - conditions not met or already saved",
          );
        }

        currentCallIdRef.current = null;

        if (event.code !== 1000) {
          console.log("🔄 Reconnecting in 3s...");
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        setError("Connection error occurred");
        setIsConnected(false);
      };
    } catch (connectError) {
      console.error("❌ Connect error:", connectError);
      setError("Failed to connect to stream");
    }
  };

  const disconnect = async () => {
    console.log("🔌 DISCONNECT called");

    if (isTakenOverRef.current) {
      await endTakeOverHandler();
    }

    // 🔥 FIXED: Use current ref values
    if (
      callSessionActiveRef.current &&
      orderDataRef.current &&
      currentCallIdRef.current &&
      !hasBeenSavedRef.current
    ) {
      console.log("💾 ===== AUTO-SAVE ON MANUAL DISCONNECT =====");
      callSessionActiveRef.current = false;
      await performAutoSave("MANUAL_DISCONNECT");
    } else {
      console.log(
        "⚠️ Save skipped on manual disconnect - conditions not met or already saved",
      );
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

    currentCallIdRef.current = null;
    setCallStartTime(null);
    setAudioActivity(0);
  };

  const clearTranscript = () => {
    console.log("🗑️ Clearing transcript");
    setTranscript([]);
    setCallDuration(0);
    setIsCallEnded(false);
    setCallStartTime(null);
    hasBeenSavedRef.current = false;
    setLastSaveStatus(null);
  };

  const clearOrder = () => {
    console.log("🗑️ Clearing order");
    setOrderData(null);
    setCallDuration(0);
    setIsCallEnded(false);
    setCallStartTime(null);
    hasBeenSavedRef.current = false;
    setLastSaveStatus(null);
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

  const testAudio = async () => {
    if (!audioCtxRef.current || !audioEnabled) {
      return;
    }

    try {
      const sampleRate = audioCtxRef.current.sampleRate;
      const duration = 0.5;
      const samples = Math.floor(sampleRate * duration);
      const testSamples = new Float32Array(samples);

      for (let i = 0; i < samples; i++) {
        testSamples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.3;
      }

      const buffer = audioCtxRef.current.createBuffer(1, samples, sampleRate);
      buffer.getChannelData(0).set(testSamples);

      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);
      source.start(0);
    } catch (error) {
      console.error("❌ Test audio failed:", error);
    }
  };

  // 🔥 FIXED: Pass restaurantId to takeover functions
  const takeOverCall = async () => {
    await takeover({
      currentCallIdRef,
      setError,
      setIsTakenOver,
      humanAudioWsRef,
      micStreamRef,
      audioProcessorRef,
      micAudioCtxRef,
      isMicMutedRef,
      endTakeOver: endTakeOverHandler,
      restaurantId, // 🔥 ADDED
    });
  };

  // 🔥 FIXED: Pass restaurantId to endTakeover
  const endTakeOverHandler = async () => {
    await endTakeover({
      micStreamRef,
      audioProcessorRef,
      micAudioCtxRef,
      humanAudioWsRef,
      currentCallIdRef,
      setIsTakenOver,
      setIsMicMuted,
      restaurantId, // 🔥 ADDED
    });
  };

  const toggleMicMute = () => {
    if (!isTakenOverRef.current) {
      console.log("⚠️ Cannot toggle mic - takeover not active");
      return;
    }
    setIsMicMuted((prev) => {
      const newState = !prev;
      console.log(`🎤 Microphone ${newState ? "MUTED" : "UNMUTED"}`);
      return newState;
    });
  };

  // 🔥 ENHANCED: Better error handling and debugging for call end
  const endCall = async () => {
    if (!currentCallIdRef.current) {
      setError("No active call to end");
      return;
    }
    if (!restaurantId) {
      setError("Restaurant ID is required");
      return;
    }
    try {
      await performEndCall(currentCallIdRef, restaurantId);
      setIsTakenOver(false);
      setIsMicMuted(false);
      console.log("✅ End call request sent successfully");
    } catch (error) {
      console.error("❌ End call failed:", error);
      setError(`Failed to end call: ${error.message}`);
      currentCallIdRef.current = null;
    }
  };

  useEffect(() => {
    if (restaurantId) {
      console.log("🚀 Initializing with restaurant:", restaurantId);
      connect();
    }
    return () => {
      console.log("🛑 Cleanup - disconnecting");
      disconnect();
    };
  }, [restaurantId]);

  return {
    transcript,
    orderData,
    isConnected,
    error,
    audioEnabled,
    isTakenOver,
    isMicMuted,
    callDuration,
    audioActivity,
    isSaving,
    lastSaveStatus,
    // 🔥 NEW: Call mute state and toggle
    isCallMuted,
    toggleCallMute,
    manualSaveCall,
    connect,
    disconnect,
    clearTranscript,
    clearOrder,
    toggleAudio,
    initAudioContext: () =>
      initAudioContext(audioCtxRef, setAudioEnabled, setError),
    testAudio,
    takeOverCall,
    endTakeOver: endTakeOverHandler,
    toggleMicMute,
    endCall,
  };
}
