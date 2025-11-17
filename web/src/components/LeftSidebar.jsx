import {
  Globe,
  Search,
  Clock,
  PhoneCall,
  ShoppingCart,
  LogOut,
  VolumeX,
  Volume2,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";

export function LeftSidebar({
  t,
  language,
  toggleLanguage,
  currentView,
  setCurrentView,
  searchQuery,
  setSearchQuery,
  selectedCall,
  setSelectedCall,
  calls,
  activeCallIds,
  selectedCallId,
  setSelectedCallId,
  isConnected,
  backendUrl,
  onLogout,
  isCallMuted,
  toggleCallMute,
}) {
  // Create active calls array from multi-call state
  const activeCalls = useMemo(() => {
    if (!isConnected || !calls || activeCallIds.length === 0) return [];

    return activeCallIds
      .map((callId) => {
        const call = calls[callId];
        if (!call) return null;

        const customerName = call.orderData?.customer_name || "Incoming Call";
        const phoneNumber = call.orderData?.phone_number || "Connecting...";

        const formatDuration = (seconds, timerStarted) => {
          if (!timerStarted) return "Live";
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins}:${secs.toString().padStart(2, "0")}`;
        };

        return {
          id: callId,
          callerName: customerName,
          phoneNumber: phoneNumber,
          avatar:
            customerName !== "Incoming Call"
              ? customerName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
              : "??",
          status: call.isCallEnded ? "ended" : "in-progress",
          duration: formatDuration(call.duration, call.callTimerStarted),
          isSelected: callId === selectedCallId,
          isAudioMuted: call.isAudioMuted || false,
          isTakenOver: call.isTakenOver || false,
          hasOrder: call.orderData && Object.keys(call.orderData).length > 0,
        };
      })
      .filter(Boolean);
  }, [calls, activeCallIds, selectedCallId, isConnected]);

  const filteredCalls = useMemo(() => {
    if (!searchQuery) return activeCalls;

    return activeCalls.filter(
      (call) =>
        call.callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.phoneNumber.includes(searchQuery)
    );
  }, [activeCalls, searchQuery]);

  const handleCallClick = (call) => {
    setSelectedCallId(call.id);
    if (setSelectedCall) {
      setSelectedCall(call);
    }
  };

  return (
    <div className="w-80 bg-black/40 border-r border-white/10 flex flex-col h-screen backdrop-blur-xl">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-br from-[#FD6262]/10 to-transparent p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img
              src="https://ucarecdn.com/318a2f4a-0da5-416c-b58e-d4512d02da5e/-/format/auto/"
              alt="Vox Logo"
              className="w-14 h-14 object-contain rounded-xl hover:scale-110 transition-transform duration-300"
            />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                VOX
              </h1>
              <div className="text-[10px] text-gray-400 tracking-widest uppercase font-semibold">
                {backendUrl ? `${backendUrl.toUpperCase()}` : "Dashboard"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10 hover:border-[#FD6262]/50 group"
              title={
                language === "english" ? "Switch to Urdu" : "Switch to English"
              }
            >
              <Globe className="w-4 h-4 text-gray-400 group-hover:text-[#FD6262] transition-colors" />
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 bg-red-600/20 hover:bg-red-600 rounded-lg transition-all border border-red-500/30 hover:border-red-500 group"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-red-400 group-hover:text-white transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
          isConnected
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className={`text-xs font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              currentView === "dashboard"
                ? "bg-gradient-to-r from-[#FD6262] to-[#ff7272] text-white shadow-lg shadow-[#FD6262]/30"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            <Zap className="w-4 h-4" />
            Live
          </button>
          <button
            onClick={() => setCurrentView("pos")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              currentView === "pos"
                ? "bg-gradient-to-r from-[#FD6262] to-[#ff7272] text-white shadow-lg shadow-[#FD6262]/30"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            History
          </button>
        </div>

        {/* Search */}
        {currentView === "dashboard" && (
          <div className="relative mt-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FD6262]/50 focus:ring-2 focus:ring-[#FD6262]/20 transition-all"
            />
          </div>
        )}
      </div>

      {/* Active Calls List */}
      {currentView === "dashboard" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5" />
              Active Calls
            </h3>
            <span
              className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                filteredCalls.length > 0
                  ? "bg-[#FD6262]/20 text-[#FD6262] border border-[#FD6262]/30"
                  : "bg-white/5 text-gray-500 border border-white/5"
              }`}
            >
              {filteredCalls.length}
            </span>
          </div>

          {/* Calls List */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {filteredCalls.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FD6262]/20 to-[#FD6262]/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FD6262]/20">
                  <PhoneCall className="w-10 h-10 text-[#FD6262]/60 animate-pulse" />
                </div>
                <p className="text-sm text-gray-400 font-medium">
                  {isConnected ? "Waiting for calls..." : "Connecting..."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCalls.map((call) => (
                  <div
                    key={call.id}
                    onClick={() => handleCallClick(call)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                      call.isSelected
                        ? "bg-gradient-to-br from-[#FD6262]/20 to-[#FD6262]/5 border-[#FD6262]/50 shadow-lg shadow-[#FD6262]/20"
                        : "bg-white/5 border-white/10 hover:border-[#FD6262]/30 hover:bg-white/10"
                    } ${call.status === 'ended' ? 'opacity-60' : ''}`}
                  >
                    {/* Call Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg relative ${
                        call.status === 'ended'
                          ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-400'
                          : 'bg-gradient-to-br from-[#FD6262] to-[#ff8888] text-white'
                      }`}>
                        {call.avatar}
                        {call.status !== 'ended' && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                          {call.callerName}
                          {call.isTakenOver && (
                            <span className="px-1.5 py-0.5 bg-[#FD6262]/30 text-[#FD6262] text-[10px] rounded border border-[#FD6262]/50 font-bold">
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {call.phoneNumber}
                        </div>
                      </div>
                    </div>

                    {/* Call Info */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-medium">{call.duration}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {call.hasOrder && (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Has order data" />
                        )}
                        <span className={`px-2 py-1 rounded-md font-bold text-[10px] ${
                          call.status === 'ended'
                            ? 'bg-gray-700/50 text-gray-400 border border-gray-600'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {call.status === 'ended' ? 'ENDED' : 'LIVE'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Info Bar */}
                    {call.isSelected && call.status !== 'ended' && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Quick Actions</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCallMute(call.id);
                            }}
                            className={`p-1.5 rounded-lg transition-all ${
                              call.isAudioMuted
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {call.isAudioMuted ? (
                              <VolumeX className="w-3.5 h-3.5" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-white/10 bg-black/30 px-6 py-4">
        <div className="text-[10px] text-gray-500 text-center">
          Powered by <span className="text-[#FD6262] font-bold">Vox AI</span>
        </div>
      </div>
    </div>
  );
}
