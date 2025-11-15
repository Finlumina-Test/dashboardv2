"use client";

import {
  PhoneCall,
  Save,
  CheckCircle,
  AlertCircle,
  Loader,
  Clock,
  MapPin,
} from "lucide-react";
import { AudioWaveform } from "./AudioWaveform";
import { CallControls } from "./CallControls";
import { LiveTranscript } from "./LiveTranscript";
import { formatDuration, getStatusBadge } from "@/utils/dashboardUtils";

export function MainDashboard({
  t,
  currentView,
  selectedCall, // 🔥 NEW: Now contains full call data from multi-call state
  selectedCallId, // 🔥 NEW: ID of selected call
  audioActivity, // 🔥 NEW: Object with activity per call
  handleTakeOver,
  isTakenOver, // 🔥 FIXED: Use prop instead of extracting from selectedCall
  endTakeOver,
  isMicMuted, // 🔥 FIXED: Use prop instead of extracting from selectedCall
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
  isSaving, // 🔥 FIXED: Use prop instead of extracting from selectedCall
  lastSaveStatus, // 🔥 FIXED: Use prop instead of extracting from selectedCall
  manualSaveCall, // 🔥 NEW: Takes callId parameter
}) {
  // Only show for dashboard and live views
  if (currentView !== "dashboard" && currentView !== "live") {
    return null;
  }

  // 🔥 NEW: Get data from selected call object
  const callDuration = selectedCall?.duration || 0;
  const orderData = selectedCall?.orderData || null;
  const transcript = selectedCall?.transcript || [];
  const currentAudioActivity = selectedCallId
    ? audioActivity[selectedCallId] || 0
    : 0;

  // ✅ IMPROVED: Save button logic with better validation and feedback
  const hasTranscript = transcript && transcript.length > 0;
  const hasOrderData =
    orderData &&
    (orderData.customer_name ||
      orderData.phone_number ||
      orderData.delivery_address ||
      orderData.total_price ||
      (orderData.order_items && orderData.order_items.length > 0));
  const hasContent = hasTranscript || hasOrderData;
  const canSave = hasContent && !isSaving && selectedCallId;

  // ✅ IMPROVED: Dynamic button text based on actual content
  const getButtonText = () => {
    if (isSaving) return "Saving...";
    if (!selectedCallId) return "No Call Selected";
    if (!hasContent) return "No Content to Save";
    if (hasTranscript && hasOrderData) {
      const itemCount = orderData.order_items?.length || 0;
      const transcriptCount = transcript.length;
      return `Save Call (${itemCount} items, ${transcriptCount} messages)`;
    }
    if (hasTranscript) return `Save Transcript (${transcript.length} messages)`;
    if (hasOrderData) {
      const itemCount = orderData.order_items?.length || 0;
      return `Save Order (${itemCount} items)`;
    }
    return "Save Call";
  };

  const getButtonTitle = () => {
    if (isSaving) return "Saving call data...";
    if (!selectedCallId) return "Please select a call first";
    if (!hasContent) return "No transcript or order data available to save";

    let details = [];
    if (hasOrderData) {
      if (orderData.customer_name)
        details.push(`Customer: ${orderData.customer_name}`);
      if (orderData.phone_number)
        details.push(`Phone: ${orderData.phone_number}`);
      if (orderData.order_items?.length)
        details.push(`${orderData.order_items.length} order items`);
      if (orderData.total_price)
        details.push(`Total: ${orderData.total_price}`);
    }
    if (hasTranscript) {
      details.push(`${transcript.length} conversation messages`);
    }

    return details.length > 0
      ? `Save call with: ${details.join(", ")}`
      : "Save current call data";
  };

  // 🔥 NEW: Handle save call button click
  const handleSaveClick = () => {
    if (canSave && selectedCallId) {
      manualSaveCall(selectedCallId);
    }
  };

  // Customer display data
  const displayName =
    orderData?.customer_name ||
    (isConnected ? (
      <span className="text-gray-600 italic">Extracting customer name...</span>
    ) : (
      "Waiting for call..."
    ));
  const displayPhone =
    orderData?.phone_number ||
    (isConnected ? (
      <span className="text-gray-600 italic">Extracting phone number...</span>
    ) : (
      "..."
    ));

  // If not connected and no selected call, show waiting state
  if (!isConnected && !selectedCall) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <PhoneCall className="w-20 h-20 text-gray-800 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            Waiting for active call...
          </h3>
          <p className="text-gray-600">
            Call details will appear when a customer connects
          </p>
        </div>
      </div>
    );
  }

  // If connected but no call selected
  if (isConnected && !selectedCall && !selectedCallId) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <PhoneCall className="w-20 h-20 text-gray-800 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            Select a call from the sidebar
          </h3>
          <p className="text-gray-600">Click on a call to view its details</p>
        </div>
      </div>
    );
  }

  const isLiveView = currentView === "live";

  return (
    <div
      className={`${
        isLiveView ? "flex flex-col flex-1 min-h-0" : ""
      } p-4 lg:p-8 space-y-4 lg:space-y-6`}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl lg:text-2xl font-bold text-white">
          {isLiveView ? t.liveConversation : "Live Dashboard"}
        </h2>

        {/* Save Controls - Desktop */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Save Status Indicator */}
          {lastSaveStatus && (
            <div className="flex items-center gap-2 text-sm">
              {lastSaveStatus.success ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-400">
                    Saved {lastSaveStatus.timestamp.toLocaleTimeString()}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-400">Save failed</span>
                </>
              )}
            </div>
          )}

          {/* Manual Save Button */}
          <button
            onClick={handleSaveClick}
            disabled={!canSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              canSave
                ? "bg-white text-black hover:bg-gray-200"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
            title={getButtonTitle()}
          >
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {getButtonText()}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {getButtonText()}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dashboard View - Show Call Header, Waveform, and Controls */}
      {!isLiveView && (
        <>
          {/* Call Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-4 lg:pb-6 border-b border-gray-800 gap-4 lg:gap-0">
            <div className="flex items-center gap-3 lg:gap-6">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-xl flex items-center justify-center font-bold text-sm lg:text-lg border-2 border-gray-700 shadow-lg flex-shrink-0">
                {orderData?.customer_name
                  ? orderData.customer_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "??"}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg lg:text-2xl font-bold text-white mb-1 truncate">
                  {displayName}
                </h2>
                <p className="text-gray-400 font-medium text-sm lg:text-base truncate">
                  {displayPhone}
                </p>
              </div>
              <div
                className={`px-3 py-1 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm font-bold border ${getStatusBadge(
                  "in-progress",
                )} flex-shrink-0`}
              >
                IN-PROGRESS
              </div>
            </div>
            <div className="flex items-center justify-end lg:gap-8">
              <div className="text-center">
                <div className="text-xs lg:text-sm text-gray-500 mb-1">
                  {t.duration}
                </div>
                <div className="text-lg lg:text-xl font-bold font-mono text-white">
                  {formatDuration(callDuration)}
                </div>
              </div>
            </div>
          </div>

          {/* Audio Waveform */}
          <AudioWaveform t={t} audioActivity={currentAudioActivity} />

          {/* Call Controls */}
          <CallControls
            t={t}
            handleTakeOver={() => handleTakeOver(selectedCallId)}
            isTakenOver={isTakenOver}
            endTakeOver={() => endTakeOver(selectedCallId)}
            isMicMuted={isMicMuted}
            toggleMicMute={() => toggleMicMute(selectedCallId)}
            endCall={() => endCall(selectedCallId)}
          />
        </>
      )}

      {/* Order Summary Card - Show only for dashboard view when there's order data */}
      {!isLiveView && orderData && (
        <div className="bg-[#111111] border border-gray-800 rounded-xl p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Current Order
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Order Items */}
            <div>
              <h4 className="text-sm text-gray-500 mb-2">Items</h4>
              {orderData.order_items && orderData.order_items.length > 0 ? (
                <div className="space-y-2">
                  {orderData.order_items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="text-sm text-white">
                      {item.quantity || 1}x {item.item}
                    </div>
                  ))}
                  {orderData.order_items.length > 3 && (
                    <div className="text-xs text-gray-400">
                      +{orderData.order_items.length - 3} more items
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic">
                  Extracting items...
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div>
              <h4 className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Delivery
              </h4>
              <div className="text-sm text-white">
                {orderData.delivery_address || (
                  <span className="text-gray-400 italic">
                    Extracting address...
                  </span>
                )}
              </div>
              {orderData.delivery_time && (
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {orderData.delivery_time}
                </div>
              )}
            </div>

            {/* Total */}
            <div>
              <h4 className="text-sm text-gray-500 mb-2">Total</h4>
              <div className="text-xl font-bold text-green-400">
                {orderData.total_price || (
                  <span className="text-gray-400 italic text-base">
                    Calculating...
                  </span>
                )}
              </div>
              {orderData.payment_method && (
                <div className="text-xs text-gray-400 mt-1 capitalize">
                  {orderData.payment_method}
                </div>
              )}
            </div>
          </div>

          {orderData.special_instructions && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <h4 className="text-yellow-400 font-semibold text-sm mb-1">
                Special Instructions
              </h4>
              <p className="text-gray-200 text-sm">
                {orderData.special_instructions}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Live Transcript */}
      <div className={isLiveView ? "flex-1 min-h-0" : ""}>
        <LiveTranscript
          t={t}
          transcript={transcript}
          orderData={orderData}
          isConnected={isConnected}
          error={error}
          audioEnabled={audioEnabled}
          isTakenOver={isTakenOver}
          clearTranscript={() => clearTranscript(selectedCallId)}
          clearOrder={() => clearOrder(selectedCallId)}
          toggleAudio={toggleAudio}
          initAudioContext={initAudioContext}
          testAudio={testAudio}
          isSaving={isSaving}
          lastSaveStatus={lastSaveStatus}
        />
      </div>

      {/* Mobile Save Button */}
      <div className="lg:hidden flex items-center justify-center gap-3 pt-4 border-t border-gray-800">
        {lastSaveStatus && (
          <div className="flex items-center gap-2 text-sm">
            {lastSaveStatus.success ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-400 text-xs">
                  Saved {lastSaveStatus.timestamp.toLocaleTimeString()}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-400 text-xs">Save failed</span>
              </>
            )}
          </div>
        )}

        <button
          onClick={handleSaveClick}
          disabled={!canSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            canSave
              ? "bg-white text-black hover:bg-gray-200"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
          title={getButtonTitle()}
        >
          {isSaving ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              {getButtonText()}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {getButtonText()}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
