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
    <div className="flex flex-col bg-[#111111] border border-gray-800 rounded-xl p-4 lg:p-6 h-[400px] lg:h-[500px]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 lg:mb-6 gap-3 lg:gap-0 flex-shrink-0">
        <h3 className="text-base lg:text-lg font-semibold text-white">
          {t.liveTranscript}
        </h3>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full shadow-lg ${
                isConnected
                  ? "bg-green-500 animate-pulse shadow-green-500/50"
                  : "bg-red-500 shadow-red-500/50"
              }`}
            ></div>
            <span className="text-xs lg:text-sm text-gray-400 font-bold">
              {isConnected ? t.realTime : "Disconnected"}
            </span>
          </div>

          {/* Audio Controls - Made More Prominent */}
          <div className="flex items-center gap-3 bg-gray-900/50 rounded-lg p-2 border border-gray-700">
            <button
              onClick={toggleAudio}
              className={`px-3 lg:px-4 py-2 border rounded-lg font-medium transition-colors text-sm ${
                audioEnabled
                  ? "bg-green-600 border-green-500 text-white hover:bg-green-700"
                  : "border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800 bg-gray-900"
              }`}
            >
              {audioEnabled ? "🔊 Audio ON" : "🔇 Audio OFF"}
            </button>

            {!audioEnabled && (
              <button
                onClick={initAudioContext}
                className="px-3 py-2 border border-blue-600 text-blue-400 bg-blue-900/20 rounded-lg hover:border-blue-500 hover:bg-blue-900/30 transition-colors text-sm font-medium"
              >
                🎵 Enable Audio
              </button>
            )}

            {audioEnabled && (
              <button
                onClick={testAudio}
                className="px-3 py-2 border border-yellow-600 text-yellow-400 bg-yellow-900/20 rounded-lg hover:border-yellow-500 hover:bg-yellow-900/30 transition-colors text-sm font-medium"
              >
                🔔 Test Sound
              </button>
            )}

            {transcript.length > 0 && !isTakenOver && (
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 border border-gray-700 rounded hover:border-gray-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex-shrink-0">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* ✅ FIXED: Fixed height scrollable transcript container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0">
        {isTakenOver ? (
          // Show takeover message when human has taken over
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-green-600 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h4 className="text-white font-semibold text-base lg:text-lg mb-2">
                  🧑‍💼 Human Takeover Active
                </h4>
                <p className="text-gray-400 text-sm max-w-md px-4">
                  Transcriptions are paused during human takeover. You're now
                  directly connected to the customer.
                </p>
              </div>
            </div>
          </div>
        ) : transcript.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">
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
                    className={`text-xs px-2 lg:px-3 py-1 rounded font-bold ${
                      entry.speaker === "AI" || entry.speaker === "ai"
                        ? "bg-[#FF4444] text-white"
                        : entry.speaker === "human"
                          ? "bg-green-600 text-white"
                          : "bg-blue-600 text-white"
                    }`}
                  >
                    {entry.speaker === "AI" || entry.speaker === "ai"
                      ? "Vox AI"
                      : entry.speaker === "human"
                        ? "Human Agent"
                        : "Caller"}
                  </span>
                </div>
                <div className="flex-1 bg-[#1a1a1a] rounded-lg p-3 lg:p-4 border border-gray-800">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {entry.text}
                  </p>
                  <span className="text-xs text-gray-600 font-mono mt-2 block">
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
