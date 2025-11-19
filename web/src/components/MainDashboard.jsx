"use client";

import {
  PhoneCall,
  Save,
  CheckCircle,
  AlertCircle,
  Loader,
  Clock,
  MapPin,
  Phone,
  User,
  Mic,
  MicOff,
  UserCheck,
  PhoneOff,
  Volume2,
  VolumeX,
  Trash2,
  RotateCcw,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { AudioWaveform } from "./AudioWaveform";
import { CallControls } from "./CallControls";
import { LiveTranscript } from "./LiveTranscript";
import { formatDuration, getStatusBadge } from "@/utils/dashboardUtils";
import { useState } from "react";
import { ConfirmationModal } from "./ConfirmationModal";

export function MainDashboard({
  t,
  currentView,
  selectedCall,
  selectedCallId,
  audioActivity,
  handleTakeOver,
  isTakenOver,
  endTakeOver,
  isMicMuted,
  toggleMicMute,
  endCall,
  isConnected,
  error,
  audioEnabled,
  clearTranscript,
  clearOrder,
  toggleAudio,
  initAudioContext,
  testAudio,
  isSaving,
  lastSaveStatus,
  manualSaveCall,
  isDemo,
  callStatus,
  transcript: transcriptProp,
  orderData: orderDataProp,
  callDuration: callDurationProp,
  // 🔥 NEW: Per-call mute controls
  isCallMuted,
  toggleCallMute,
}) {
  const [showTakeOverModal, setShowTakeOverModal] = useState(false);
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [showEndTakeOverModal, setShowEndTakeOverModal] = useState(false);

  // Only show for dashboard and live views
  if (currentView !== "dashboard" && currentView !== "live") {
    return null;
  }

  // Get data from selected call object OR demo props
  const callDuration = callDurationProp ?? selectedCall?.duration ?? 0;
  const orderData = orderDataProp ?? selectedCall?.orderData ?? null;
  const transcript = transcriptProp ?? selectedCall?.transcript ?? [];
  const isCallEnded = selectedCall?.isCallEnded || false;
  const currentAudioActivity = selectedCallId
    ? (typeof audioActivity === 'object' ? audioActivity[selectedCallId] : audioActivity) || 0
    : (typeof audioActivity === 'number' ? audioActivity : 0);

  // Save button logic
  const hasTranscript = transcript && transcript.length > 0;
  const hasOrderData =
    orderData &&
    (orderData.customer_name ||
      orderData.phone_number ||
      orderData.delivery_address ||
      orderData.total_price ||
      (orderData.order_items && orderData.order_items.length > 0));
  const hasContent = hasTranscript || hasOrderData;
  const canSave = hasContent && !isSaving && (selectedCallId || isDemo);

  const getButtonText = () => {
    if (isSaving) return "Saving...";
    if (!selectedCallId && !isDemo) return "No Call Selected";
    if (!hasContent) return "No Content to Save";
    return "Save Call";
  };

  const handleSaveClick = () => {
    if (canSave) {
      if (isDemo) {
        // Demo mode save
        console.log("Demo save clicked");
      } else {
        // Real save
        manualSaveCall(selectedCallId);
      }
    }
  };

  // Format duration
  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // No call selected - 2025 Enhanced Empty State
  if (!selectedCallId && !isDemo) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-[#0a0a0a] via-[#141416] to-[#0a0a0a]">
        <div className="text-center max-w-md animate-fadeInUp">
          <div className="relative mb-8">
            <div className="w-28 h-28 bg-gradient-to-br from-[#FD6262]/20 to-[#FD6262]/5 rounded-3xl flex items-center justify-center mx-auto border border-[#FD6262]/20 shadow-2xl shadow-[#FD6262]/10">
              <PhoneCall className="w-14 h-14 text-[#FD6262]/60" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#FD6262] to-[#ff7272] rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            No Call Selected
          </h3>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Select a call from the sidebar to view live details, transcript, and controls
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Waiting for calls...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#141416] to-[#0a0a0a]">
      {/* Quick Stats Bar - 2025 Trend */}
      {!isCallEnded && hasContent && (
        <div className="border-b border-white/5 bg-gradient-to-r from-[#FD6262]/5 to-transparent px-6 py-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-6">
              {/* Transcript Count */}
              {transcript.length > 0 && (
                <div className="flex items-center gap-2 group cursor-help" title="Total messages in conversation">
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-colors border border-white/10">
                    <PhoneCall className="w-4 h-4 text-[#FD6262]" />
                  </div>
                  <div>
                    <p className="text-white font-bold">{transcript.length}</p>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wide">Messages</p>
                  </div>
                </div>
              )}

              {/* Order Items Count */}
              {orderData?.order_items && orderData.order_items.length > 0 && (
                <div className="flex items-center gap-2 group cursor-help" title="Items in current order">
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-colors border border-white/10">
                    <ShoppingCart className="w-4 h-4 text-[#FD6262]" />
                  </div>
                  <div>
                    <p className="text-white font-bold">{orderData.order_items.length}</p>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wide">Items</p>
                  </div>
                </div>
              )}

              {/* Total Price */}
              {orderData?.total_price && (
                <div className="flex items-center gap-2 group cursor-help" title="Total order value">
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-colors border border-white/10">
                    <span className="text-[#FD6262] font-bold text-sm">$</span>
                  </div>
                  <div>
                    <p className="text-white font-bold">${orderData.total_price}</p>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wide">Total</p>
                  </div>
                </div>
              )}
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-lg border border-green-500/30">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 font-semibold text-[10px] uppercase tracking-wide">Live Call</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar - Call Status & Timer */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Call Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center border ${
                  isCallEnded
                    ? 'from-gray-700 to-gray-800 border-gray-700'
                    : 'from-[#FD6262] to-[#ff8888] border-[#FD6262]/50 animate-pulse-slow'
                }`}>
                  {orderData?.customer_name ? (
                    <span className="text-xl font-bold text-white">
                      {orderData.customer_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </span>
                  ) : (
                    <Phone className="w-6 h-6 text-white" />
                  )}
                </div>
                {!isCallEnded && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {orderData?.customer_name || "Incoming Call"}
                  {isCallEnded && (
                    <span className="px-2 py-0.5 bg-gray-700/50 text-gray-300 text-xs rounded-md border border-gray-600">
                      ENDED
                    </span>
                  )}
                  {!isCallEnded && isTakenOver && (
                    <span className="px-2 py-0.5 bg-[#FD6262]/20 text-[#FD6262] text-xs rounded-md border border-[#FD6262]/30 animate-pulse">
                      YOU'RE LIVE
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(callDuration)}
                  {selectedCallId && (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-xs text-gray-500">ID: {selectedCallId.substring(0, 8)}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Audio Status */}
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                isConnected
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected && 'animate-pulse'}`} />
                <span className="text-xs font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>

              {/* Audio Waveform - Minimal */}
              <div className="px-4 py-2 bg-black/30 rounded-lg border border-white/5">
                <AudioWaveform audioActivity={currentAudioActivity} minimal={true} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Side - Transcript & Order */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Order Data Card */}
            {hasOrderData && (
              <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-[#FD6262]/20 to-transparent px-6 py-4 border-b border-white/10">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-[#FD6262]" />
                    Customer Information
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {/* Customer Details */}
                  <div className="grid grid-cols-2 gap-4">
                    {orderData.customer_name && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Name</p>
                        <p className="text-white font-medium">{orderData.customer_name}</p>
                      </div>
                    )}
                    {orderData.phone_number && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Phone</p>
                        <p className="text-white font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#FD6262]" />
                          {orderData.phone_number}
                        </p>
                      </div>
                    )}
                  </div>

                  {orderData.delivery_address && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Delivery Address</p>
                      <p className="text-white font-medium flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#FD6262] mt-0.5 flex-shrink-0" />
                        <span>{orderData.delivery_address}</span>
                      </p>
                    </div>
                  )}

                  {/* Order Items */}
                  {orderData.order_items && orderData.order_items.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Order Items</p>
                      <div className="space-y-2">
                        {orderData.order_items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:border-[#FD6262]/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#FD6262]/20 rounded-lg flex items-center justify-center border border-[#FD6262]/30">
                                <span className="text-[#FD6262] font-bold text-sm">{item.quantity || 1}</span>
                              </div>
                              <span className="text-white font-medium">{item.item}</span>
                            </div>
                            {item.price && (
                              <span className="text-[#FD6262] font-bold">${item.price}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  {orderData.total_price && (
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                      <span className="text-lg font-bold text-white">Total</span>
                      <span className="text-2xl font-bold text-[#FD6262]">${orderData.total_price}</span>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    {orderData.delivery_time && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Delivery Time</p>
                        <p className="text-white font-medium">{orderData.delivery_time}</p>
                      </div>
                    )}
                    {orderData.payment_method && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Payment</p>
                        <p className="text-white font-medium">{orderData.payment_method}</p>
                      </div>
                    )}
                  </div>

                  {orderData.special_instructions && (
                    <div className="space-y-1 pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Special Instructions</p>
                      <p className="text-white italic">{orderData.special_instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transcript Card */}
            <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col min-h-[400px]">
              <div className="bg-gradient-to-r from-[#FD6262]/20 to-transparent px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-[#FD6262]" />
                  Live Transcript
                  {transcript.length > 0 && (
                    <span className="px-2 py-0.5 bg-[#FD6262]/20 text-[#FD6262] text-xs rounded-md border border-[#FD6262]/30">
                      {transcript.length}
                    </span>
                  )}
                </h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <LiveTranscript
                  t={t}
                  transcript={transcript}
                  orderData={orderData}
                  isConnected={isConnected}
                  error={error}
                  isTakenOver={isTakenOver}
                  clearTranscript={clearTranscript}
                  clearOrder={clearOrder}
                  selectedCallId={selectedCallId}
                  isCallMuted={isCallMuted}
                  toggleCallMute={toggleCallMute}
                  audioEnabled={audioEnabled}
                  toggleAudio={toggleAudio}
                  isDemo={isDemo}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Call Controls */}
        <div className="w-96 border-l border-white/5 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl flex flex-col">
          <div className="p-6 space-y-4">
            {/* Call Controls Header */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Call Controls</h3>

              {/* Main Control Buttons */}
              {!isCallEnded && (
                <div className="space-y-3">
                  {!isTakenOver ? (
                    // Take Over Button
                    <button
                      onClick={() => setShowTakeOverModal(true)}
                      className="w-full px-3 py-2.5 lg:px-6 lg:py-4 bg-gradient-to-r from-[#FD6262] to-[#ff8585] hover:from-[#ff7272] hover:to-[#ff9595] text-white rounded-xl font-bold flex items-center justify-center gap-2 lg:gap-3 transition-all duration-300 shadow-lg shadow-[#FD6262]/30 hover:shadow-[#FD6262]/50 hover:scale-105 border border-[#FD6262]/50 text-sm lg:text-base"
                    >
                      <UserCheck className="w-4 h-4 lg:w-5 lg:h-5" />
                      Take Over Call
                    </button>
                  ) : (
                    // Active Controls
                    <div className="space-y-3">
                      {/* Mic Control */}
                      <button
                        onClick={toggleMicMute}
                        className={`w-full px-3 py-2.5 lg:px-6 lg:py-4 rounded-xl font-bold flex items-center justify-center gap-2 lg:gap-3 transition-all duration-300 shadow-lg border text-sm lg:text-base ${
                          isMicMuted
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 border-red-500'
                            : 'bg-gradient-to-r from-[#FD6262] to-[#ff8585] hover:from-[#ff7272] hover:to-[#ff9595] text-white shadow-[#FD6262]/30 border-[#FD6262]/50'
                        }`}
                      >
                        {isMicMuted ? <MicOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Mic className="w-4 h-4 lg:w-5 lg:h-5" />}
                        {isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                      </button>

                      {/* End Takeover Button */}
                      <button
                        onClick={() => setShowEndTakeOverModal(true)}
                        className="w-full px-3 py-2.5 lg:px-6 lg:py-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 lg:gap-3 transition-all duration-300 shadow-lg border border-gray-600 text-sm lg:text-base"
                      >
                        <RotateCcw className="w-4 h-4 lg:w-5 lg:h-5" />
                        Return to AI
                      </button>
                    </div>
                  )}

                  {/* End Call Button */}
                  <button
                    onClick={() => setShowEndCallModal(true)}
                    className="w-full px-3 py-2.5 lg:px-6 lg:py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 lg:gap-3 transition-all duration-300 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 border border-red-500 text-sm lg:text-base"
                  >
                    <PhoneOff className="w-4 h-4 lg:w-5 lg:h-5" />
                    End Call
                  </button>
                </div>
              )}

              {isCallEnded && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PhoneOff className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400">Call has ended</p>
                </div>
              )}
            </div>

            {/* Save Section - Hidden in demo mode */}
            {!isDemo && (
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Actions</h3>

                <button
                  onClick={handleSaveClick}
                  disabled={!canSave}
                  className={`w-full px-3 py-2.5 lg:px-6 lg:py-4 rounded-xl font-bold flex items-center justify-center gap-2 lg:gap-3 transition-all duration-300 shadow-lg border text-sm lg:text-base ${
                    canSave
                      ? 'bg-gradient-to-r from-white to-gray-100 hover:from-gray-100 hover:to-white text-black shadow-white/20 border-white hover:scale-105'
                      : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 lg:w-5 lg:h-5" />
                      {getButtonText()}
                    </>
                  )}
                </button>

                {/* Save Status */}
                {lastSaveStatus && (
                  <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
                    lastSaveStatus.success
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {lastSaveStatus.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>
                      {lastSaveStatus.success ? 'Saved successfully!' : `Failed: ${lastSaveStatus.error}`}
                    </span>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmationModal
        isOpen={showTakeOverModal}
        onClose={() => setShowTakeOverModal(false)}
        onConfirm={() => {
          handleTakeOver();
          setShowTakeOverModal(false);
        }}
        title="Take Over Call"
        message="Are you sure you want to take over this call? The AI will be paused and you'll be connected directly to the customer."
        confirmText="Take Over"
        confirmStyle="bg-[#FD6262] hover:bg-[#ff7272]"
      />

      <ConfirmationModal
        isOpen={showEndTakeOverModal}
        onClose={() => setShowEndTakeOverModal(false)}
        onConfirm={() => {
          endTakeOver();
          setShowEndTakeOverModal(false);
        }}
        title="Return to AI"
        message="Are you sure you want to return control to the AI? You'll be disconnected from the call."
        confirmText="Return to AI"
        confirmStyle="bg-gray-700 hover:bg-gray-600"
      />

      <ConfirmationModal
        isOpen={showEndCallModal}
        onClose={() => setShowEndCallModal(false)}
        onConfirm={() => {
          endCall();
          setShowEndCallModal(false);
        }}
        title="End Call"
        message="Are you sure you want to end this call? This action cannot be undone."
        confirmText="End Call"
        confirmStyle="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}
