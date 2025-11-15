export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCallDuration = (seconds) => {
  if (!seconds) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const calculateTotal = (orderData) => {
  if (!orderData?.order_items) return "0.00";

  if (orderData.total_price) {
    return orderData.total_price.replace(/[^0-9.]/g, "");
  }

  const total = orderData.order_items.reduce((sum, item) => {
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    return sum + price * quantity;
  }, 0);

  return total.toFixed(2);
};

export const getItemCount = (orderData) => {
  if (!orderData?.order_items) return 0;
  return orderData.order_items.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0,
  );
};
