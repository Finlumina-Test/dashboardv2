"use client";

import { ShoppingCart, Clock, MapPin, Phone, User } from "lucide-react";
import { useMemo } from "react";

export function LiveOrderPanel({
  t,
  // 🔥 Multi-call props
  calls, // Object of all calls
  activeCallIds, // Array of active call IDs
  selectedCallId,
  setSelectedCallId,
  isConnected,
  backendUrl,
  isSaving,
  lastSaveStatus,
  manualSaveCall,
  isDemo = false,
  callStatus,
}) {
  // 🔥 Get all orders from active calls
  const activeOrders = useMemo(() => {
    if (!calls || activeCallIds.length === 0) return [];

    return activeCallIds
      .map((callId) => {
        const call = calls[callId];
        if (!call || !call.orderData) return null;

        return {
          callId,
          orderData: call.orderData,
          duration: call.duration || 0,
          isSelected: callId === selectedCallId,
        };
      })
      .filter(Boolean);
  }, [calls, activeCallIds, selectedCallId]);

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle order selection
  const handleOrderClick = (callId) => {
    if (setSelectedCallId) {
      setSelectedCallId(callId);
    }
  };

  // If no active orders
  if (activeOrders.length === 0) {
    return (
      <div className="flex-1 p-4 lg:p-8 flex items-center justify-center">
        <div className="text-center max-w-md animate-fadeInUp">
          <div className="w-24 h-24 bg-gradient-to-br from-[#FD6262]/20 to-[#FD6262]/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#FD6262]/20 shadow-2xl shadow-[#FD6262]/10">
            <ShoppingCart className="w-12 h-12 text-[#FD6262]/60" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            No Active Orders
          </h2>
          <p className="text-gray-400">
            Orders will appear here when customers place them
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-3">
          <ShoppingCart className="w-6 h-6" />
          Live Orders ({activeOrders.length})
        </h2>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {activeOrders.map(({ callId, orderData, duration, isSelected }) => (
          <div
            key={callId}
            onClick={() => handleOrderClick(callId)}
            className={`bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border rounded-xl p-6 cursor-pointer transition-all ${
              isSelected
                ? "border-[#FD6262]/50 shadow-lg shadow-[#FD6262]/20"
                : "border-white/10 hover:border-[#FD6262]/30"
            }`}
          >
            {/* Order Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FD6262] to-[#ff8888] text-white rounded-lg flex items-center justify-center font-bold border border-[#FD6262]/50 shadow-lg">
                  {orderData.customer_name
                    ? orderData.customer_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "??"}
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {orderData.customer_name || "Incoming Order"}
                  </h3>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(duration)}
                  </div>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                LIVE
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-2 mb-4">
              {orderData.phone_number && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Phone className="w-4 h-4 text-gray-500" />
                  {orderData.phone_number}
                </div>
              )}
              {orderData.delivery_address && (
                <div className="flex items-start gap-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <span className="flex-1">{orderData.delivery_address}</span>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">
                Order Items
              </h4>
              {orderData.order_items && orderData.order_items.length > 0 ? (
                <div className="space-y-2">
                  {orderData.order_items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-sm bg-[#1a1a1a] p-2 rounded"
                    >
                      <span className="text-white">
                        {item.quantity || 1}x {item.item}
                      </span>
                      {item.price && (
                        <span className="text-gray-400">{item.price}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  Extracting items...
                </div>
              )}
            </div>

            {/* Special Instructions */}
            {orderData.special_instructions && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h4 className="text-yellow-400 font-semibold text-xs mb-1">
                  Special Instructions
                </h4>
                <p className="text-gray-200 text-xs">
                  {orderData.special_instructions}
                </p>
              </div>
            )}

            {/* Order Footer */}
            <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">Total</div>
                <div className="text-2xl font-bold text-green-400">
                  {orderData.total_price || (
                    <span className="text-gray-500 italic text-base">
                      Calculating...
                    </span>
                  )}
                </div>
              </div>
              {orderData.payment_method && (
                <div className="text-xs text-gray-400 bg-[#1a1a1a] px-3 py-2 rounded capitalize">
                  {orderData.payment_method}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
