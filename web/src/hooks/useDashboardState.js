import { useState, useEffect } from "react";
import { content } from "@/data/dashboardMockData";

export function useDashboardState() {
  const [selectedCall, setSelectedCall] = useState(null);
  const [isRecording, setIsRecording] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [waveformData, setWaveformData] = useState(
    Array.from({ length: 60 }, () => Math.random() * 60 + 10),
  );
  const [currentView, setCurrentView] = useState("dashboard"); // 'dashboard', 'pos', 'live', or 'history'
  const [language, setLanguage] = useState("english"); // 'english' or 'urdu'

  const t = content[language];

  // Animate waveform
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveformData((prev) => {
        const newData = [...prev];
        newData.shift();
        const baseHeight = 20 + Math.sin(Date.now() * 0.001) * 10;
        const variation = Math.random() * 40;
        newData.push(Math.max(5, baseHeight + variation));
        return newData;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleTakeOver = () => {
    alert(
      language === "english"
        ? "Taking over call..."
        : "Call sambhal rahe hain...",
    );
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "english" ? "urdu" : "english"));
  };

  return {
    selectedCall,
    setSelectedCall,
    isRecording,
    setIsRecording,
    callDuration,
    transcript,
    setTranscript,
    searchQuery,
    setSearchQuery,
    waveformData,
    currentView,
    setCurrentView,
    language,
    toggleLanguage,
    t,
    handleTakeOver,
  };
}
