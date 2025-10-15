import { createContext, useContext, useEffect, useState } from "react";

export const AnalysisContext = createContext(); // ✅ add export here

export const AnalysisProvider = ({ children }) => {
  const [analysisData, setAnalysisData] = useState(() => {
    try {
      const saved = localStorage.getItem("lastAnalysis");
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.warn("Error reading saved analysis:", err);
      return null;
    }
  });

  useEffect(() => {
    if (analysisData) {
      try {
        localStorage.setItem("lastAnalysis", JSON.stringify(analysisData));
      } catch (err) {
        console.warn("Error saving analysis:", err);
      }
    }
  }, [analysisData]);

  return (
    <AnalysisContext.Provider value={{ analysisData, setAnalysisData }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => useContext(AnalysisContext);
