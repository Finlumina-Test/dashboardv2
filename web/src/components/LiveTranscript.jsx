import { useEffect, useRef } from "react";

export function LiveTranscript({
  t,
  transcript,
  orderData,
  isConnected,
  error,
  audioEnabled,
  isTakenOver,
  clearTranscript,
  clearOrder,
  toggleAudio,
  initAudioContext,
  testAudio,
}) {
  const transcriptEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const handleClearAll = () => {
    clearTranscript();
    clearOrder();
  };

  return (
    <div className="flex flex-col card-gradient rounded-lg p-4 lg:p-6 h-[400px] lg:h-[500px] shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 lg:mb-6 gap-3 lg:gap-0 flex-shrink-0">
        <h3 className="text-base lg:text-lg font-light text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          {t.liveTranscript}
        </h3>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full shadow-lg ${
                isConnected
                  ? "bg-accent animate-pulse-soft shadow-accent/50"
                  : "bg-red-500 shadow-red-500/50"
              }`}
            ></div>
            <span className="text-xs lg:text-sm text-[#b0b0b0]" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              {isConnected ? t.realTime : "Disconnected"}
            </span>
          </div>

          {/* Audio Controls - Made More Prominent */}
          <div className="flex items-center gap-3 bg-[#1b1c1e] rounded p-2 border border-[rgba(79,79,80,0.3)]">
            <button
              onClick={toggleAudio}
              className={`px-3 lg:px-4 py-2 border rounded font-medium transition-all text-sm ${
                audioEnabled
                  ? "bg-accent border-accent text-white hover:bg-[#ff7272] shadow-lg"
                  : "border-[rgba(79,79,80,0.3)] text-[#b0b0b0] hover:border-accent/50 hover:bg-[#2a2a2c] bg-[#1b1c1e]"
              }`}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {audioEnabled ? "🔊 Audio ON" : "🔇 Audio OFF"}
            </button>

            {!audioEnabled && (
              <button
                onClick={initAudioContext}
                className="px-3 py-2 border border-accent/50 text-accent-light bg-accent/10 rounded hover:border-accent hover:bg-accent/20 transition-all text-sm font-medium"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                🎵 Enable Audio
              </button>
            )}

            {audioEnabled && (
              <button
                onClick={testAudio}
                className="px-3 py-2 border border-accent/50 text-accent-light bg-accent/10 rounded hover:border-accent hover:bg-accent/20 transition-all text-sm font-medium"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                🔔 Test Sound
              </button>
            )}

            {transcript.length > 0 && !isTakenOver && (
              <button
                onClick={handleClearAll}
                className="text-xs text-[#b0b0b0] hover:text-white px-2 py-1 border border-[rgba(79,79,80,0.3)] rounded hover:border-accent/50 transition-all"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-600/10 border border-red-500/30 rounded flex-shrink-0">
          <p className="text-sm text-red-400" style={{ fontFamily: 'var(--font-body)' }}>{error}</p>
        </div>
      )}

      {/* ✅ FIXED: Fixed height scrollable transcript container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0">
        {isTakenOver ? (
          // Show takeover message when human has taken over
          <div className="flex items-center justify-center h-full animate-fadeInUp">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-accent rounded-full animate-pulse-soft"></div>
              </div>
              <div>
                <h4 className="text-white font-light text-base lg:text-lg mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  🧑‍💼 Human Takeover Active
                </h4>
                <p className="text-[#b0b0b0] text-sm max-w-md px-4" style={{ fontFamily: 'var(--font-body)' }}>
                  Transcriptions are paused during human takeover. You're now
                  directly connected to the customer.
                </p>
              </div>
            </div>
          </div>
        ) : transcript.length === 0 ? (
          <div className="flex items-center justify-center h-full animate-fadeInUp">
            <p className="text-[#b0b0b0] text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              {isConnected
                ? "Waiting for conversation..."
                : "Connecting to media stream..."}
            </p>
          </div>
        ) : (
          <>
            {transcript.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-2 lg:gap-3 animate-fadeIn"
              >
                <div className="flex-shrink-0">
                  <span
                    className={`text-xs px-2 lg:px-3 py-1 rounded font-medium shadow-lg ${
                      entry.speaker === "AI" || entry.speaker === "ai"
                        ? "bg-accent text-white"
                        : entry.speaker === "human"
                          ? "bg-accent text-white"
                          : "bg-accent-light text-white"
                    }`}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {entry.speaker === "AI" || entry.speaker === "ai"
                      ? "Vox AI"
                      : entry.speaker === "human"
                        ? "Human Agent"
                        : "Caller"}
                  </span>
                </div>
                <div className="flex-1 bg-[#1b1c1e] rounded-lg p-3 lg:p-4 border border-[rgba(79,79,80,0.3)] hover:border-accent/30 transition-all">
                  <p className="text-sm text-white leading-relaxed" style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                    {entry.text}
                  </p>
                  <span className="text-xs text-[#666] font-mono mt-2 block" style={{ fontFamily: 'var(--font-body)' }}>
                    {entry.timestamp}
                  </span>
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
