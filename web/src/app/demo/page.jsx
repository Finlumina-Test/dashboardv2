"use client";

import { useState } from "react";

export default function DemoLanding() {
  const [sessionId, setSessionId] = useState("");
  const [showCallPopup, setShowCallPopup] = useState(false);

  const handleJoinSession = () => {
    if (sessionId.trim()) {
      window.location.href = `/demo/${sessionId.trim()}`;
    }
  };

  const handleCallForId = () => {
    // Show popup first
    setShowCallPopup(true);

    // Open phone dialer
    window.location.href = "tel:+17275135412";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-inter flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <img
            src="/vox-logo.svg"
            alt="Vox Logo"
            className="w-20 h-20 mx-auto"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(253, 98, 98, 0.3))'
            }}
          />
          <div>
            <h1 className="text-3xl font-bold text-white tracking-wide">
              VOX DEMO
            </h1>
            <p className="text-gray-400 mt-2">
              Call our demo line or enter your session ID to view your call
              dashboard
            </p>
          </div>
        </div>

        {/* Session Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session ID
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="e.g., x7k9mN"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleJoinSession()}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleJoinSession}
              disabled={!sessionId.trim()}
              className="flex-1 bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              Join Session
            </button>
            <button
              onClick={handleCallForId}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 border border-green-500 rounded-lg text-white transition-all flex items-center gap-2"
              title="Call to get your Session ID"
            >
              📞 Call
            </button>
          </div>
        </div>

        {/* Call Instructions */}
        <div className="bg-green-950 border border-green-800 rounded-lg p-4">
          <h3 className="text-green-400 font-semibold mb-2">
            📞 Get Your Session ID
          </h3>
          <p className="text-green-200 text-sm mb-2">
            Call{" "}
            <span className="font-mono text-green-100">+1 (727) 513-5412</span>{" "}
            to start a demo call
          </p>
          <p className="text-green-300 text-xs">
            Your unique session ID will be provided during the call for
            dashboard access
          </p>
        </div>

        {/* What to Test */}
        <div className="bg-[#111111] border border-gray-800 rounded-lg p-5 space-y-3">
          <h3 className="text-lg font-semibold text-white mb-3">💡 What to Test:</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-[#FD6262] mt-0.5">⚡</span>
              <div>
                <div className="text-white font-medium">Response Speed</div>
                <div className="text-gray-400 text-xs">Avg &lt;500ms latency - Try asking questions back-to-back</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#FD6262] mt-0.5">🎯</span>
              <div>
                <div className="text-white font-medium">Interruptions</div>
                <div className="text-gray-400 text-xs">~300ms - Cut the AI off mid-sentence and change your mind</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#FD6262] mt-0.5">🌍</span>
              <div>
                <div className="text-white font-medium">Language Switching</div>
                <div className="text-gray-400 text-xs">50+ languages - Switch between English/Urdu/Arabic mid-call</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#FD6262] mt-0.5">🎙️</span>
              <div>
                <div className="text-white font-medium">Live Dashboard</div>
                <div className="text-gray-400 text-xs">Watch the transcript & order details update in real-time</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#FD6262] mt-0.5">✨</span>
              <div>
                <div className="text-white font-medium">Your Ideas</div>
                <div className="text-gray-400 text-xs">Or whatever else you want - get creative!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>Each call gets a unique session ID</p>
          <p>
            Your dashboard will show real-time call data for that session only
          </p>
        </div>

        {/* Navigation */}
        <div className="pt-4">
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222222] text-gray-300 hover:text-white py-3 px-4 rounded-lg text-sm font-medium transition-all border border-gray-700"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Call Popup Modal */}
      {showCallPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 max-w-sm w-full">
            <div className="text-center space-y-4">
              <div className="text-4xl">📞</div>
              <h3 className="text-xl font-semibold text-white">
                Calling Demo Line
              </h3>
              <p className="text-gray-300 text-sm">
                Call{" "}
                <span className="font-mono text-green-400">
                  +1 (727) 513-5412
                </span>{" "}
                to receive your unique session ID
              </p>
              <p className="text-gray-400 text-xs">
                Once you get your session ID from the call, return here and
                enter it to access your dashboard
              </p>
              <button
                onClick={() => setShowCallPopup(false)}
                className="w-full bg-white text-black py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .font-inter {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>
    </div>
  );
}
