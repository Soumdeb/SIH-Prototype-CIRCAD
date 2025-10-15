import { useContext, useEffect, useRef } from "react";
import { AnalysisContext } from "../context/AnalysisContext";

// ✅ Smart localStorage-backed persistent analysis hook
export function useSafeAnalysis() {
  const context = useContext(AnalysisContext);
  const isFirstLoad = useRef(true);

  // If context is missing, fall back to localStorage (failsafe mode)
  if (!context) {
    const stored = localStorage.getItem("lastAnalysis");
    return {
      analysisData: stored ? JSON.parse(stored) : null,
      setAnalysisData: (data) => {
        try {
          localStorage.setItem("lastAnalysis", JSON.stringify(data));
        } catch (err) {
          console.warn("Failed to save analysis:", err);
        }
      },
    };
  }

  const { analysisData, setAnalysisData } = context;

  // ✅ On first mount, restore from localStorage if needed
  useEffect(() => {
    if (isFirstLoad.current && !analysisData) {
      const stored = localStorage.getItem("lastAnalysis");
      if (stored) {
        try {
          setAnalysisData(JSON.parse(stored));
        } catch (err) {
          console.warn("Failed to parse saved analysis:", err);
        }
      }
      isFirstLoad.current = false;
    }
  }, [analysisData, setAnalysisData]);

  // ✅ Keep localStorage synced (only when value actually changes)
  useEffect(() => {
    if (analysisData) {
      try {
        localStorage.setItem("lastAnalysis", JSON.stringify(analysisData));
      } catch (err) {
        console.warn("Failed to persist analysis:", err);
      }
    }
  }, [analysisData]);

  return { analysisData, setAnalysisData };
}
