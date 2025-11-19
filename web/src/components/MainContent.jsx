"use client";

import { MainDashboard } from "./MainDashboard";
import { HistoryPanel } from "./HistoryPanel";
import { OrderPanel } from "./OrderPanel";
import { LiveOrderPanel } from "./LiveOrderPanel";
import { useState } from "react"; // 🔥 NEW

export function MainContent({
  t,
  currentView,
  selectedCall,
  callDuration,
  audioActivity,
  handleTakeOver,
  isTakenOver,
  endTakeOver,
  isMicMuted,
  toggleMicMute,
  endCall,
  orderData,
  isConnected,
  transcript,
  error,
  audioEnabled,
  clearTranscript,
  clearOrder,
  toggleAudio,
  initAudioContext,
  testAudio,
  backendUrl,
  isSaving,
  lastSaveStatus,
  manualSaveCall,
  isDemo = false, // NEW: Demo mode flag
  callStatus, // NEW: Call status for demo
  // 🔥 NEW: Multi-call props
  calls,
  activeCallIds,
  selectedCallId,
  setSelectedCallId,
  // 🔥 NEW: Per-call mute controls
  isCallMuted,
  toggleCallMute,
}) {
  // 🔥 NEW: POS view toggle between Live Orders and Order History
  const [posViewMode, setPosViewMode] = useState("live"); // "live" or "history"

  // 🔥 NEW: Don't show history in demo mode
  if (currentView === "history" && !isDemo) {
    return (
      <HistoryPanel t={t} backendUrl={backendUrl} isConnected={isConnected} />
    );
  }

  // 🔥 NEW: If demo mode and trying to access history, redirect to live
  if (currentView === "history" && isDemo) {
    // In demo mode, redirect history attempts to live view
    return (
      <MainDashboard
        t={t}
        currentView="live"
        selectedCall={selectedCall}
        selectedCallId={selectedCallId}
        audioActivity={audioActivity}
        handleTakeOver={handleTakeOver}
        endTakeOver={endTakeOver}
        toggleMicMute={toggleMicMute}
        endCall={endCall}
        isConnected={isConnected}
        error={error}
        audioEnabled={audioEnabled}
        clearTranscript={clearTranscript}
        clearOrder={clearOrder}
        toggleAudio={toggleAudio}
        initAudioContext={initAudioContext}
        testAudio={testAudio}
        manualSaveCall={manualSaveCall}
        isDemo={isDemo}
        callStatus={callStatus}
        isCallMuted={isCallMuted}
        toggleCallMute={toggleCallMute}
      />
    );
  }

  // 🔥 NEW: Enhanced POS view with toggle between Live Orders and History
  if (currentView === "pos") {
    return (
      <div className="flex flex-col h-full">
        {/* POS View Toggle */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-800">
          <h2 className="text-xl lg:text-2xl font-bold text-white">
            POS System
          </h2>
          <div className="flex bg-[#1a1a1a] rounded-lg border border-gray-800">
            <button
              onClick={() => setPosViewMode("live")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                posViewMode === "live"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white hover:bg-[#222]"
              }`}
            >
              Live Orders
            </button>
            <button
              onClick={() => setPosViewMode("history")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                posViewMode === "history"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white hover:bg-[#222]"
              }`}
            >
              Order History
            </button>
          </div>
        </div>

        {/* Content based on selected mode */}
        <div className="flex-1">
          {posViewMode === "live" ? (
            <LiveOrderPanel
              t={t}
              calls={calls}
              activeCallIds={activeCallIds}
              selectedCallId={selectedCallId}
              setSelectedCallId={setSelectedCallId}
              isConnected={isConnected}
              backendUrl={backendUrl}
              isSaving={isSaving}
              lastSaveStatus={lastSaveStatus}
              manualSaveCall={manualSaveCall}
              isDemo={isDemo}
              callStatus={callStatus}
            />
          ) : (
            <OrderPanel
              t={t}
              orderData={orderData}
              isConnected={isConnected}
              backendUrl={backendUrl}
              isSaving={isSaving}
              lastSaveStatus={lastSaveStatus}
              manualSaveCall={manualSaveCall}
              isDemo={isDemo}
              callStatus={callStatus}
            />
          )}
        </div>
      </div>
    );
  }

  // Default to MainDashboard for "dashboard" and "live" views
  return (
    <MainDashboard
      t={t}
      currentView={currentView}
      selectedCall={selectedCall}
      selectedCallId={selectedCallId}
      audioActivity={audioActivity}
      handleTakeOver={handleTakeOver}
      isTakenOver={isTakenOver}
      endTakeOver={endTakeOver}
      isMicMuted={isMicMuted}
      toggleMicMute={toggleMicMute}
      endCall={endCall}
      isConnected={isConnected}
      error={error}
      audioEnabled={audioEnabled}
      clearTranscript={clearTranscript}
      clearOrder={clearOrder}
      toggleAudio={toggleAudio}
      initAudioContext={initAudioContext}
      testAudio={testAudio}
      isSaving={isSaving}
      lastSaveStatus={lastSaveStatus}
      manualSaveCall={manualSaveCall}
      isDemo={isDemo}
      callStatus={callStatus}
      // 🔥 NEW: Pass demo props explicitly
      transcript={transcript}
      orderData={orderData}
      callDuration={callDuration}
      isCallMuted={isCallMuted}
      toggleCallMute={toggleCallMute}
    />
  );
}
