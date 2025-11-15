"use client";

import {
  Clock,
  MapPin,
  CreditCard,
  Package,
  ShoppingCart,
  History,
  Play,
  FileText,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { useState } from "react";
import { useCallHistory } from "@/hooks/useCallHistory";

export function OrderPanel({
  t,
  orderData,
  isConnected,
  backendUrl,
  isSaving,
  lastSaveStatus,
  manualSaveCall,
}) {
  const [search, setSearch] = useState("");
  const [selectedHistoryCall, setSelectedHistoryCall] = useState(null);
  const [showAudio, setShowAudio] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // backendUrl is already the restaurant ID (e.g., "restaurant_a")
  const restaurantId = backendUrl;

  // ✅ Pass isConnected to the useCallHistory hook
  const { calls, loading } = useCallHistory(search, restaurantId, isConnected);

  // Check if we can save (only for live orders)
  const canSave = isConnected && orderData && !isSaving && !selectedHistoryCall;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCallDuration = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateTotal = (data) => {
    if (!data?.order_items) return "0.00";
    if (data.total_price) {
      return data.total_price.replace(/[^0-9.]/g, "");
    }
    const total = data.order_items.reduce((sum, item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 1;
      return sum + price * quantity;
    }, 0);
    return total.toFixed(2);
  };

  const getItemCount = (data) => {
    if (!data?.order_items) return 0;
    return data.order_items.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0,
    );
  };

  const displayOrderData =
    isConnected && orderData ? orderData : selectedHistoryCall;

  return (
    <div className="flex flex-col lg:flex-row h-full animate-fadeInUp">
      {/* Left Panel - Call History */}
      <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-[rgba(79,79,80,0.3)] bg-[#1b1c1e]">
        <div className="p-4 lg:p-6 border-b border-[rgba(79,79,80,0.3)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3 lg:gap-0">
            <h2 className="text-lg lg:text-xl font-light text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <History className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />
              Order History
            </h2>

            {/* Save controls and connection status */}
            <div className="flex items-center gap-3">
              {/* Save Status */}
              {lastSaveStatus && (
                <div className="flex items-center gap-2 text-sm">
                  {lastSaveStatus.success ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span className="text-accent text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                        Saved{" "}
                        {lastSaveStatus.timestamp
                          ? new Date(
                              lastSaveStatus.timestamp,
                            ).toLocaleTimeString()
                          : ""}
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

              {/* Manual Save Button */}
              <button
                onClick={manualSaveCall}
                disabled={!canSave}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-all shadow-lg ${
                  canSave
                    ? "bg-accent text-white hover:bg-[#ff7272]"
                    : "bg-[#2a2a2c] text-[#666] cursor-not-allowed"
                }`}
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                title={
                  !isConnected
                    ? "Not connected"
                    : !orderData
                      ? "No live order to save"
                      : selectedHistoryCall
                        ? "Switch to live order to save"
                        : isSaving
                          ? "Saving..."
                          : "Manually save current live order"
                }
              >
                {isSaving ? (
                  <>
                    <Loader className="w-3 h-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    Save
                  </>
                )}
              </button>

              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-400">
                  {isConnected ? "Live" : "Offline"}
                </span>
              </div>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white text-sm lg:text-base focus:outline-none focus:border-gray-700"
          />
        </div>

        <div
          className="overflow-y-auto"
          style={{ height: "calc(100vh - 200px)" }}
        >
          {/* Live Order Banner */}
          {isConnected && orderData && (
            <div
              onClick={() => setSelectedHistoryCall(null)}
              className={`m-3 lg:m-4 p-3 lg:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                !selectedHistoryCall
                  ? "border-green-500 bg-green-500/10"
                  : "border-green-500/50 bg-green-500/5 hover:bg-green-500/10"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-semibold text-xs lg:text-sm">
                  LIVE ORDER
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center text-white font-bold text-xs lg:text-sm">
                  {orderData.customer_name
                    ? orderData.customer_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "??"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm lg:text-base truncate">
                    {orderData.customer_name || "Processing order..."}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {orderData.phone_number || "Extracting details..."}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-green-400 font-bold text-sm lg:text-base">
                    {orderData.total_price ? (
                      orderData.total_price
                    ) : (
                      <span className="text-xs">Calculating...</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getItemCount(orderData)} items
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historical Calls */}
          <div className="p-3 lg:p-4">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading...</div>
            ) : calls.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {search ? "No calls found" : "No call history yet"}
              </div>
            ) : (
              <div className="space-y-2 lg:space-y-3">
                {calls.map((call) => (
                  <div
                    key={call.id}
                    onClick={() => setSelectedHistoryCall(call)}
                    className={`p-3 lg:p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedHistoryCall?.id === call.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-gray-800 bg-[#1a1a1a] hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2 lg:mb-3">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center text-white font-bold text-xs lg:text-sm flex-shrink-0">
                        {call.customer_name
                          ? call.customer_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : "??"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm truncate">
                          {call.customer_name || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {call.phone_number || "No phone"}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs lg:text-sm text-gray-400">
                          {formatCallDuration(call.call_duration)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatDate(call.call_date)}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {call.total_price && (
                        <div>
                          <span className="text-gray-500">Total: </span>
                          <span className="text-green-400 font-bold">
                            {call.total_price}
                          </span>
                        </div>
                      )}
                      {call.order_items && call.order_items.length > 0 && (
                        <div className="text-right">
                          <span className="text-gray-500">Items: </span>
                          <span className="text-gray-300">
                            {call.order_items.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Order Details */}
      <div className="w-full lg:w-1/2 bg-[#0a0a0a] min-h-0 flex-1">
        {!displayOrderData ? (
          <div className="flex items-center justify-center h-full py-12 lg:py-0">
            <div className="text-center">
              <ShoppingCart className="w-16 h-16 lg:w-20 lg:h-20 text-gray-800 mx-auto mb-4" />
              <h3 className="text-lg lg:text-xl font-semibold text-gray-400 mb-2">
                Select an order
              </h3>
              <p className="text-gray-600 text-sm lg:text-base px-4">
                Choose a call from history or wait for a live order
              </p>
            </div>
          </div>
        ) : (
          <OrderDetailsPanel
            orderData={displayOrderData}
            isLive={!selectedHistoryCall && isConnected}
            showAudio={showAudio}
            setShowAudio={setShowAudio}
            showTranscript={showTranscript}
            setShowTranscript={setShowTranscript}
            formatCallDuration={formatCallDuration}
            calculateTotal={calculateTotal}
            getItemCount={getItemCount}
          />
        )}
      </div>
    </div>
  );
}

function OrderDetailsPanel({
  orderData,
  isLive,
  showAudio,
  setShowAudio,
  showTranscript,
  setShowTranscript,
  formatCallDuration,
  calculateTotal,
  getItemCount,
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isLive
                  ? "bg-gradient-to-br from-green-600 to-green-700"
                  : "bg-gradient-to-br from-blue-600 to-blue-700"
              }`}
            >
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isLive ? "Live Order" : `Order #${orderData.id || "N/A"}`}
              </h2>
              <p className="text-gray-400">
                {isLive ? "Processing..." : "Historical Order"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {orderData.audio_url && (
              <button
                onClick={() => setShowAudio(!showAudio)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  showAudio
                    ? "bg-blue-600 text-white"
                    : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white border border-gray-800"
                }`}
              >
                <Play className="w-4 h-4" />
                Audio
              </button>
            )}
            {orderData.transcript && orderData.transcript.length > 0 && (
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  showTranscript
                    ? "bg-blue-600 text-white"
                    : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white border border-gray-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                Transcript
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center text-white font-bold">
            {orderData.customer_name
              ? orderData.customer_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
              : "??"}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white">
              {orderData.customer_name ||
                (isLive ? "Extracting name..." : "Unknown Customer")}
            </div>
            <div className="text-sm text-gray-400">
              {orderData.phone_number ||
                (isLive ? "Extracting phone..." : "No phone")}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-green-400">
              {orderData.total_price ||
                (isLive ? (
                  <span className="text-base text-gray-400">
                    Calculating...
                  </span>
                ) : (
                  `PKR ${calculateTotal(orderData)}`
                ))}
            </div>
            <div className="text-sm text-gray-500">
              {getItemCount(orderData)} items
            </div>
          </div>
        </div>
      </div>

      {showAudio && orderData.audio_url && (
        <div className="p-6 border-b border-gray-800 bg-[#1a1a1a]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Call Recording
            </h3>
            <button
              onClick={() => setShowAudio(false)}
              className="p-1 hover:bg-[#222] rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <audio
            controls
            className="w-full"
            style={{
              filter: "invert(1) hue-rotate(180deg)",
              height: "40px",
            }}
          >
            <source src={orderData.audio_url} type="audio/wav" />
            Your browser does not support audio playback.
          </audio>
          <p className="text-xs text-gray-600 mt-2">
            Full call recording • {formatCallDuration(orderData.call_duration)}
          </p>
        </div>
      )}

      {showTranscript &&
        orderData.transcript &&
        orderData.transcript.length > 0 && (
          <div className="p-6 border-b border-gray-800 bg-[#1a1a1a]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Call Transcript
              </h3>
              <button
                onClick={() => setShowTranscript(false)}
                className="p-1 hover:bg-[#222] rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {orderData.transcript.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.speaker === "customer" || msg.speaker === "Caller"
                      ? "bg-blue-500/10 border border-blue-500/30"
                      : "bg-green-500/10 border border-green-500/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-bold uppercase ${
                        msg.speaker === "customer" || msg.speaker === "Caller"
                          ? "text-blue-400"
                          : "text-green-400"
                      }`}
                    >
                      {msg.speaker === "customer" || msg.speaker === "Caller"
                        ? "Customer"
                        : msg.speaker === "AI" || msg.speaker === "ai"
                          ? "AI Agent"
                          : msg.speaker}
                    </span>
                    {msg.timestamp && (
                      <span className="text-xs text-gray-500">
                        {msg.timestamp}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-200">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Order Items
        </h3>

        {orderData.order_items && orderData.order_items.length > 0 ? (
          <div className="space-y-3 mb-6">
            {orderData.order_items.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center text-white font-bold">
                      {item.quantity || 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{item.item}</h4>
                      {item.notes && (
                        <p className="text-sm text-gray-400 italic">
                          Special: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {item.price && (
                      <div className="text-lg font-bold text-green-400">
                        PKR {(item.price * (item.quantity || 1)).toFixed(2)}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      PKR {item.price || "0.00"} each
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-700" />
            <p>{isLive ? "Extracting order items..." : "No order items"}</p>
          </div>
        )}

        <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Subtotal:</span>
            <span className="text-white font-medium">
              PKR {calculateTotal(orderData)}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Tax (8.25%):</span>
            <span className="text-white font-medium">
              PKR {(parseFloat(calculateTotal(orderData)) * 0.0825).toFixed(2)}
            </span>
          </div>
          <div className="border-t border-gray-800 pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-white">Total:</span>
              <span className="text-2xl font-bold text-green-400">
                {orderData.total_price ||
                  `PKR ${(
                    parseFloat(calculateTotal(orderData)) * 1.0825
                  ).toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-800">
            <h4 className="text-sm text-gray-500 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Delivery
            </h4>
            <p className="text-white text-sm mb-2">
              {orderData.delivery_address ||
                (isLive ? "Extracting address..." : "Not provided")}
            </p>
            <p className="text-gray-400 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {orderData.delivery_time ||
                (isLive ? "Extracting time..." : "Not provided")}
            </p>
          </div>

          <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-800">
            <h4 className="text-sm text-gray-500 mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment
            </h4>
            <p className="text-white text-sm capitalize mb-2">
              {orderData.payment_method ||
                (isLive ? "Extracting..." : "Not provided")}
            </p>
            <span
              className={`px-2 py-1 rounded text-xs ${
                isLive
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-green-500/20 text-green-400"
              }`}
            >
              {isLive ? "Pending" : "Completed"}
            </span>
          </div>
        </div>

        {orderData.special_instructions && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
            <h4 className="text-yellow-400 font-semibold mb-2">
              Special Instructions
            </h4>
            <p className="text-gray-200">{orderData.special_instructions}</p>
          </div>
        )}
      </div>
    </div>
  );
}
