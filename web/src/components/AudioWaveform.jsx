import { useState, useEffect } from "react";
import { Volume2, Mic } from "lucide-react";

export function AudioWaveform({ t, audioActivity = 0 }) {
  const [waveformBars, setWaveformBars] = useState([]);

  // Generate dynamic waveform based on audio activity
  useEffect(() => {
    const generateWaveform = () => {
      const numBars = 60; // More bars for smoother look
      const newBars = [];

      for (let i = 0; i < numBars; i++) {
        if (audioActivity > 0) {
          // Create a wave pattern with audio influence
          const wave = Math.sin((i / numBars) * Math.PI * 4) * 30; // Sine wave base
          const audioInfluence =
            audioActivity * Math.random() * 0.8 + audioActivity * 0.2;
          const centerBoost = Math.exp(
            -Math.pow(i - numBars / 2, 2) / (numBars * 2),
          ); // Center emphasis
          const height = Math.max(
            4,
            Math.min(80, Math.abs(wave) + audioInfluence + centerBoost * 20),
          );
          newBars.push(height);
        } else {
          // Gentle baseline when no audio
          const baseline = Math.sin((i / numBars) * Math.PI * 2) * 8 + 12;
          newBars.push(Math.max(4, baseline));
        }
      }

      setWaveformBars(newBars);
    };

    generateWaveform();

    // Smooth updates
    const interval = setInterval(
      generateWaveform,
      audioActivity > 0 ? 80 : 1500,
    );

    return () => clearInterval(interval);
  }, [audioActivity]);

  return (
    <div className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-gray-800 rounded-2xl p-4 lg:p-8 mb-4 lg:mb-8 shadow-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 lg:mb-6 gap-3 lg:gap-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-white to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
            <Mic className="w-4 h-4 lg:w-5 lg:h-5 text-black" />
          </div>
          <div>
            <h3 className="text-base lg:text-lg font-bold text-white">
              Audio Monitor
            </h3>
            <p className="text-xs text-gray-400">Real-time voice activity</p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400" />
            <div className="w-16 lg:w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${Math.min(100, audioActivity * 1.2)}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full shadow-lg transition-all duration-200 ${
                audioActivity > 10
                  ? "bg-green-400 shadow-green-400/50 animate-pulse"
                  : "bg-gray-600 shadow-gray-600/50"
              }`}
            ></div>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              {audioActivity > 10 ? "LIVE" : "IDLE"}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Waveform Display */}
      <div className="relative h-20 lg:h-28 flex items-end justify-center gap-0.5 bg-black/50 rounded-xl p-3 lg:p-6 border border-gray-700/50 backdrop-blur-sm overflow-hidden">
        {/* Background grid effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent pointer-events-none"></div>

        {waveformBars.map((height, i) => {
          const normalizedIndex = i / waveformBars.length;
          const isCenter = Math.abs(normalizedIndex - 0.5) < 0.3;

          return (
            <div
              key={i}
              className={`rounded-full transition-all duration-200 ease-out ${
                audioActivity > 0 ? "opacity-90" : "opacity-40"
              }`}
              style={{
                height: `${height}px`,
                width: "2px",
                background: isCenter
                  ? `linear-gradient(to top, 
                      ${audioActivity > 20 ? "#10b981" : "#3b82f6"} 0%, 
                      ${audioActivity > 20 ? "#34d399" : "#60a5fa"} 50%, 
                      ${audioActivity > 20 ? "#6ee7b7" : "#93c5fd"} 100%)`
                  : `linear-gradient(to top, 
                      #374151 0%, 
                      #6b7280 50%, 
                      #9ca3af 100%)`,
                boxShadow:
                  isCenter && audioActivity > 10
                    ? `0 0 10px ${audioActivity > 20 ? "#10b981" : "#3b82f6"}40`
                    : "none",
                transform:
                  audioActivity > 0 && isCenter ? "scaleY(1.1)" : "scaleY(1)",
              }}
            />
          );
        })}

        {/* Center glow effect */}
        {audioActivity > 15 && (
          <div className="absolute inset-0 bg-gradient-radial from-green-400/10 via-transparent to-transparent rounded-xl pointer-events-none animate-pulse"></div>
        )}
      </div>

      {/* Audio Level Indicator */}
      <div className="mt-3 lg:mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>Voice Level:</span>
        <span
          className={`font-mono ${audioActivity > 20 ? "text-green-400" : "text-gray-400"}`}
        >
          {Math.round(audioActivity)}dB
        </span>
      </div>
    </div>
  );
}
