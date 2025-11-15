"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Play,
  FileText,
  X,
  Clock,
  Phone,
  User,
  Calendar,
  Package,
} from "lucide-react";
import { useCallHistory } from "@/hooks/useCallHistory";

export function HistoryPanel({ t, backendUrl, isConnected }) {
  const [search, setSearch] = useState("");
  const [selectedCall, setSelectedCall] = useState(null);

  // backendUrl is already the restaurant ID (e.g., "restaurant_a")
  const restaurantId = backendUrl;

  // Debug log
  useEffect(() => {
    console.log(
      "🔍 HistoryPanel - Restaurant ID:",
      restaurantId,
      "Connected:",
      isConnected,
    );
  }, [restaurantId, isConnected]);

  // Use the hook with restaurant ID
  const { calls, loading, error } = useCallHistory(
    search,
    restaurantId,
    isConnected,
  );

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

  // If a call is selected, show call details
  if (selectedCall) {
    return (
      <CallDetailsView
        selectedCall={selectedCall}
        onBack={() => setSelectedCall(null)}
        formatDate={formatDate}
        formatCallDuration={formatCallDuration}
      />
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 lg:mb-8 pb-4 lg:pb-6 border-b border-gray-800 gap-4 lg:gap-0">
        <h2 className="text-xl lg:text-2xl font-bold text-white">
          {t.history || "Call History"}
        </h2>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={!isConnected}
          className="w-full lg:w-auto px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white text-sm lg:text-base focus:outline-none focus:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {!isConnected && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-red-500"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            Server Not Connected
          </h3>
          <p className="text-gray-600">
            Call history will appear when connected to the server
          </p>
        </div>
      )}

      {isConnected && (
        <CallListView
          calls={calls}
          loading={loading}
          error={error}
          search={search}
          onSelectCall={setSelectedCall}
          formatDate={formatDate}
          formatCallDuration={formatCallDuration}
        />
      )}
    </div>
  );
}

function CallListView({
  calls,
  loading,
  error,
  search,
  onSelectCall,
  formatDate,
  formatCallDuration,
}) {
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-red-500"></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-400 mb-2">
          Error Loading History
        </h3>
        <p className="text-gray-600 text-sm max-w-md mx-auto">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading call history...</p>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-12">
        <Phone className="w-16 h-16 text-gray-800 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-400 mb-2">
          {search ? "No calls found" : "No call history yet"}
        </h3>
        <p className="text-gray-600">
          {search
            ? "Try adjusting your search terms"
            : "Call history will appear here after your first call"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {calls.length} call{calls.length !== 1 ? "s" : ""} found
      </p>

      <div className="grid gap-4">
        {calls.map((call) => (
          <div
            key={call.id}
            onClick={() => onSelectCall(call)}
            className="bg-[#111111] border border-gray-800 rounded-xl p-4 lg:p-6 hover:border-gray-700 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center text-white font-bold text-sm lg:text-base border border-gray-700 flex-shrink-0">
                {call.customer_name
                  ? call.customer_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "??"}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-base lg:text-lg truncate group-hover:text-blue-400 transition-colors">
                  {call.customer_name || "Unknown Customer"}
                </h3>
                <p className="text-gray-400 text-sm truncate flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  {call.phone_number || "No phone number"}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-green-400 font-semibold text-lg">
                  {call.total_price || "—"}
                </div>
                <div className="text-gray-500 text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatCallDuration(call.call_duration)}
                </div>
                {/* 🎵 QUICK AUDIO ACCESS */}
                {call.audio_url && (
                  <div className="mt-2">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                      <Play className="w-3 h-3" />🎵 Audio
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Date:</span>
                <div className="text-gray-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(call.call_date)}
                </div>
              </div>

              <div>
                <span className="text-gray-500">Items:</span>
                <div className="text-gray-300 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {call.order_items ? call.order_items.length : 0}
                </div>
              </div>

              <div>
                <span className="text-gray-500">Payment:</span>
                <div className="text-gray-300 capitalize">
                  {call.payment_method || "—"}
                </div>
              </div>

              <div>
                <span className="text-gray-500">Status:</span>
                <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                  Completed
                </span>
              </div>
            </div>

            {call.delivery_address && (
              <div className="mt-3 p-3 bg-[#1a1a1a] rounded-lg">
                <span className="text-gray-500 text-sm">Delivery to: </span>
                <span className="text-gray-300 text-sm">
                  {call.delivery_address}
                </span>
              </div>
            )}

            {call.special_instructions && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <span className="text-yellow-400 text-sm font-medium">
                  Special:{" "}
                </span>
                <span className="text-gray-200 text-sm">
                  {call.special_instructions}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CallDetailsView({
  selectedCall,
  onBack,
  formatDate,
  formatCallDuration,
}) {
  const [showAudio, setShowAudio] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

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

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </button>
        <div className="flex gap-2">
          {/* 🚨 FORCE SHOW AUDIO BUTTON FOR DEBUGGING */}
          <button
            onClick={() => setShowAudio(!showAudio)}
            className={`px-4 py-3 rounded-lg text-sm lg:text-base font-medium transition-all flex items-center gap-2 min-w-[100px] justify-center ${
              showAudio
                ? "bg-green-600 text-white shadow-lg border-2 border-green-500"
                : selectedCall.audio_url
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 shadow-md border-2 border-blue-500"
                  : "bg-red-600 text-white border-2 border-red-500"
            }`}
          >
            <Play className="w-5 h-5" />
            {selectedCall.audio_url ? "🎵 Audio" : "❌ No Audio"}
          </button>
          {selectedCall.transcript && selectedCall.transcript.length > 0 && (
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className={`px-4 py-3 rounded-lg text-sm lg:text-base font-medium transition-all flex items-center gap-2 min-w-[120px] justify-center ${
                showTranscript
                  ? "bg-green-600 text-white shadow-lg border-2 border-green-500"
                  : "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 shadow-md border-2 border-purple-500"
              }`}
            >
              <FileText className="w-5 h-5" />📝 Transcript
            </button>
          )}
        </div>
      </div>

      {/* Audio Player */}
      {showAudio && selectedCall.audio_url && (
        <div className="mb-6 p-4 lg:p-6 bg-[#1a1a1a] border border-gray-800 rounded-xl">
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
            <source src={selectedCall.audio_url} type="audio/wav" />
            Your browser does not support audio playback.
          </audio>
          <p className="text-xs text-gray-600 mt-2">
            Full call recording •{" "}
            {formatCallDuration(selectedCall.call_duration)}
          </p>
        </div>
      )}

      {/* Transcript */}
      {showTranscript &&
        selectedCall.transcript &&
        selectedCall.transcript.length > 0 && (
          <div className="mb-6 p-4 lg:p-6 bg-[#1a1a1a] border border-gray-800 rounded-xl">
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
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedCall.transcript.map((msg, idx) => (
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

      {/* Call Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Customer Info */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Customer Information
          </h3>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center text-white font-bold">
              {selectedCall.customer_name
                ? selectedCall.customer_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "??"}
            </div>
            <div>
              <div className="text-white font-semibold">
                {selectedCall.customer_name || "Unknown Customer"}
              </div>
              <div className="text-gray-400 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {selectedCall.phone_number || "No phone"}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-gray-500 text-sm">Call Date:</span>
              <div className="text-white flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(selectedCall.call_date)}
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Duration:</span>
              <div className="text-white flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatCallDuration(selectedCall.call_duration)}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Summary
          </h3>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Items:</span>
              <span className="text-white">{getItemCount(selectedCall)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total:</span>
              <span className="text-green-400 font-bold text-xl">
                {selectedCall.total_price ||
                  `PKR ${calculateTotal(selectedCall)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Payment:</span>
              <span className="text-white capitalize">
                {selectedCall.payment_method || "—"}
              </span>
            </div>
          </div>

          {selectedCall.delivery_address && (
            <div className="p-3 bg-[#1a1a1a] rounded-lg">
              <span className="text-gray-500 text-sm">Delivery to:</span>
              <div className="text-white text-sm">
                {selectedCall.delivery_address}
              </div>
              {selectedCall.delivery_time && (
                <div className="text-gray-400 text-xs mt-1">
                  Expected: {selectedCall.delivery_time}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      {selectedCall.order_items && selectedCall.order_items.length > 0 && (
        <div className="bg-[#111111] border border-gray-800 rounded-xl p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Order Items</h3>

          <div className="space-y-3">
            {selectedCall.order_items.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center text-white font-bold text-sm">
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
                      <div className="text-green-400 font-semibold">
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
        </div>
      )}

      {selectedCall.special_instructions && (
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 lg:p-6">
          <h4 className="text-yellow-400 font-semibold mb-2">
            Special Instructions
          </h4>
          <p className="text-gray-200">{selectedCall.special_instructions}</p>
        </div>
      )}
    </div>
  );
}
