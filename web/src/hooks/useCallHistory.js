import { useState, useEffect } from "react";

export function useCallHistory(search, restaurantId, isConnected) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("🔍 useCallHistory effect triggered:", {
      search,
      restaurantId,
      isConnected,
    });

    // ✅ FIXED: Only fetch calls when server is connected
    if (restaurantId && isConnected) {
      fetchCalls();
    } else {
      console.log(
        "⚠️ Not fetching calls - server not connected or no restaurantId",
      );
      setCalls([]);
      setLoading(false);
      if (!isConnected) {
        setError("Server not connected");
      }
    }
  }, [search, restaurantId, isConnected]);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📡 Fetching calls from API...");
      console.log(
        "🔗 URL:",
        `/api/calls/list?search=${encodeURIComponent(search)}&backend=${encodeURIComponent(restaurantId)}`,
      );

      // Use internal API endpoint instead of external backend
      const response = await fetch(
        `/api/calls/list?search=${encodeURIComponent(search)}&backend=${encodeURIComponent(restaurantId)}`,
      );

      console.log("📥 API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        throw new Error(
          `Failed to fetch calls: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("📊 API Response data:", data);
      console.log("📋 Calls returned:", data.calls?.length || 0);

      setCalls(data.calls || []);
    } catch (error) {
      console.error("❌ Error fetching call history:", error);
      setError(error.message);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  return { calls, loading, error };
}
