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
    <div className="card-gradient rounded-lg p-4 lg:p-8 mb-4 lg:mb-8 shadow-lg hover-lift">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 lg:mb-6 gap-3 lg:gap-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-accent to-accent-light rounded-lg flex items-center justify-center shadow-lg">
            <Mic className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base lg:text-lg font-light text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Audio Monitor
            </h3>
            <p className="text-xs text-[#b0b0b0]" style={{ fontFamily: 'var(--font-body)' }}>Real-time voice activity</p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3 h-3 lg:w-4 lg:h-4 text-[#b0b0b0]" />
            <div className="w-16 lg:w-20 h-1.5 bg-[#2a2a2c] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-200 ease-out"
                style={{ width: `${Math.min(100, audioActivity * 1.2)}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full shadow-lg transition-all duration-200 ${
                audioActivity > 10
                  ? "bg-accent shadow-accent/50 animate-pulse-soft"
                  : "bg-[#666] shadow-[#666]/50"
              }`}
            ></div>
            <span className="text-xs text-[#b0b0b0] uppercase tracking-wide" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              {audioActivity > 10 ? "LIVE" : "IDLE"}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Waveform Display */}
      <div className="relative h-20 lg:h-28 flex items-end justify-center gap-0.5 bg-[#141416] rounded-lg p-3 lg:p-6 border border-[rgba(79,79,80,0.3)] backdrop-blur-sm overflow-hidden">
        {/* Background grid effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-accent/5 to-transparent pointer-events-none"></div>

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
                      ${audioActivity > 20 ? "#FD6262" : "#FEB0B0"} 0%,
                      ${audioActivity > 20 ? "#ff7272" : "#FD6262"} 50%,
                      ${audioActivity > 20 ? "#ff8989" : "#ff7272"} 100%)`
                  : `linear-gradient(to top,
                      #3a3d50 0%,
                      #4a4d60 50%,
                      #5a5d70 100%)`,
                boxShadow:
                  isCenter && audioActivity > 10
                    ? `0 0 10px ${audioActivity > 20 ? "#FD6262" : "#FEB0B0"}40`
                    : "none",
                transform:
                  audioActivity > 0 && isCenter ? "scaleY(1.1)" : "scaleY(1)",
              }}
            />
          );
        })}

        {/* Center glow effect */}
        {audioActivity > 15 && (
          <div className="absolute inset-0 bg-gradient-radial from-accent/10 via-transparent to-transparent rounded-lg pointer-events-none animate-pulse-soft"></div>
        )}
      </div>

      {/* Audio Level Indicator */}
      <div className="mt-3 lg:mt-4 flex items-center justify-between text-xs text-[#b0b0b0]" style={{ fontFamily: 'var(--font-body)' }}>
        <span>Voice Level:</span>
        <span
          className={`font-mono ${audioActivity > 20 ? "text-accent" : "text-[#b0b0b0]"}`}
        >
          {Math.round(audioActivity)}dB
        </span>
      </div>
    </div>
  );
}
