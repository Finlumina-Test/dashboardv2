import { useEffect, useState } from "react";
import { PhoneOff, X, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export function CallEndedNotification({ lastEndedCall, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (lastEndedCall) {
      // Trigger entrance animation
      setIsVisible(true);
      setIsExiting(false);
    } else {
      setIsVisible(false);
    }
  }, [lastEndedCall]);

  // Auto-dismiss after save completes
  useEffect(() => {
    if (lastEndedCall && !lastEndedCall.saveStatus?.saving && lastEndedCall.saveStatus?.success !== null) {
      // Save completed (success or failure), auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [lastEndedCall?.saveStatus]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) onDismiss();
    }, 300);
  };

  if (!isVisible || !lastEndedCall) return null;

  const { saveStatus, duration, callId } = lastEndedCall;
  const isSaving = saveStatus?.saving;
  const isSuccess = saveStatus?.success;

  return (
    <div
      className={`fixed top-20 right-6 z-50 w-96 transition-all duration-300 ease-out ${
        isExiting
          ? "translate-x-full opacity-0"
          : isVisible
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      }`}
    >
      <div className="bg-gradient-to-br from-black/95 to-black/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with close button */}
        <div className="relative bg-gradient-to-r from-[#FD6262]/20 to-[#FD6262]/10 border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                isSaving
                  ? "from-blue-500/30 to-blue-500/10"
                  : isSuccess
                  ? "from-green-500/30 to-green-500/10"
                  : "from-red-500/30 to-red-500/10"
              } flex items-center justify-center`}>
                {isSaving ? (
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Call Ended
                </h3>
                {duration !== undefined && (
                  <p className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>
                    Duration: {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <div className={`flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br ${
            isSaving
              ? "from-blue-500/10 to-blue-500/5 border border-blue-500/30"
              : isSuccess
              ? "from-green-500/10 to-green-500/5 border border-green-500/30"
              : "from-red-500/10 to-red-500/5 border border-red-500/30"
          }`}>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isSaving
                  ? "text-blue-400"
                  : isSuccess
                  ? "text-green-400"
                  : "text-red-400"
              }`} style={{ fontFamily: 'var(--font-body)' }}>
                {isSaving ? "Saving call..." : isSuccess ? "Call saved successfully" : "Call not saved"}
              </p>
              <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                {saveStatus?.reason || "Processing..."}
              </p>
            </div>
          </div>

          {!isSaving && (
            <p className="text-xs text-gray-500 mt-3 text-center" style={{ fontFamily: 'var(--font-body)' }}>
              Check the right sidebar for details
            </p>
          )}
        </div>

        {/* Progress bar - only show while saving */}
        {isSaving && (
          <div className="h-1 bg-black/50 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
