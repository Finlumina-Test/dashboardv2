"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useDashboardState } from "../../../hooks/useDashboardState";
import { useMultiCallWebSocket } from "../../../hooks/useMultiCallWebSocket"; // 🔥 NEW: Multi-call hook
import { LeftSidebar } from "@/components/LeftSidebar";
import { MainContent } from "@/components/MainContent";
import { RightSidebar } from "@/components/RightSidebar";
import { CallEndedNotification } from "@/components/CallEndedNotification";
import { LogOut } from "lucide-react";
import { getBaseUrl, getRestaurantConfig } from "@/utils/restaurantConfig";
import { ConfirmationModal } from "@/components/ConfirmationModal";

// Create context for restaurant config
const RestaurantContext = createContext();
export const useRestaurantContext = () => useContext(RestaurantContext);

export default function FinluminaVoxDashboard({ params }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [restaurantConfig, setRestaurantConfig] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const restaurantParam = params.restaurant;

  // Always call hooks - they can't be conditional
  const {
    selectedCall,
    setSelectedCall,
    searchQuery,
    setSearchQuery,
    waveformData,
    currentView,
    setCurrentView,
    language,
    toggleLanguage,
    t,
  } = useDashboardState();

  // 🔥 NEW: Use multi-call WebSocket hook
  const {
    // Multi-call state
    calls,
    activeCallIds,
    selectedCallId,
    setSelectedCallId,
    selectedCall: multiCallSelectedCall,

    // Connection state
    isConnected,
    error,
    audioEnabled,
    audioActivity,
    isCallMuted,
    toggleCallMute,

    // Call ended state
    lastEndedCall,
    clearLastEndedCall,

    // Actions
    manualSaveCall,
    clearTranscript,
    clearOrder,
    toggleAudio,
    initAudioContext: initAudioCtx,
    takeOverCall,
    endTakeOver,
    toggleMicMute,
    endCall,
  } = useMultiCallWebSocket(restaurantParam);

  // 🔥 NEW: Legacy compatibility - extract data from selected call
  const transcript = multiCallSelectedCall?.transcript || [];
  const orderData = multiCallSelectedCall?.orderData || null;
  const isTakenOver = multiCallSelectedCall?.isTakenOver || false;
  const isMicMuted = multiCallSelectedCall?.isMicMuted || false;
  const callDuration = multiCallSelectedCall?.duration || 0;
  const isSaving = multiCallSelectedCall?.isSaving || false;
  const lastSaveStatus = multiCallSelectedCall?.lastSaveStatus || null;

  useEffect(() => {
    console.log("🔍 Dashboard authentication check started");

    // Get restaurant config from URL parameter
    const config = getRestaurantConfig(restaurantParam);
    if (!config) {
      console.log("❌ Invalid restaurant parameter, redirecting to login");
      window.location.href = "/";
      return;
    }

    // Check if user is authenticated for this specific restaurant
    const storedBackend = localStorage.getItem("restaurant_backend");

    console.log("🔍 Auth check:", {
      storedBackend,
      restaurantParam,
      config,
    });

    if (!storedBackend || storedBackend !== restaurantParam) {
      console.log(
        "❌ Not authenticated for this restaurant, redirecting to login",
      );
      localStorage.removeItem("restaurant_backend");
      window.location.href = "/";
      return;
    }

    console.log("✅ Authentication successful");
    setIsAuthenticated(true);
    setRestaurantConfig(config);
  }, [restaurantParam]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("restaurant_backend");
    window.location.href = "/login";
  };

  // Show loading while checking authentication
  if (!isAuthenticated || !restaurantConfig) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-lg">Checking authentication...</div>
      </div>
    );
  }

  return (
    <RestaurantContext.Provider value={restaurantConfig}>
      <div className="flex flex-col lg:flex-row min-h-screen bg-[#0a0a0a] text-white font-inter">
        {/* Left Sidebar - Hidden on mobile, shown as drawer/overlay would be ideal but for now hidden */}
        <div className="hidden lg:block">
          <LeftSidebar
            t={t}
            language={language}
            toggleLanguage={toggleLanguage}
            currentView={currentView}
            setCurrentView={setCurrentView}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCall={multiCallSelectedCall} // 🔥 FIX: Use multiCallSelectedCall
            setSelectedCall={setSelectedCall}
            // 🔥 NEW: Multi-call props
            calls={calls}
            activeCallIds={activeCallIds}
            selectedCallId={selectedCallId}
            setSelectedCallId={setSelectedCallId}
            isConnected={isConnected}
            backendUrl={restaurantParam}
            onLogout={handleLogout}
            // 🔥 NEW: Call mute controls
            isCallMuted={isCallMuted}
            toggleCallMute={toggleCallMute}
          />
        </div>

        {/* Mobile Top Bar */}
        <div className="lg:hidden bg-[#111111] border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/vox-logo.svg"
                alt="Vox Logo"
                className="w-14 h-14"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(253, 98, 98, 0.3))'
                }}
              />
              <div>
                <h1 className="text-lg font-bold text-white tracking-wide">
                  VOX
                </h1>
                <div className="text-xs text-gray-400 font-medium tracking-widest uppercase">
                  {restaurantParam.toUpperCase()} DASHBOARD
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="p-2 bg-[#1a1a1a] hover:bg-[#222222] rounded-lg transition-all border border-gray-800"
                title={
                  language === "english"
                    ? "Switch to Urdu"
                    : "Switch to English"
                }
              >
                <span className="text-xs text-gray-400">
                  {language === "english" ? "EN" : "UR"}
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-white" />
              </button>
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              ></div>
            </div>
          </div>

          {/* Mobile View Switcher */}
          <div className="flex gap-1 mt-4">
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === "dashboard"
                  ? "bg-white text-black"
                  : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222222] hover:text-white"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView("pos")}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === "pos"
                  ? "bg-white text-black"
                  : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222222] hover:text-white"
              }`}
            >
              POS
            </button>
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
              onClick={() => setCurrentView("history")}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === "history"
                  ? "bg-white text-black"
                  : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222222] hover:text-white"
              }`}
            >
              History
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[#0a0a0a] min-h-0">
          <MainContent
            t={t}
            currentView={currentView}
            selectedCall={multiCallSelectedCall} // 🔥 FIX: Use multiCallSelectedCall instead of old selectedCall
            callDuration={callDuration}
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
            initAudioContext={initAudioCtx}
            testAudio={null}
            backendUrl={restaurantParam}
            isSaving={isSaving}
            lastSaveStatus={lastSaveStatus}
            manualSaveCall={manualSaveCall}
            // 🔥 NEW: Multi-call props
            calls={calls}
            activeCallIds={activeCallIds}
            selectedCallId={selectedCallId}
            setSelectedCallId={setSelectedCallId}
            audioActivity={audioActivity}
            isCallMuted={isCallMuted}
            toggleCallMute={toggleCallMute}
          />
        </div>

        {/* Right Sidebar - Hidden on mobile */}
        {(currentView === "dashboard" || currentView === "pos") && (
          <div className="hidden lg:block">
            <RightSidebar
              t={t}
              selectedCall={multiCallSelectedCall} // 🔥 FIX: Use multiCallSelectedCall
              orderData={orderData}
              lastEndedCall={lastEndedCall}
              clearLastEndedCall={clearLastEndedCall}
            />
          </div>
        )}

        {/* Logout Confirmation Modal */}
        <ConfirmationModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={confirmLogout}
          title="Confirm Logout"
          message="Are you sure you want to log out?"
          confirmText="Logout"
          cancelText="Cancel"
        />

        {/* Call Ended Notification - Slides in from right */}
        <CallEndedNotification
          lastEndedCall={lastEndedCall}
          onDismiss={clearLastEndedCall}
        />

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
    </RestaurantContext.Provider>
  );
}
