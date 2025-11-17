// WebSocket message handlers for dashboard stream

import { playAudioHQ } from "./audioUtils";
import { uploadCallAudioToSupabase } from "./audioRecording";

// Save call to database (used by manual and auto-save)
export const saveCallToDatabase = async (
  finalOrderData,
  finalTranscript,
  callId,
  callStartTime,
  audioUrl = null,
  restaurantId, // ✅ REQUIRED
  audioChunksRef = null, // 🔥 NEW: Audio chunks for Supabase upload
) => {
  try {
    const callDuration = callStartTime
      ? Math.floor((Date.now() - callStartTime) / 1000)
      : 0;

    console.log("💾 ===== SAVE CALL DEBUG =====");
    console.log("💾 Call ID:", callId || "❌ MISSING");
    console.log("💾 Restaurant ID:", restaurantId || "❌ MISSING");
    console.log("💾 Audio URL received:", audioUrl || "❌ NULL/MISSING");
    console.log("💾 Audio chunks available:", !!audioChunksRef?.current);
    console.log("💾 Order Data exists:", !!finalOrderData);
    console.log("💾 Transcript length:", finalTranscript?.length || 0);
    console.log("💾 Call duration:", callDuration, "seconds");

    if (!callId) {
      console.error("❌ No call ID available from server");
      throw new Error("No call ID available");
    }

    if (!restaurantId) {
      console.error("❌ No restaurant ID provided to save function!");
      throw new Error("No restaurant ID provided");
    }

    // 🔥 NEW: Upload audio to Supabase if chunks are available
    let finalAudioUrl = audioUrl;
    console.log("📤 ===== AUDIO UPLOAD SECTION =====");
    console.log("📤 audioChunksRef exists:", !!audioChunksRef);
    console.log("📤 audioChunksRef.current exists:", !!audioChunksRef?.current);
    console.log("📤 audioChunks count:", audioChunksRef?.current?.length || 0);

    if (audioChunksRef?.current && audioChunksRef.current.length > 0) {
      console.log("📤 Uploading audio to Supabase Storage...");
      const uploadedUrl = await uploadCallAudioToSupabase(callId, audioChunksRef);
      console.log("📤 Upload returned:", uploadedUrl);
      console.log("📤 Upload returned type:", typeof uploadedUrl);

      if (uploadedUrl) {
        finalAudioUrl = uploadedUrl;
        console.log("✅ Audio uploaded to Supabase successfully!");
        console.log("✅ Final audio URL set to:", finalAudioUrl);
      } else {
        console.error("❌ Audio upload to Supabase returned null/undefined");
        console.warn("⚠️ Proceeding without audio");
      }
    } else {
      console.warn("⚠️ No audio chunks available for upload");
    }

    console.log("📤 finalAudioUrl for database:", finalAudioUrl);
    console.log("📤 ===== END AUDIO UPLOAD SECTION =====");

    console.log("💾 Saving call to database...");

    const payload = {
      call_id: callId,
      customer_name: finalOrderData?.customer_name || null,
      phone_number: finalOrderData?.phone_number || null,
      delivery_address: finalOrderData?.delivery_address || null,
      order_items: finalOrderData?.order_items || [],
      special_instructions: finalOrderData?.special_instructions || null,
      payment_method: finalOrderData?.payment_method || null,
      delivery_time: finalOrderData?.delivery_time || null,
      total_price: finalOrderData?.total_price || null,
      call_duration: callDuration,
      transcript: finalTranscript || [],
      audio_url: finalAudioUrl, // ✅ Use Supabase URL or fallback
      restaurant_id: restaurantId,
    };

    console.log("💾 ===== SAVE PAYLOAD DEBUG =====");
    console.log("💾 Audio URL in payload:", payload.audio_url);
    console.log("💾 Payload keys:", Object.keys(payload));

    // Use internal API endpoint
    const response = await fetch(`/api/calls/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("💾 API Response status:", response.status);

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `Failed to save call: ${response.status} - ${responseText}`,
      );
    }

    const result = JSON.parse(responseText);
    console.log("✅ CALL SAVED SUCCESSFULLY");
    console.log("✅ Audio URL in saved result:", result?.call?.audio_url);
    return result;
  } catch (error) {
    console.error("❌ ===== SAVE CALL FAILED =====");
    console.error("❌ Error:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    throw error;
  }
};

// Handle WebSocket messages
export const handleWebSocketMessage = (
  event,
  {
    currentCallIdRef,
    setOrderData,
    callSessionActiveRef,
    setTranscript,
    callStartTime,
    setCallStartTime,
    audioCtxRef,
    audioChunksRef,
    isTakenOverRef,
    restaurantId, // ✅ RECEIVE restaurantId
    callTimerStartedRef, // ✅ NEW: Ref to track if timer started
    isCallMutedRef, // 🔥 NEW: Mute state ref
    onOrderComplete, // 🔥 NEW: Callback for order completion
    onCallEnded, // 🔥 NEW: Callback for call ended
  },
) => {
  try {
    const data = JSON.parse(event.data);

    // Handle ping messages immediately without any logging
    if (data.type === "ping") {
      return;
    }

    // 🔥 NEW: Handle callEnded message type
    if (data.messageType === "callEnded") {
      console.log("📞 CALL ENDED MESSAGE RECEIVED");
      if (onCallEnded) {
        onCallEnded();
      }
      return;
    }

    // ✅ ENHANCED: Better call ID extraction
    if (
      (data.callSid || data.call_id || data.callId) &&
      !currentCallIdRef.current
    ) {
      const extractedCallId = data.callSid || data.call_id || data.callId;
      currentCallIdRef.current = extractedCallId;
      console.log(`📞 Server call_id received: ${extractedCallId}`);
    }

    // Handle takeover status updates
    if (data.messageType === "takeoverStatus") {
      return;
    }

    // ✅ ENHANCED: Better order update handling
    if (data.messageType === "orderUpdate" && data.orderData) {
      setOrderData((prev) => ({
        ...(prev || {}),
        ...data.orderData,
      }));
      return;
    }

    // 🔥 ENHANCED: Better order completion handling with callback
    if (data.messageType === "orderComplete" && data.orderData) {
      console.log("🎯 ORDER COMPLETE MESSAGE");
      setOrderData(data.orderData);
      callSessionActiveRef.current = false;

      // 🔥 NEW: Use callback instead of direct auto-save
      if (onOrderComplete) {
        onOrderComplete(data.orderData);
      }
      return;
    }

    // Handle audio messages with speaker detection
    if (
      (data.messageType === "audio" || data.type === "audio") &&
      (data.audio || data.audioBase64)
    ) {
      const base64Audio = data.audio || data.audioBase64;
      const speaker = data.speaker;

      // Don't play AI audio if human has taken over the call
      if ((speaker === "AI" || speaker === "ai") && isTakenOverRef.current) {
        return;
      }

      const format = data.format || data.encoding || "mulaw";
      const sampleRate =
        data.sampleRate ||
        data.sample_rate ||
        (format === "pcm16" ? 24000 : 8000);

      // 🔥 CRITICAL FIX: Create STABLE ID based on content hash, not random!
      // This prevents duplicate audio chunks from being played multiple times
      const timestamp = data.timestamp || Date.now();
      const audioLength = base64Audio.length;

      // Create stable ID: timestamp + speaker + audio length
      // If server sends same chunk twice, it will have same ID and be deduplicated
      const audioId =
        data.id ||
        data.audioId ||
        `audio_${timestamp}_${speaker}_${audioLength}`;

      // 🔥 FIXED: Check audio ready state ONLY for playback decision
      // Audio chunks should ALWAYS be recorded, even when audio is disabled!
      const audioReady =
        audioCtxRef.current && audioCtxRef.current.state === "running";

      // 🔥 CRITICAL: Determine if audio should be MUTED
      // Mute = don't play, but STILL record the chunks
      const shouldMute = !audioReady || isCallMutedRef.current;

      // 🔥 NEW: Always call playAudioHQ to record chunks
      // The mute flag will prevent playback but allow recording
      playAudioHQ(
        base64Audio,
        audioCtxRef,
        audioChunksRef,
        callSessionActiveRef,
        format,
        sampleRate,
        speaker,
        audioId, // 🔥 Pass stable ID
        shouldMute, // 🔥 FIXED: Mute when audio not ready or explicitly muted
      );
      return;
    }

    // ✅ ENHANCED: Better transcription handling with more message types
    if (
      (data.messageType === "text" ||
        data.messageType === "transcription" ||
        data.messageType === "transcript" ||
        data.type === "text" ||
        data.type === "transcript" ||
        data.type === "transcription" ||
        (data.speaker && data.text)) &&
      data.speaker &&
      data.text &&
      data.timestamp
    ) {
      // ✅ FIXED: Start timer ONLY on FIRST customer/caller message using ref
      if (
        !callTimerStartedRef.current &&
        (data.speaker === "customer" || data.speaker === "Caller")
      ) {
        callTimerStartedRef.current = true;
        setCallStartTime(Date.now());
        console.log("⏱️ Call timer started - FIRST caller message received");
      }

      setTranscript((prev) => {
        const timestampMs = data.timestamp;

        // Check for duplicates
        const isDuplicate = prev.some(
          (msg) =>
            msg.speaker === data.speaker &&
            msg.text === data.text &&
            Math.abs(msg.timestampRaw - timestampMs) < 2000,
        );

        if (isDuplicate) {
          return prev;
        }

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

        const updated = [...prev, newMessage].sort(
          (a, b) => a.timestampRaw - b.timestampRaw,
        );

        return updated;
      });
      return;
    }
  } catch (parseError) {
    console.error("❌ WebSocket message parse error:", parseError);
    console.error("❌ Raw message:", event.data);
  }
};
