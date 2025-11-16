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
  isDemo, // 🔥 NEW: Demo mode flag
  callStatus, // 🔥 NEW: Call status for demo
  // 🔥 NEW: Demo props (when not using selectedCall)
  transcript: transcriptProp,
  orderData: orderDataProp,
  callDuration: callDurationProp,
}) {
  // Only show for dashboard and live views
  if (currentView !== "dashboard" && currentView !== "live") {
    return null;
  }

  // 🔥 FIXED: Get data from selected call object OR demo props
  const callDuration = callDurationProp ?? selectedCall?.duration ?? 0;
  const orderData = orderDataProp ?? selectedCall?.orderData ?? null;
  const transcript = transcriptProp ?? selectedCall?.transcript ?? [];
  const currentAudioActivity = selectedCallId
    ? (typeof audioActivity === 'object' ? audioActivity[selectedCallId] : audioActivity) || 0
    : (typeof audioActivity === 'number' ? audioActivity : 0); // 🔥 FIXED: Support both object (multi-call) and number (demo) modes

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
  const canSave = hasContent && !isSaving && (selectedCallId || isDemo); // 🔥 FIXED: Allow saving in demo mode without selectedCallId

  // ✅ IMPROVED: Dynamic button text based on actual content
  const getButtonText = () => {
    if (isSaving) return "Saving...";
    if (!selectedCallId && !isDemo) return "No Call Selected";
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
    if (!selectedCallId && !isDemo) return "Please select a call first";
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

  // 🔥 FIXED: Handle save call button click (demo vs multi-call)
  const handleSaveClick = () => {
    if (canSave) {
      // In demo mode, manualSaveCall doesn't need a parameter
      // In multi-call mode, it needs the callId
      if (isDemo) {
        manualSaveCall();
      } else if (selectedCallId) {
        manualSaveCall(selectedCallId);
      }
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

  // 🔥 FIXED: Skip waiting states in demo mode (demo handles its own waiting state)
  // If not connected and no selected call, show waiting state
  if (!isDemo && !isConnected && !selectedCall) {
    return (
      <div className="flex-1 flex items-center justify-center h-full animate-fadeInUp">
        <div className="text-center card-gradient rounded-lg p-12">
          <PhoneCall className="w-20 h-20 text-accent mx-auto mb-4 animate-pulse-soft" />
          <h3 className="text-xl font-light text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Waiting for active call...
          </h3>
          <p className="text-[#b0b0b0]" style={{ fontFamily: 'var(--font-body)' }}>
            Call details will appear when a customer connects
          </p>
        </div>
      </div>
    );
  }

  // If connected but no call selected
  if (!isDemo && isConnected && !selectedCall && !selectedCallId) {
    return (
      <div className="flex-1 flex items-center justify-center h-full animate-fadeInUp">
        <div className="text-center card-gradient rounded-lg p-12">
          <PhoneCall className="w-20 h-20 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-light text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Select a call from the sidebar
          </h3>
          <p className="text-[#b0b0b0]" style={{ fontFamily: 'var(--font-body)' }}>Click on a call to view its details</p>
        </div>
      </div>
    );
  }

  const isLiveView = currentView === "live";

  return (
    <div
      className={`${
        isLiveView ? "flex flex-col flex-1 min-h-0" : ""
      } p-4 lg:p-8 space-y-4 lg:space-y-6 animate-fadeInUp`}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl lg:text-2xl font-light text-white" style={{ fontFamily: 'var(--font-heading)' }}>
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
            className={`flex items-center gap-2 px-6 py-3 rounded transition-all ${
              canSave
                ? "bg-accent hover:bg-[#ff7272] text-white hover-lift shadow-lg"
                : "bg-[#2a2a2c] text-[#666] cursor-not-allowed"
            }`}
            style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-4 lg:pb-6 border-b border-[rgba(79,79,80,0.3)] gap-4 lg:gap-0">
            <div className="flex items-center gap-3 lg:gap-6">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-accent to-accent-light text-white rounded-lg flex items-center justify-center font-light text-sm lg:text-lg shadow-lg flex-shrink-0 hover-scale" style={{ fontFamily: 'var(--font-heading)' }}>
                {orderData?.customer_name
                  ? orderData.customer_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "??"}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg lg:text-2xl font-light text-white mb-1 truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                  {displayName}
                </h2>
                <p className="text-[#b0b0b0] text-sm lg:text-base truncate" style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                  {displayPhone}
                </p>
              </div>
              <div
                className="px-3 py-1 lg:px-4 lg:py-2 rounded text-xs lg:text-sm font-medium border border-accent bg-accent/10 text-accent flex-shrink-0 animate-pulse-soft"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                IN-PROGRESS
              </div>
            </div>
            <div className="flex items-center justify-end lg:gap-8">
              <div className="text-center">
                <div className="text-xs lg:text-sm text-[#b0b0b0] mb-1 uppercase tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>
                  {t.duration}
                </div>
                <div className="text-lg lg:text-xl font-light font-mono text-accent" style={{ fontFamily: 'var(--font-heading)' }}>
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
            handleTakeOver={isDemo ? handleTakeOver : () => handleTakeOver(selectedCallId)}
            isTakenOver={isTakenOver}
            endTakeOver={isDemo ? endTakeOver : () => endTakeOver(selectedCallId)}
            isMicMuted={isMicMuted}
            toggleMicMute={isDemo ? toggleMicMute : () => toggleMicMute(selectedCallId)}
            endCall={isDemo ? endCall : () => endCall(selectedCallId)}
          />
        </>
      )}

      {/* Order Summary Card - Show only for dashboard view when there's order data */}
      {!isLiveView && orderData && (
        <div className="card-gradient rounded-lg p-4 lg:p-6 hover-lift">
          <h3 className="text-base lg:text-lg font-light text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse-soft"></div>
            Current Order
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Order Items */}
            <div>
              <h4 className="text-sm text-[#b0b0b0] mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>Items</h4>
              {orderData.order_items && orderData.order_items.length > 0 ? (
                <div className="space-y-2">
                  {orderData.order_items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="text-sm text-white" style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                      {item.quantity || 1}x {item.item}
                    </div>
                  ))}
                  {orderData.order_items.length > 3 && (
                    <div className="text-xs text-[#c0c0c0]" style={{ fontFamily: 'var(--font-body)' }}>
                      +{orderData.order_items.length - 3} more items
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-[#c0c0c0] italic" style={{ fontFamily: 'var(--font-body)' }}>
                  Extracting items...
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div>
              <h4 className="text-sm text-[#b0b0b0] mb-2 uppercase tracking-wide flex items-center gap-1" style={{ fontFamily: 'var(--font-body)' }}>
                <MapPin className="w-3 h-3" />
                Delivery
              </h4>
              <div className="text-sm text-white" style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                {orderData.delivery_address || (
                  <span className="text-[#c0c0c0] italic">
                    Extracting address...
                  </span>
                )}
              </div>
              {orderData.delivery_time && (
                <div className="text-xs text-[#c0c0c0] mt-1 flex items-center gap-1" style={{ fontFamily: 'var(--font-body)' }}>
                  <Clock className="w-3 h-3" />
                  {orderData.delivery_time}
                </div>
              )}
            </div>

            {/* Total */}
            <div>
              <h4 className="text-sm text-[#b0b0b0] mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>Total</h4>
              <div className="text-xl font-light text-accent" style={{ fontFamily: 'var(--font-heading)' }}>
                {orderData.total_price || (
                  <span className="text-[#c0c0c0] italic text-base">
                    Calculating...
                  </span>
                )}
              </div>
              {orderData.payment_method && (
                <div className="text-xs text-[#c0c0c0] mt-1 capitalize" style={{ fontFamily: 'var(--font-body)' }}>
                  {orderData.payment_method}
                </div>
              )}
            </div>
          </div>

          {orderData.special_instructions && (
            <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded">
              <h4 className="text-accent font-medium text-sm mb-1" style={{ fontFamily: 'var(--font-body)' }}>
                Special Instructions
              </h4>
              <p className="text-white text-sm" style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}>
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
          clearTranscript={isDemo ? clearTranscript : () => clearTranscript(selectedCallId)}
          clearOrder={isDemo ? clearOrder : () => clearOrder(selectedCallId)}
          toggleAudio={toggleAudio}
          initAudioContext={initAudioContext}
          testAudio={testAudio}
          isSaving={isSaving}
          lastSaveStatus={lastSaveStatus}
        />
      </div>

      {/* Mobile Save Button */}
      <div className="lg:hidden flex items-center justify-center gap-3 pt-4 border-t border-[rgba(79,79,80,0.3)]">
        {lastSaveStatus && (
          <div className="flex items-center gap-2 text-sm">
            {lastSaveStatus.success ? (
              <>
                <CheckCircle className="w-4 h-4 text-accent" />
                <span className="text-accent text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                  Saved {lastSaveStatus.timestamp.toLocaleTimeString()}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-400 text-xs" style={{ fontFamily: 'var(--font-body)' }}>Save failed</span>
              </>
            )}
          </div>
        )}

        <button
          onClick={handleSaveClick}
          disabled={!canSave}
          className={`flex items-center gap-2 px-6 py-3 rounded text-sm transition-all ${
            canSave
              ? "bg-accent hover:bg-[#ff7272] text-white shadow-lg"
              : "bg-[#2a2a2c] text-[#666] cursor-not-allowed"
          }`}
          style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
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
