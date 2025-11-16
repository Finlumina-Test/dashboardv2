"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function HomePage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const storedBackend = localStorage.getItem("restaurant_backend");
    if (storedBackend) {
      setIsLoggedIn(true);
      // Redirect to dashboard if already logged in
      navigate(`/dashboard/${storedBackend}`);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/*
        ========================================
        HTML EMBED AREA
        ========================================
        Replace the content below with your HTML embeds.
        You can add:
        - iframe embeds
        - Custom HTML
        - Scripts
        - Anything you need!
      */}

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="w-24 h-24 mx-auto mb-6">
            <img
              src="https://ucarecdn.com/318a2f4a-0da5-416c-b58e-d4512d02da5e/-/format/auto/"
              alt="Vox Logo"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <h1 className="text-5xl font-bold tracking-wide mb-4">
            Welcome to VOX
          </h1>
          <p className="text-xl text-gray-400">
            AI-Powered Restaurant Call Management
          </p>
        </header>

        {/* Main Content Area - ADD YOUR HTML EMBEDS HERE */}
        <main className="max-w-6xl mx-auto">
          {/* Example: You can add iframes, calendly embeds, etc. */}

          {/* Placeholder content - replace with your embeds */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-[#111111] border border-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-semibold mb-4">Embed Section 1</h2>
              <p className="text-gray-400 mb-4">
                Add your first HTML embed here. This could be:
              </p>
              <ul className="text-gray-400 space-y-2 list-disc list-inside">
                <li>Calendly booking widget</li>
                <li>Contact form</li>
                <li>Video embed</li>
                <li>Custom HTML content</li>
              </ul>

              {/* Example iframe embed - uncomment and customize:
              <iframe
                src="https://your-embed-url.com"
                width="100%"
                height="500"
                frameBorder="0"
                className="rounded-lg mt-4"
              />
              */}
            </div>

            <div className="bg-[#111111] border border-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-semibold mb-4">Embed Section 2</h2>
              <p className="text-gray-400 mb-4">
                Add your second HTML embed here.
              </p>

              {/* Add your second embed here */}
            </div>
          </div>

          {/* Full-width embed section */}
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-4">Full-Width Embed</h2>
            <p className="text-gray-400 mb-4">
              Perfect for wider content like calendars, forms, or presentations.
            </p>

            {/* Add your full-width embed here */}
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <a
              href="/login"
              className="inline-block bg-white text-black font-semibold py-4 px-8 rounded-lg hover:bg-gray-100 transition-all text-lg"
            >
              Restaurant Login →
            </a>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-500">
          <p>&copy; 2024 VOX. All rights reserved.</p>
        </footer>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>
    </div>
  );
}
