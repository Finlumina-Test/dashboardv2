import { useState, useEffect, useRef } from "react";
import { initAudioContext } from "./audio/audioUtils";
import { uploadCallAudio } from "./audio/audioRecording";
import {
  takeOverCall as takeover,
  endTakeOver as endTakeover,
} from "./audio/takeoverLogic";
import {
  handleWebSocketMessage,
  saveCallToDatabase,
} from "./audio/websocketHandlers";
import { getBaseUrl } from "@/utils/restaurantConfig";
import useUpload from "@/utils/useUpload"; // 🔥 NEW: Import upload hook

export function useWebSocketDemo(sessionId) {
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
  const [callStatus, setCallStatus] = useState("waiting"); // waiting, active, ended

  // 🔥 NEW: Initialize upload hook for large files
  const [upload, { loading: uploading }] = useUpload();

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const audioCtxRef = useRef(null);

  const isMicMutedRef = useRef(false);
  const isTakenOverRef = useRef(false);

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

  const manualSaveCall = async () => {
    console.log("🔍 ===== DEMO MANUAL SAVE VALIDATION =====");
    console.log("📞 Call ID:", currentCallIdRef.current || "❌ MISSING");
    console.log("📦 Order Data exists:", !!orderData);
    console.log("📝 Transcript length:", transcript?.length || 0);
    console.log("🔄 Is already saving:", isSaving);
    console.log("💾 Has been saved:", hasBeenSavedRef.current);

    if (isSaving || uploading) {
      console.log("⚠️ Save already in progress");
      return;
    }

    if (!currentCallIdRef.current) {
      const msg = "No active call ID to save";
      console.log("❌", msg);
      setError(msg);
      setLastSaveStatus({ success: false, error: msg, timestamp: new Date() });
      return;
    }

    const hasTranscript = transcript && transcript.length > 0;
    const hasOrderData =
      orderData &&
      (orderData.customer_name ||
        orderData.phone_number ||
        orderData.delivery_address ||
        orderData.total_price ||
        (orderData.order_items && orderData.order_items.length > 0));

    if (!hasTranscript && !hasOrderData) {
      const msg = "No call content to save (no transcript or order data)";
      console.log("❌", msg);
      setError(msg);
      setLastSaveStatus({ success: false, error: msg, timestamp: new Date() });
      return;
    }

    setIsSaving(true);
    setLastSaveStatus(null);
    console.log("💾 ===== DEMO MANUAL SAVE INITIATED =====");

    try {
      // 🔥 NEW: Use frontend upload hook instead of backend API
      const audioUrl = await uploadCallAudio(
        currentCallIdRef.current,
        audioChunksRef,
        upload, // Pass upload function for large files
      );
      console.log("🎵 Audio upload result:", audioUrl || "no audio");

      const saveResult = await saveCallToDatabase(
        orderData || {},
        transcript || [],
        currentCallIdRef.current,
        callStartTime,
        audioUrl,
        "demo", // Always use demo restaurant ID
      );

      hasBeenSavedRef.current = true;
      setLastSaveStatus({ success: true, timestamp: new Date() });
      console.log("✅ ===== DEMO MANUAL SAVE COMPLETE =====");
      console.log("✅ Save result:", saveResult);
    } catch (saveError) {
      console.error("❌ ===== DEMO MANUAL SAVE FAILED =====");
      console.error("❌ Error:", saveError);
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

  const performAutoSave = async (triggerReason) => {
    console.log("🤖 ===== DEMO AUTO-SAVE VALIDATION =====");
    console.log("🔍 Trigger:", triggerReason);
    console.log("🎭 Session ID:", sessionId);
    console.log("📞 Call ID:", currentCallIdRef.current || "❌ MISSING");

    const currentOrderData = orderDataRef.current;
    const currentTranscript = transcriptRef.current;

    console.log("📦 Order Data exists:", !!currentOrderData);
    console.log("📝 Transcript length:", currentTranscript?.length || 0);
    console.log("💾 Has been saved:", hasBeenSavedRef.current);

    if (hasBeenSavedRef.current) {
      console.log(
        `⚠️ Demo auto-save skipped (${triggerReason}) - already saved`,
      );
      return;
    }

    if (!currentCallIdRef.current) {
      console.log(
        `⚠️ Demo auto-save skipped (${triggerReason}) - missing call_id`,
      );
      return;
    }

    const hasTranscript = currentTranscript && currentTranscript.length > 0;
    const hasOrderData =
      currentOrderData &&
      (currentOrderData.customer_name ||
        currentOrderData.phone_number ||
        currentOrderData.delivery_address ||
        currentOrderData.total_price ||
        (currentOrderData.order_items &&
          currentOrderData.order_items.length > 0));

    if (!hasOrderData) {
      console.log(
        `⚠️ Demo auto-save skipped (${triggerReason}) - no meaningful order data to save yet`,
      );
      return;
    }

    console.log(`💾 ===== DEMO AUTO-SAVE TRIGGERED: ${triggerReason} =====`);

    try {
      // 🔥 NEW: Use frontend upload hook instead of backend API
      const audioUrl = await uploadCallAudio(
        currentCallIdRef.current,
        audioChunksRef,
        upload, // Pass upload function for large files
      );
      console.log("🎵 Audio upload result:", audioUrl || "no audio");

      const saveResult = await saveCallToDatabase(
        currentOrderData || {},
        currentTranscript || [],
        currentCallIdRef.current,
        callStartTime,
        audioUrl,
        "demo", // Always use demo restaurant ID
      );

      hasBeenSavedRef.current = true;
      console.log(`✅ ===== DEMO AUTO-SAVE COMPLETE: ${triggerReason} =====`);
      console.log("✅ Save result:", saveResult);
    } catch (saveError) {
      console.error(`❌ ===== DEMO AUTO-SAVE FAILED: ${triggerReason} =====`);
      console.error("❌ Error:", saveError);
    }
  };

  const connect = () => {
    try {
      console.log("🔌 CONNECTING DEMO - Session ID:", sessionId);

      const baseUrl = getBaseUrl("demo");
      if (!baseUrl) {
        setError("Demo configuration not found");
        console.error("❌ No baseUrl found for demo");
        return;
      }

      console.log("✅ Demo Base URL:", baseUrl);

      const wsUrl = new URL(
        `${baseUrl.replace("https://", "wss://")}/dashboard-stream`,
      );
      wsUrl.searchParams.append("audio_format", "pcm16");
      wsUrl.searchParams.append("sample_rate", "24000");

      console.log("📡 Demo WebSocket URL:", wsUrl.toString());

      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log("✅ Demo WebSocket CONNECTED");
        setIsConnected(true);
        setError(null);
        setIsCallEnded(false);
        setCallStatus("waiting");

        // 🔥 NEW: Send session ID to backend on connection
        ws.send(JSON.stringify({ sessionId }));
        console.log("📤 Session ID sent to backend:", sessionId);

        await initAudioContext(audioCtxRef, setAudioEnabled, setError);

        callSessionActiveRef.current = true;
        audioChunksRef.current = [];
        currentCallIdRef.current = null;
        hasBeenSavedRef.current = false;
        callTimerStartedRef.current = false;

        console.log("✅ Demo session initialized - Waiting for call...");
      };

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

        // 🔥 NEW: Handle call start
        if (
          data.messageType === "callStart" ||
          data.messageType === "callStarted"
        ) {
          setCallStatus("active");
          console.log("📞 Call started for session:", sessionId);
        }

        // Handle WebSocket messages with demo-specific callbacks
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
              setCallStatus("active");
              hasBeenSavedRef.current = false;
            }
          },
          audioCtxRef,
          audioChunksRef,
          isTakenOverRef,
          restaurantId: "demo",
          callTimerStartedRef,
          onOrderComplete: (orderData) => {
            console.log("🎯 ===== DEMO ORDER COMPLETE CALLBACK =====");
            console.log("📦 Order Data:", orderData);

            setTimeout(() => {
              if (!hasBeenSavedRef.current) {
                performAutoSave("ORDER_COMPLETE");
              }
            }, 2000);
          },
          onCallEnded: () => {
            console.log("📞 ===== DEMO CALL ENDED CALLBACK =====");
            setCallStatus("ended");

            if (currentCallIdRef.current && !hasBeenSavedRef.current) {
              performAutoSave("CALL_ENDED");
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
        console.log("🔴 Demo WebSocket CLOSED");
        setIsConnected(false);
        setIsCallEnded(true);
        setAudioActivity(0);

        if (
          callSessionActiveRef.current &&
          orderDataRef.current &&
          currentCallIdRef.current &&
          !hasBeenSavedRef.current
        ) {
          console.log("💾 ===== DEMO AUTO-SAVE ON DISCONNECT =====");
          callSessionActiveRef.current = false;
          await performAutoSave("DISCONNECT");
        }

        currentCallIdRef.current = null;

        if (event.code !== 1000) {
          console.log("🔄 Demo reconnecting in 3s...");
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ Demo WebSocket error:", error);
        setError("Connection error occurred");
        setIsConnected(false);
      };
    } catch (connectError) {
      console.error("❌ Demo connect error:", connectError);
      setError("Failed to connect to demo stream");
    }
  };

  const disconnect = async () => {
    console.log("🔌 DEMO DISCONNECT called");

    if (isTakenOverRef.current) {
      await endTakeOverHandler();
    }

    if (
      callSessionActiveRef.current &&
      orderDataRef.current &&
      currentCallIdRef.current &&
      !hasBeenSavedRef.current
    ) {
      console.log("💾 ===== DEMO AUTO-SAVE ON MANUAL DISCONNECT =====");
      callSessionActiveRef.current = false;
      await performAutoSave("MANUAL_DISCONNECT");
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
    setCallStatus("waiting");
  };

  const clearTranscript = () => {
    console.log("🗑️ Clearing demo transcript");
    setTranscript([]);
    setCallDuration(0);
    setIsCallEnded(false);
    setCallStartTime(null);
    hasBeenSavedRef.current = false;
    setLastSaveStatus(null);
    setCallStatus("waiting");
  };

  const clearOrder = () => {
    console.log("🗑️ Clearing demo order");
    setOrderData(null);
    setCallDuration(0);
    setIsCallEnded(false);
    setCallStartTime(null);
    hasBeenSavedRef.current = false;
    setLastSaveStatus(null);
    setCallStatus("waiting");
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
      console.error("❌ Demo test audio failed:", error);
    }
  };

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
      restaurantId: "demo",
    });
  };

  const endTakeOverHandler = async () => {
    await endTakeover({
      micStreamRef,
      audioProcessorRef,
      micAudioCtxRef,
      humanAudioWsRef,
      currentCallIdRef,
      setIsTakenOver,
      setIsMicMuted,
      restaurantId: "demo",
    });
  };

  const toggleMicMute = () => {
    if (!isTakenOverRef.current) {
      console.log("⚠️ Cannot toggle mic - takeover not active");
      return;
    }
    setIsMicMuted((prev) => {
      const newState = !prev;
      console.log(`🎤 Demo microphone ${newState ? "MUTED" : "UNMUTED"}`);
      return newState;
    });
  };

  const endCall = async () => {
    if (!currentCallIdRef.current) {
      setError("No active call to end");
      return;
    }

    try {
      console.log(`📞 ===== ATTEMPTING TO END DEMO CALL =====`);
      console.log(`📞 Call SID: ${currentCallIdRef.current}`);
      console.log(`🎭 Session ID: ${sessionId}`);

      const baseUrl = getBaseUrl("demo");
      if (!baseUrl) {
        setError("Demo configuration not found");
        return;
      }

      const response = await fetch(`${baseUrl}/end-call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ callSid: currentCallIdRef.current }),
      });

      const responseText = await response.text();
      console.log(
        `📞 Demo end call response: ${response.status} - ${responseText}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to end demo call: ${response.status} ${responseText}`,
        );
      }

      console.log("✅ Demo call ended successfully");
      setIsTakenOver(false);
      setIsMicMuted(false);
      setCallStatus("ended");
      currentCallIdRef.current = null;
    } catch (error) {
      console.error("❌ ===== END DEMO CALL FAILED =====");
      console.error("❌ Error:", error);
      setError(`Failed to end call: ${error.message}`);
    }
  };

  useEffect(() => {
    if (sessionId) {
      console.log("🚀 Initializing demo with session:", sessionId);
      connect();
    }
    return () => {
      console.log("🛑 Demo cleanup - disconnecting");
      disconnect();
    };
  }, [sessionId]);

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
    callStatus, // 🔥 NEW: waiting, active, ended
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
