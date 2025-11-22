// ===== FILE 1: takeoverLogic.js =====
// Replace your entire takeoverLogic.js with this

import { encodeToMulaw, cancelScheduledAIAudio } from "./audioUtils";
import { getBaseUrl } from "@/utils/restaurantConfig";

// Take over call function
export const takeOverCall = async ({
  currentCallIdRef,
  setError,
  setIsTakenOver,
  humanAudioWsRef,
  micStreamRef,
  audioProcessorRef,
  micAudioCtxRef,
  isMicMutedRef,
  endTakeOver,
  restaurantId,
}) => {
  const callId = currentCallIdRef.current;

  if (!callId) {
    setError("No active call to take over");
    return;
  }

  if (!restaurantId) {
    setError("Restaurant ID is required for takeover");
    return;
  }

  try {
    console.log(
      `🎯 Taking over call: ${callId} for restaurant: ${restaurantId}`
    );

    const baseUrl = getBaseUrl(restaurantId);

    if (!baseUrl) {
      throw new Error(`No configuration found for restaurant: ${restaurantId}`);
    }

    console.log("✅ Using base URL:", baseUrl);

    // STEP 1: Enable takeover on server to STOP AI
    const takeoverResponse = await fetch(`${baseUrl}/takeover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Restaurant-ID": restaurantId,
      },
      body: JSON.stringify({
        callSid: callId,
        action: "enable",
        restaurantId: restaurantId,
      }),
    });

    if (!takeoverResponse.ok) {
      const errorText = await takeoverResponse.text();
      console.error("❌ Takeover failed:", errorText);
      throw new Error(
        `Failed to enable takeover: ${takeoverResponse.status} ${errorText}`
      );
    }

    const result = await takeoverResponse.json();
    console.log("✅ Takeover API response:", result);
    console.log("✅ Takeover enabled on server - AI stopped");

    // 🔥 NEW: Cancel all scheduled AI audio immediately
    cancelScheduledAIAudio();

    setIsTakenOver(true);

    // STEP 2: Connect to human audio WebSocket
    const humanAudioWs = new WebSocket(
      `${baseUrl.replace("https://", "wss://")}/human-audio/${callId}?restaurant_id=${restaurantId}`
    );
    humanAudioWsRef.current = humanAudioWs;

    humanAudioWs.onopen = async () => {
      console.log("✅ Connected to human audio endpoint");

      try {
        // STEP 3: Capture microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 8000,
          },
        });
        micStreamRef.current = stream;
        console.log("🎤 Microphone access granted");

        // STEP 4: Create audio context for microphone (8kHz for µ-law)
        const audioContext = new AudioContext({ sampleRate: 8000 });
        micAudioCtxRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);

        // STEP 5: Convert to µ-law and send to server
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        audioProcessorRef.current = processor;

        let audioSentCount = 0;
        let lastLogTime = 0;

        processor.onaudioprocess = (e) => {
          // 🔥 DEBUG: Log state every 100 chunks (~2 seconds)
          const now = Date.now();
          if (now - lastLogTime > 2000) {
            const wsState = humanAudioWsRef.current?.readyState;
            const isMuted = isMicMutedRef[callId];
            console.log(`🎤 TAKEOVER AUDIO: WS=${wsState === WebSocket.OPEN ? 'OPEN' : 'NOT OPEN'}, Muted=${isMuted}, Sent=${audioSentCount} chunks`);
            lastLogTime = now;
            audioSentCount = 0;
          }

          // 🔥 FIX: Check mic mute status from ref (isMicMutedRef is now the whole object, indexed by callId)
          if (
            humanAudioWsRef.current?.readyState === WebSocket.OPEN &&
            !isMicMutedRef[callId]
          ) {
            const pcmData = e.inputBuffer.getChannelData(0);
            const mulawData = encodeToMulaw(pcmData);
            const base64 = btoa(String.fromCharCode(...mulawData));

            humanAudioWsRef.current.send(
              JSON.stringify({
                type: "audio",
                audio: base64,
              })
            );
            audioSentCount++;
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        console.log("🎤 Microphone streaming started - You can now talk!");
      } catch (micError) {
        console.error("❌ Failed to capture microphone:", micError);
        setError("Failed to access microphone - check browser permissions");
        endTakeOver();
      }
    };

    humanAudioWs.onerror = (error) => {
      console.error("❌ Human audio WebSocket error:", error);
      setError("Failed to connect to human audio endpoint");
      endTakeOver();
    };

    humanAudioWs.onclose = () => {
      console.log("🔌 Human audio WebSocket closed");
    };
  } catch (error) {
    console.error("❌ Failed to take over call:", error);
    setError(`Failed to take over call: ${error.message}`);
    setIsTakenOver(false);
  }
};

// End take over function
export const endTakeOver = async ({
  micStreamRef,
  audioProcessorRef,
  micAudioCtxRef,
  humanAudioWsRef,
  currentCallIdRef,
  setIsTakenOver,
  setIsMicMuted,
  restaurantId,
}) => {
  console.log("🛑 Ending takeover...");

  // STEP 1: Stop microphone stream
  if (micStreamRef.current) {
    micStreamRef.current.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    console.log("🎤 Microphone stopped");
  }

  // STEP 2: Disconnect processor
  if (audioProcessorRef.current) {
    audioProcessorRef.current.disconnect();
    audioProcessorRef.current = null;
  }

  // STEP 3: Close microphone audio context
  if (micAudioCtxRef.current) {
    micAudioCtxRef.current.close();
    micAudioCtxRef.current = null;
  }

  // STEP 4: Close human audio WebSocket
  if (humanAudioWsRef.current) {
    humanAudioWsRef.current.close();
    humanAudioWsRef.current = null;
    console.log("🔌 Audio WebSocket closed");
  }

  // STEP 5: Disable takeover on server to RESUME AI
  if (currentCallIdRef.current && restaurantId) {
    try {
      const baseUrl = getBaseUrl(restaurantId);

      if (!baseUrl) {
        throw new Error(
          `No configuration found for restaurant: ${restaurantId}`
        );
      }

      const response = await fetch(`${baseUrl}/takeover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Restaurant-ID": restaurantId,
        },
        body: JSON.stringify({
          callSid: currentCallIdRef.current,
          action: "disable",
          restaurantId: restaurantId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Failed to disable takeover:", errorText);
      } else {
        const result = await response.json();
        console.log("✅ Takeover disabled on server - AI resumed:", result);
      }
    } catch (error) {
      console.error("❌ Failed to disable takeover on server:", error);
    }
  }

  setIsTakenOver(false);
  setIsMicMuted(false);
  console.log("✅ Takeover ended successfully");
};

// End call function
export const endCall = async (currentCallIdRef, restaurantId) => {
  if (!currentCallIdRef.current) {
    throw new Error("No active call to end");
  }

  if (!restaurantId) {
    throw new Error("Restaurant ID is required to end call");
  }

  const callIdForSave = currentCallIdRef.current;

  try {
    console.log(`📞 ===== ATTEMPTING TO END CALL =====`);
    console.log(`📞 Call SID: ${callIdForSave}`);
    console.log(`🏪 Restaurant ID: ${restaurantId}`);

    const baseUrl = getBaseUrl(restaurantId);
    if (!baseUrl) {
      throw new Error(`No configuration found for restaurant: ${restaurantId}`);
    }

    console.log(`📞 Base URL: ${baseUrl}`);

    let endCallUrl = `${baseUrl}/end-call`;
    let requestBody = {
      callSid: callIdForSave,
      restaurantId: restaurantId,
    };

    console.log(`📞 Endpoint: ${endCallUrl}`);
    console.log(`📞 Request body:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch(endCallUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Restaurant-ID": restaurantId,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(
      `📞 Response status: ${response.status} ${response.statusText}`
    );

    const responseText = await response.text();
    console.log(`📞 Response body:`, responseText);

    if (!response.ok) {
      console.error("❌ End call failed:", responseText);

      // Try alternative endpoint
      if (response.status === 404 || response.status === 405) {
        console.log("🔄 Trying alternative endpoint: /hangup");

        const altResponse = await fetch(`${baseUrl}/hangup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Restaurant-ID": restaurantId,
          },
          body: JSON.stringify(requestBody),
        });

        const altResponseText = await altResponse.text();
        console.log(
          `📞 Alt response: ${altResponse.status} - ${altResponseText}`
        );

        if (!altResponse.ok) {
          throw new Error(
            `Failed to end call: ${response.status} ${responseText} | Alt: ${altResponse.status} ${altResponseText}`
          );
        }

        console.log("✅ Call ended via alternative endpoint");
      } else {
        throw new Error(
          `Failed to end call: ${response.status} ${responseText}`
        );
      }
    } else {
      try {
        const result = JSON.parse(responseText);
        console.log("✅ Call ended successfully:", result);
      } catch (parseErr) {
        console.log("✅ Call ended, non-JSON response:", responseText);
      }
    }

    console.log("🔄 Call end request complete");

    return { success: true };
  } catch (error) {
    console.error("❌ ===== END CALL FAILED =====");
    console.error("❌ Error:", error);
    throw error;
  }
};