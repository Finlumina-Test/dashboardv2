"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getAllRestaurants } from "@/utils/restaurantConfig";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const storedBackend = localStorage.getItem("restaurant_backend");
    if (storedBackend) {
      window.location.href = `/dashboard/${storedBackend}`;
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Get all restaurants from configuration
    const restaurants = getAllRestaurants();

    // Find matching restaurant
    const restaurantEntry = Object.entries(restaurants).find(
      ([key, config]) =>
        config.username === username && config.password === password,
    );

    if (restaurantEntry) {
      const [restaurantId, config] = restaurantEntry;

      // Save only the restaurant backend identifier
      localStorage.setItem("restaurant_backend", restaurantId);

      // Redirect to dashboard
      window.location.href = `/dashboard/${restaurantId}`;
    } else {
      setError("Invalid credentials");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-inter">
      <div className="max-w-md w-full mx-4">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4">
            <img
              src="/vox-logo.svg"
              alt="Vox Logo"
              className="w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 0 15px rgba(253, 98, 98, 0.4))' }}
            />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide mb-2">
            VOX
          </h1>
          <div className="text-sm text-gray-400 font-medium tracking-widest uppercase">
            DASHBOARD LOGIN
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-[#111111] border border-gray-800 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Restaurant Login
          </h2>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                placeholder="Enter restaurant username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#111111] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        .font-inter {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>
    </div>
  );
}
