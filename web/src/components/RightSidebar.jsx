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
      <div className="w-80 bg-[#111111] border-l border-gray-800 p-6 overflow-y-auto h-screen flex flex-col">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <User className="w-12 h-12 text-gray-800 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Waiting for active call...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-[#111111] border-l border-gray-800 p-6 overflow-y-auto h-screen flex flex-col">
      <h3 className="text-xl font-bold mb-6 text-white">
        {t.customerAnalytics || "Order Details"}
      </h3>

      <div className="flex-1">
        {/* Customer Info */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 border border-gray-800">
          <h4 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4" />
            Customer Info
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name:</span>
              <span className="font-medium text-white">
                {orderData?.customer_name || (
                  <span className="text-gray-600 italic">Extracting...</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone:</span>
              <span className="font-medium text-white">
                {orderData?.phone_number || (
                  <span className="text-gray-600 italic">Extracting...</span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-500">Address:</span>
              <span className="font-medium text-white text-right max-w-[180px]">
                {orderData?.delivery_address || (
                  <span className="text-gray-600 italic">Extracting...</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 border border-gray-800">
          <h4 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4" />
            Order Items
          </h4>
          {orderData?.order_items && orderData.order_items.length > 0 ? (
            <div className="space-y-2">
              {orderData.order_items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#0a0a0a] p-3 rounded border border-gray-800"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-white">
                      {item.quantity}x {item.item}
                    </span>
                  </div>
                  {item.notes && (
                    <span className="text-xs text-gray-500 italic">
                      {item.notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600 italic">
              Extracting items...
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 border border-gray-800">
          <h4 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider">
            Order Details
          </h4>
          <div className="space-y-3 text-sm">
            {orderData?.special_instructions && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-400 mb-1">
                      Special Instructions
                    </div>
                    <div className="text-gray-200">
                      {orderData.special_instructions}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Payment:</span>
              <span className="font-medium text-white capitalize">
                {orderData?.payment_method || (
                  <span className="text-gray-600 italic">Extracting...</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Delivery:</span>
              <span className="font-medium text-white">
                {orderData?.delivery_time || (
                  <span className="text-gray-600 italic">Extracting...</span>
                )}
              </span>
            </div>

            {orderData?.total_price && (
              <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-gray-500 font-semibold">Total:</span>
                <span className="font-bold text-green-400 text-lg">
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
