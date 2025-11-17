import {
  User,
  Package,
  MapPin,
  CreditCard,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react";

export function RightSidebar({ t, selectedCall, orderData }) {
  // ✅ Only show sidebar content when there's an active call with orderData
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
