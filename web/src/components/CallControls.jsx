import { MicOff, UserCheck, PhoneOff, Mic, Phone } from "lucide-react";
import { useState } from "react";
import { ConfirmationModal } from "./ConfirmationModal";

export function CallControls({
  t,
  handleTakeOver,
  isTakenOver,
  endTakeOver,
  isMicMuted,
  toggleMicMute,
  endCall,
}) {
  const [showTakeOverModal, setShowTakeOverModal] = useState(false);
  const [showEndCallModal, setShowEndCallModal] = useState(false);

  const handleTakeOverClick = () => {
    setShowTakeOverModal(true);
  };

  const handleEndCallClick = () => {
    setShowEndCallModal(true);
  };

  const confirmTakeOver = () => {
    handleTakeOver();
  };

  const confirmEndCall = () => {
    endCall();
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row items-center justify-center gap-3 lg:gap-4 mb-6 lg:mb-8">
        {!isTakenOver ? (
          <>
            {/* Take Over Button */}
            <button
              onClick={handleTakeOverClick}
              className="w-full lg:w-auto px-6 lg:px-8 py-3 lg:py-4 bg-white hover:bg-gray-100 text-black rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg text-sm lg:text-base"
            >
              <UserCheck className="w-4 h-4 lg:w-5 lg:h-5" />
              {t.takeOverCall}
            </button>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* Microphone Button */}
              <button
                onClick={toggleMicMute}
                className={`flex-1 lg:flex-none p-3 lg:p-4 rounded-xl transition-all duration-200 border ${
                  isTakenOver
                    ? isMicMuted
                      ? "bg-red-600 hover:bg-red-700 border-red-500 text-white shadow-lg shadow-red-600/30"
                      : "bg-green-600 hover:bg-green-700 border-green-500 text-white shadow-lg shadow-green-600/30"
                    : "bg-[#1a1a1a] hover:bg-[#222222] border-gray-800 text-gray-400"
                }`}
                disabled={!isTakenOver}
              >
                {isMicMuted ? (
                  <MicOff className="w-4 h-4 lg:w-5 lg:h-5 mx-auto" />
                ) : (
                  <Mic className="w-4 h-4 lg:w-5 lg:h-5 mx-auto" />
                )}
              </button>

              {/* End Call Button */}
              <button
                onClick={handleEndCallClick}
                className="flex-1 lg:flex-none px-4 lg:px-6 py-3 lg:py-4 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-red-700/30 border border-red-600 text-sm lg:text-base"
              >
                <PhoneOff className="w-4 h-4 lg:w-5 lg:h-5" />
                End Call
              </button>
            </div>
          </>
        ) : (
          <>
            {/* End Takeover Button */}
            <button
              onClick={endTakeOver}
              className="w-full lg:w-auto px-6 lg:px-8 py-3 lg:py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-green-600/30 animate-pulse text-sm lg:text-base"
            >
              <PhoneOff className="w-4 h-4 lg:w-5 lg:h-5" />
              End Takeover
            </button>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* Microphone Button */}
              <button
                onClick={toggleMicMute}
                className={`flex-1 lg:flex-none p-3 lg:p-4 rounded-xl transition-all duration-200 border ${
                  isTakenOver
                    ? isMicMuted
                      ? "bg-red-600 hover:bg-red-700 border-red-500 text-white shadow-lg shadow-red-600/30"
                      : "bg-green-600 hover:bg-green-700 border-green-500 text-white shadow-lg shadow-green-600/30"
                    : "bg-[#1a1a1a] hover:bg-[#222222] border-gray-800 text-gray-400"
                }`}
                disabled={!isTakenOver}
              >
                {isMicMuted ? (
                  <MicOff className="w-4 h-4 lg:w-5 lg:h-5 mx-auto" />
                ) : (
                  <Mic className="w-4 h-4 lg:w-5 lg:h-5 mx-auto" />
                )}
              </button>

              {/* End Call Button */}
              <button
                onClick={handleEndCallClick}
                className="flex-1 lg:flex-none px-4 lg:px-6 py-3 lg:py-4 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-red-700/30 border border-red-600 text-sm lg:text-base"
              >
                <Phone className="w-4 h-4 lg:w-5 lg:h-5 rotate-[135deg]" />
                End Call
              </button>
            </div>
          </>
        )}
      </div>

      {/* Take Over Confirmation Modal */}
      <ConfirmationModal
        isOpen={showTakeOverModal}
        onClose={() => setShowTakeOverModal(false)}
        onConfirm={confirmTakeOver}
        title="Take Over Call"
        message="Are you sure you want to take over this call? You will be connected to the customer and the AI will be muted."
        confirmText="Take Over"
        confirmButtonClass="bg-white hover:bg-gray-100 text-black"
      />

      {/* End Call Confirmation Modal */}
      <ConfirmationModal
        isOpen={showEndCallModal}
        onClose={() => setShowEndCallModal(false)}
        onConfirm={confirmEndCall}
        title="End Call"
        message="Are you sure you want to end this call? This action cannot be undone and the call will be terminated immediately."
        confirmText="End Call"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />
    </>
  );
}
