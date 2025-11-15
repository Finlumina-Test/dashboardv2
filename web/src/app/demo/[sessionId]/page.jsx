"use client";

import { useState, useEffect } from "react";
import { useWebSocketDemo } from "../../../hooks/useWebSocketDemo";
import { MainContent } from "@/components/MainContent";
import { RightSidebar } from "@/components/RightSidebar";
import { Home, AlertCircle } from "lucide-react";

// Mock translation object for demo
const mockT = (key) => {
  const translations = {
    live: "Live",
    dashboard: "Dashboard",
    pos: "Current Order",
    history: "History",
    waitingForCall: "Waiting for call to start...",
    callActive: "Call Active",
    callEnded: "Call Ended",
    sessionDemo: "Session Demo",
  };
  return translations[key] || key;
};

export default function DemoSessionDashboard({ params }) {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState(null);
  const [currentView, setCurrentView] = useState("live");

  const sessionId = params.sessionId;

  const {
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
    callStatus,
    manualSaveCall,
    takeOverCall,
    endTakeOver,
    toggleMicMute,
    endCall,
    clearTranscript,
    clearOrder,
    toggleAudio,
    initAudioContext,
    testAudio,
  } = useWebSocketDemo(sessionId);

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      try {
        console.log("🔍 Validating session:", sessionId);

        const response = await fetch(`/api/validate-session/${sessionId}`);
        const result = await response.json();

        console.log("🔍 Validation result:", result);

        if (!result.valid) {
          setValidationError(result.error || "Invalid session");
          setLoading(false);
          return;
        }

        setSessionData(result);
        setLoading(false);
        console.log("✅ Session validated successfully");
      } catch (err) {
        console.error("❌ Session validation error:", err);
        setValidationError("Failed to validate session");
        setLoading(false);
      }
    };

    if (sessionId) {
      validateSession();
    }
  }, [sessionId]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-white text-lg">Validating session...</div>
        </div>
      </div>
    );
  }

  // Show validation error
  if (validationError) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Session Invalid
              </h1>
              <p className="text-gray-400">{validationError}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = "/demo")}
              className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all"
            >
              Try Another Session
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full bg-[#1a1a1a] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#222222] transition-all border border-gray-700"
            >
              Back to Main Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0a0a0a] text-white font-inter">
      {/* Left Sidebar - Demo Info */}
      <div className="hidden lg:block w-80 bg-[#111111] border-r border-gray-800">
        <div className="p-6 border-b border-gray-800">
          {/* Logo and Session Info */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src="https://ucarecdn.com/318a2f4a-0da5-416c-b58e-d4512d02da5e/-/format/auto/"
              alt="Vox Logo"
              className="w-12 h-12 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                VOX DEMO
              </h1>
              <div className="text-xs text-gray-400 font-medium tracking-wide uppercase">
                {sessionId}
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm text-gray-300">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* Call Status */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Call Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Status:</span>
                <span
                  className={`text-xs font-medium ${
                    callStatus === "waiting"
                      ? "text-yellow-400"
                      : callStatus === "active"
                        ? "text-green-400"
                        : "text-gray-400"
                  }`}
                >
                  {callStatus === "waiting" && "Waiting"}
                  {callStatus === "active" && "Active"}
                  {callStatus === "ended" && "Ended"}
                </span>
              </div>
              {callDuration > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Duration:</span>
                  <span className="text-xs text-white">
                    {Math.floor(callDuration / 60)}:
                    {String(callDuration % 60).padStart(2, "0")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Demo Features */}
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">
            Available Features
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-300">
                Real-time transcripts
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-300">Order tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-300">Audio visualization</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-300">Human takeover</span>
            </div>
          </div>

          {/* Back to Demo */}
          <div className="pt-4 border-t border-gray-800">
            <button
              onClick={() => (window.location.href = "/demo")}
              className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222222] text-gray-300 hover:text-white py-2 px-4 rounded-lg text-sm font-medium transition-all border border-gray-700"
            >
              <Home className="w-4 h-4" />
              Back to Demo
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-[#111111] border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://ucarecdn.com/318a2f4a-0da5-416c-b58e-d4512d02da5e/-/format/auto/"
              alt="Vox Logo"
              className="w-10 h-10 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">
                VOX DEMO
              </h1>
              <div className="text-xs text-gray-400 font-medium">
                {sessionId}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            ></div>
            <span
              className={`text-xs font-medium ${
                callStatus === "waiting"
                  ? "text-yellow-400"
                  : callStatus === "active"
                    ? "text-green-400"
                    : "text-gray-400"
              }`}
            >
              {callStatus === "waiting" && "Waiting"}
              {callStatus === "active" && "Live"}
              {callStatus === "ended" && "Ended"}
            </span>
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="flex gap-1 mt-4">
          <button
            onClick={() => setCurrentView("live")}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === "live"
                ? "bg-white text-black"
                : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222222] hover:text-white"
            }`}
          >
            Live
          </button>
          <button
            onClick={() => setCurrentView("pos")}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === "pos"
                ? "bg-white text-black"
                : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222222] hover:text-white"
            }`}
          >
            Order
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#0a0a0a] min-h-0">
        {callStatus === "waiting" && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto"></div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Waiting for Call
                </h2>
                <p className="text-gray-400">
                  Your dashboard will update when the call starts
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Session: {sessionId}
                </p>
              </div>
            </div>
          </div>
        )}

        {(callStatus === "active" || callStatus === "ended") && (
          <MainContent
            t={mockT}
            currentView={currentView}
            selectedCall={null}
            callDuration={callDuration}
            audioActivity={audioActivity}
            handleTakeOver={takeOverCall}
            isTakenOver={isTakenOver}
            endTakeOver={endTakeOver}
            isMicMuted={isMicMuted}
            toggleMicMute={toggleMicMute}
            endCall={endCall}
            orderData={orderData}
            isConnected={isConnected}
            transcript={transcript}
            error={error}
            audioEnabled={audioEnabled}
            clearTranscript={clearTranscript}
            clearOrder={clearOrder}
            toggleAudio={toggleAudio}
            initAudioContext={initAudioContext}
            testAudio={testAudio}
            backendUrl="demo"
            isSaving={isSaving}
            lastSaveStatus={lastSaveStatus}
            manualSaveCall={manualSaveCall}
            isDemo={true}
            callStatus={callStatus}
          />
        )}
      </div>

      {/* Right Sidebar - Order Display */}
      {(currentView === "pos" || currentView === "live") && orderData && (
        <div className="hidden lg:block">
          <RightSidebar
            t={mockT}
            selectedCall={null}
            orderData={orderData}
            isDemo={true}
          />
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        .font-inter {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
        
        /* Mobile scrollbar styling */
        @media (max-width: 1024px) {
          ::-webkit-scrollbar {
            width: 4px;
          }
        }
      `}</style>
    </div>
  );
}
