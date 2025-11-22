import {
  User,
  Package,
  MapPin,
  CreditCard,
  Clock,
  DollarSign,
  FileText,
  PhoneOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";

export function RightSidebar({ t, selectedCall, orderData, lastEndedCall, clearLastEndedCall }) {
  // 🔥 NEW: Show call ended screen if call just ended
  if (lastEndedCall && !orderData) {
    const { saveStatus, duration, callId, phoneNumber, endedAt } = lastEndedCall;
    const isSaving = saveStatus?.saving;
    const isSuccess = saveStatus?.success;

    return (
      <div className="w-80 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border-l border-white/10 p-6 overflow-y-auto h-screen flex flex-col">
        <div className="flex items-center justify-center flex-1 animate-fadeInUp">
          <div className="text-center max-w-xs">
            {/* Icon */}
            <div className={`w-24 h-24 bg-gradient-to-br ${isSaving ? 'from-blue-500/20 to-blue-500/5 border-blue-500/20 shadow-blue-500/10' : isSuccess ? 'from-green-500/20 to-green-500/5 border-green-500/20 shadow-green-500/10' : 'from-red-500/20 to-red-500/5 border-red-500/20 shadow-red-500/10'} rounded-3xl flex items-center justify-center mx-auto mb-6 border shadow-2xl`}>
              {isSaving ? (
                <Loader2 className="w-12 h-12 text-blue-500/70 animate-spin" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-12 h-12 text-green-500/70" />
              ) : (
                <XCircle className="w-12 h-12 text-red-500/70" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-light mb-3 text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Call Ended
            </h3>

            {/* Caller Phone Number */}
            {phoneNumber && (
              <p className="text-sm text-gray-300 mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                {phoneNumber}
              </p>
            )}

            {/* Duration */}
            {duration && (
              <p className="text-sm text-gray-400 mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                Duration: {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
              </p>
            )}

            {/* Save Status */}
            <div className={`bg-gradient-to-br ${isSaving ? 'from-blue-500/10 to-blue-500/5 border-blue-500/30' : isSuccess ? 'from-green-500/10 to-green-500/5 border-green-500/30' : 'from-red-500/10 to-red-500/5 border-red-500/30'} backdrop-blur-xl border rounded-lg p-4 mb-6`}>
              <div className="flex items-start gap-3">
                {isSaving ? (
                  <Loader2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0 animate-spin" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="text-left flex-1">
                  <p className={`text-sm font-medium mb-1 ${isSaving ? 'text-blue-400' : isSuccess ? 'text-green-400' : 'text-red-400'}`} style={{ fontFamily: 'var(--font-body)' }}>
                    {isSaving ? 'Saving Call...' : isSuccess ? 'Call Saved Successfully' : 'Call Not Saved'}
                  </p>
                  <p className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>
                    {saveStatus?.reason || 'Unknown status'}
                  </p>
                </div>
              </div>
            </div>

            {/* Clear Button - Only show when not saving */}
            {!isSaving && (
              <button
                onClick={clearLastEndedCall}
                className="w-full bg-gradient-to-br from-[#FD6262]/20 to-[#FD6262]/10 hover:from-[#FD6262]/30 hover:to-[#FD6262]/15 border border-[#FD6262]/30 rounded-lg px-4 py-3 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <RefreshCw className="w-4 h-4" />
                Clear & Wait for Next Call
              </button>
            )}

            {/* Call ID */}
            <p className="text-xs text-gray-500 mt-4" style={{ fontFamily: 'var(--font-body)' }}>
              Call ID: {callId?.slice(0, 12)}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Show waiting screen when no active call and no recently ended call
  if (!orderData) {
    return (
      <div className="w-80 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border-l border-white/10 p-6 overflow-y-auto h-screen flex flex-col">
        <div className="flex items-center justify-center flex-1 animate-fadeInUp">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#FD6262]/20 to-[#FD6262]/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#FD6262]/20 shadow-2xl shadow-[#FD6262]/10">
              <User className="w-12 h-12 text-[#FD6262]/60" />
            </div>
            <p className="text-gray-400 text-sm" style={{ fontFamily: 'var(--font-body)' }}>Waiting for active call...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border-l border-white/10 p-6 overflow-y-auto h-screen flex flex-col">
      <h3 className="text-xl font-light mb-6 text-white" style={{ fontFamily: 'var(--font-heading)' }}>
        {t.customerAnalytics || "Order Details"}
      </h3>

      <div className="flex-1">
        {/* Customer Info */}
        <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-white/10 hover:border-[#FD6262]/30 rounded-lg p-4 mb-4 transition-all animate-fadeInUp">
          <h4 className="text-sm mb-3 text-[#b0b0b0] uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            <User className="w-4 h-4 text-[#FD6262]" />
            Customer Info
          </h4>
          <div className="space-y-2 text-sm">
            {selectedCall?.phoneNumber && (
              <div className="flex justify-between">
                <span className="text-[#b0b0b0]" style={{ fontFamily: 'var(--font-body)' }}>Caller:</span>
                <span className="text-white" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                  {selectedCall.phoneNumber}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#b0b0b0]" style={{ fontFamily: 'var(--font-body)' }}>Name:</span>
              <span className="text-white" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                {orderData?.customer_name || (
                  <span className="text-[#666] italic">Extracting...</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#b0b0b0]" style={{ fontFamily: 'var(--font-body)' }}>Phone:</span>
              <span className="text-white" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                {orderData?.phone_number || (
                  <span className="text-[#666] italic">Extracting...</span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-[#b0b0b0]" style={{ fontFamily: 'var(--font-body)' }}>Address:</span>
              <span className="text-white text-right max-w-[180px]" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                {orderData?.delivery_address || (
                  <span className="text-[#666] italic">Extracting...</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-white/10 hover:border-[#FD6262]/30 rounded-lg p-4 mb-4 transition-all animate-fadeInUp">
          <h4 className="text-sm mb-3 text-[#b0b0b0] uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            <Package className="w-4 h-4 text-[#FD6262]" />
            Order Items
          </h4>
          {orderData?.order_items && orderData.order_items.length > 0 ? (
            <div className="space-y-2">
              {orderData.order_items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#1b1c1e] p-3 rounded border border-white/10 hover:border-[#FD6262]/30 transition-all"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                      {item.quantity}x {item.item}
                    </span>
                  </div>
                  {item.notes && (
                    <span className="text-xs text-[#b0b0b0] italic" style={{ fontFamily: 'var(--font-body)' }}>
                      {item.notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[#666] italic" style={{ fontFamily: 'var(--font-body)' }}>
              Extracting items...
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-white/10 hover:border-[#FD6262]/30 rounded-lg p-4 mb-4 transition-all animate-fadeInUp">
          <h4 className="text-sm mb-3 text-[#b0b0b0] uppercase tracking-wider" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            Order Details
          </h4>
          <div className="space-y-3 text-sm">
            {orderData?.special_instructions && (
              <div className="bg-[#FD6262]/10 border border-[#FD6262]/30 p-3 rounded">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-[#FD6262] mt-0.5" />
                  <div>
                    <div className="text-xs text-[#b0b0b0] mb-1" style={{ fontFamily: 'var(--font-body)' }}>
                      Special Instructions
                    </div>
                    <div className="text-white" style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}>
                      {orderData.special_instructions}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#b0b0b0]" />
              <span className="text-[#b0b0b0]" style={{ fontFamily: 'var(--font-body)' }}>Payment:</span>
              <span className="text-white capitalize" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                {orderData?.payment_method || (
                  <span className="text-[#666] italic">Extracting...</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#b0b0b0]" />
              <span className="text-[#b0b0b0]" style={{ fontFamily: 'var(--font-body)' }}>Delivery:</span>
              <span className="text-white" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                {orderData?.delivery_time || (
                  <span className="text-[#666] italic">Extracting...</span>
                )}
              </span>
            </div>

            {orderData?.total_price && (
              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                <DollarSign className="w-5 h-5 text-[#FD6262]" />
                <span className="text-[#b0b0b0]" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>Total:</span>
                <span className="text-[#FD6262] text-lg" style={{ fontFamily: 'var(--font-heading)', fontWeight: 300 }}>
                  {orderData.total_price}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
