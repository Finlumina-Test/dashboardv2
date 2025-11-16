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

        // 🔥 FIXED: Format duration - show timer even at 0:00
        const formatDuration = (seconds, timerStarted) => {
          // If timer hasn't started yet, show "Live"
          if (!timerStarted) return "Live";
          // If timer started, show the duration (even if 0)
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
          duration: formatDuration(call.duration, call.callTimerStarted),
          isSelected: callId === selectedCallId,
          isAudioMuted: call.isAudioMuted || false, // 🔥 NEW: Per-call audio mute state
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
    <div className="w-80 bg-[#1b1c1e] border-r border-[rgba(79,79,80,0.3)] flex flex-col h-screen">
      <div className="card-gradient border-b border-[rgba(79,79,80,0.3)] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Vox logo image - increased size */}
            <img
              src="https://ucarecdn.com/318a2f4a-0da5-416c-b58e-d4512d02da5e/-/format/auto/"
              alt="Vox Logo"
              className="w-16 h-16 object-contain rounded-lg hover-scale"
            />
            <div>
              <h1 className="text-xl font-light text-white tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>
                VOX
              </h1>
              <div className="text-xs text-[#b0b0b0] tracking-widest uppercase" style={{ fontFamily: 'var(--font-body)' }}>
                {backendUrl
                  ? `${backendUrl.toUpperCase()} DASHBOARD`
                  : "DASHBOARD"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="p-2 bg-[#1b1c1e] hover:bg-[#2a2a2c] rounded transition-all border border-[rgba(79,79,80,0.3)] hover-scale"
              title={
                language === "english" ? "Switch to Urdu" : "Switch to English"
              }
            >
              <Globe className="w-4 h-4 text-[#b0b0b0] hover:text-accent" />
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 bg-red-600 hover:bg-red-700 rounded transition-all hover-scale"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-[#b0b0b0] mb-4 text-center" style={{ fontFamily: 'var(--font-body)' }}>
          {language === "english" ? "English" : "Roman Urdu"}
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`flex-1 px-3 py-2 rounded text-sm transition-all ${
              currentView === "dashboard"
                ? "bg-accent text-white shadow-lg"
                : "bg-[#1b1c1e] text-[#b0b0b0] hover:bg-[#2a2a2c] hover:text-white border border-[rgba(79,79,80,0.3)]"
            }`}
            style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView("pos")}
            className={`flex-1 px-3 py-2 rounded text-sm transition-all flex items-center gap-2 justify-center ${
              currentView === "pos"
                ? "bg-accent text-white shadow-lg"
                : "bg-[#1b1c1e] text-[#b0b0b0] hover:bg-[#2a2a2c] hover:text-white border border-[rgba(79,79,80,0.3)]"
            }`}
            style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
          >
            <ShoppingCart className="w-4 h-4" />
            POS & History
          </button>
        </div>

        {currentView === "dashboard" && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#b0b0b0]" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1b1c1e] border border-[rgba(79,79,80,0.3)] rounded pl-10 pr-4 py-3 text-sm text-white placeholder-[#666] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
        )}
      </div>

      {currentView === "dashboard" && (
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm text-[#b0b0b0] uppercase tracking-wider" style={{ fontFamily: 'var(--font-body)' }}>
              {t.activeCalls}
            </h3>
            <span
              className={`text-xs px-3 py-1 rounded-full ${
                filteredCalls.length > 0
                  ? "bg-accent text-white animate-pulse-soft"
                  : "bg-[#2a2a2c] text-[#666]"
              }`}
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              {filteredCalls.length}
            </span>
          </div>

          {filteredCalls.length === 0 ? (
            <div className="text-center py-12 flex-1 flex flex-col justify-center animate-fadeInUp">
              <PhoneCall className="w-12 h-12 text-accent mx-auto mb-3 animate-pulse-soft" />
              <p className="text-sm text-[#b0b0b0]" style={{ fontFamily: 'var(--font-body)' }}>
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
                  className={`p-4 rounded border cursor-pointer transition-all duration-200 ${
                    call.isSelected
                      ? "card-gradient border-accent shadow-lg shadow-accent/20"
                      : "bg-[#1b1c1e] border-[rgba(79,79,80,0.3)] hover:border-accent/50 hover:bg-[#2a2a2c]"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-light text-white rounded flex items-center justify-center text-sm font-light shadow-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                      {call.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                        {call.callerName}
                      </div>
                      <div className="text-xs text-[#b0b0b0] truncate" style={{ fontFamily: 'var(--font-body)' }}>
                        {call.phoneNumber}
                      </div>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-accent shadow-lg animate-pulse-soft"></div>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="flex items-center gap-1 text-[#b0b0b0]" style={{ fontFamily: 'var(--font-body)' }}>
                      <Clock className="w-3 h-3" />
                      {call.duration}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                      LIVE
                    </span>
                  </div>

                  {/* 🔥 FIXED: Mute button for individual call - only show for selected call */}
                  {call.isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent call selection
                        if (toggleCallMute) toggleCallMute();
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        call.isAudioMuted
                          ? "bg-red-600 hover:bg-red-700 text-white border border-red-500"
                          : "bg-green-600 hover:bg-green-700 text-white border border-green-500"
                      }`}
                      title={
                        call.isAudioMuted ? "Unmute this call's audio" : "Mute this call's audio"
                      }
                    >
                      {call.isAudioMuted ? (
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