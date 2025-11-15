import {
  BarChart3,
  Globe,
  History,
  Search,
  Clock,
  PhoneCall,
  ShoppingCart,
  LogOut,
  VolumeX,
  Volume2,
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
  // 🔥 NEW: Multi-call props
  calls, // Object of all calls { [callId]: callData }
  activeCallIds, // Array of active call IDs
  selectedCallId,
  setSelectedCallId,
  isConnected,
  backendUrl,
  onLogout,
  isCallMuted,
  toggleCallMute,
}) {
  // 🔥 NEW: Create active calls array from multi-call state
  const activeCalls = useMemo(() => {
    if (!isConnected || !calls || activeCallIds.length === 0) return [];

    return activeCallIds
      .map((callId) => {
        const call = calls[callId];
        if (!call) return null;

        const customerName = call.orderData?.customer_name || "Incoming Call";
        const phoneNumber = call.orderData?.phone_number || "Connecting...";

        // Format duration
        const formatDuration = (seconds) => {
          if (!seconds || seconds === 0) return "Live";
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
          status: "in-progress",
          duration: formatDuration(call.duration),
          isSelected: callId === selectedCallId,
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

  // 🔥 NEW: Handle call selection
  const handleCallClick = (call) => {
    setSelectedCallId(call.id);
    // For backward compatibility
    if (setSelectedCall) {
      setSelectedCall(call);
    }
  };

  return (
    <div className="w-80 bg-[#111111] border-r border-gray-800 flex flex-col h-screen">
      <div className="bg-[#0a0a0a] border-b border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Vox logo image - increased size */}
            <img
              src="https://ucarecdn.com/318a2f4a-0da5-416c-b58e-d4512d02da5e/-/format/auto/"
              alt="Vox Logo"
              className="w-16 h-16 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                VOX
              </h1>
              <div className="text-xs text-gray-400 font-medium tracking-widest uppercase">
                {backendUrl
                  ? `${backendUrl.toUpperCase()} DASHBOARD`
                  : "DASHBOARD"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="p-2 bg-[#1a1a1a] hover:bg-[#222222] rounded-lg transition-all border border-gray-800"
              title={
                language === "english" ? "Switch to Urdu" : "Switch to English"
              }
            >
              <Globe className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-4 text-center">
          {language === "english" ? "English" : "Roman Urdu"}
        </div>

        <div className="flex gap-2 mb-4">
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
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 justify-center ${
              currentView === "pos"
                ? "bg-white text-black"
                : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222222] hover:text-white"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            POS & History
          </button>
        </div>

        {currentView === "dashboard" && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
            />
          </div>
        )}
      </div>

      {currentView === "dashboard" && (
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              {t.activeCalls}
            </h3>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold ${
                filteredCalls.length > 0
                  ? "bg-[#FF4444] text-white animate-pulse"
                  : "bg-gray-800 text-gray-500"
              }`}
            >
              {filteredCalls.length}
            </span>
          </div>

          {filteredCalls.length === 0 ? (
            <div className="text-center py-12 flex-1 flex flex-col justify-center">
              <PhoneCall className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {isConnected
                  ? "Waiting for calls..."
                  : "Connecting to server..."}
              </p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {filteredCalls.map((call) => (
                <div
                  key={call.id}
                  onClick={() => handleCallClick(call)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    call.isSelected
                      ? "bg-[#1a1a1a] border-white shadow-lg shadow-white/10"
                      : "bg-[#151515] border-gray-800 hover:border-gray-700 hover:bg-[#1a1a1a]"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg flex items-center justify-center text-sm font-bold border border-gray-700">
                      {call.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white truncate">
                        {call.callerName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {call.phoneNumber}
                      </div>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg animate-pulse"></div>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      {call.duration}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 font-bold">
                      LIVE
                    </span>
                  </div>

                  {/* 🔥 NEW: Mute button for individual call - only show for selected call */}
                  {call.isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent call selection
                        if (toggleCallMute) toggleCallMute();
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isCallMuted
                          ? "bg-red-600 hover:bg-red-700 text-white border border-red-500"
                          : "bg-green-600 hover:bg-green-700 text-white border border-green-500"
                      }`}
                      title={
                        isCallMuted ? "Unmute call audio" : "Mute call audio"
                      }
                    >
                      {isCallMuted ? (
                        <>
                          <VolumeX className="w-3 h-3" />
                          Call Muted
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          Call Audio On
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}