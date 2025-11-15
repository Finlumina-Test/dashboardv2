export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export const getStatusColor = (status) => {
  switch (status) {
    case "active":
      return "bg-[#1e40af]"; // Navy blue
    case "on-hold":
      return "bg-gray-500";
    case "escalated":
      return "bg-[#FF4444]"; // Red
    default:
      return "bg-gray-500";
  }
};

export const getStatusBadge = (status) => {
  switch (status) {
    case "active":
      return "bg-[#1e40af]/20 text-[#3b82f6] border-[#1e40af]/30";
    case "on-hold":
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    case "escalated":
      return "bg-[#FF4444]/20 text-[#FF4444] border-[#FF4444]/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

export const getConfidenceColor = (confidence) => {
  if (confidence >= 80) return "text-[#3b82f6]"; // Navy blue
  if (confidence >= 60) return "text-gray-400";
  return "text-[#FF4444]"; // Red
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case "urgent":
      return "bg-[#FF4444]/20 text-[#FF4444] border-[#FF4444]/30";
    case "high":
      return "bg-[#1e40af]/20 text-[#3b82f6] border-[#1e40af]/30";
    case "medium":
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    case "low":
      return "bg-gray-600/20 text-gray-500 border-gray-600/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};
