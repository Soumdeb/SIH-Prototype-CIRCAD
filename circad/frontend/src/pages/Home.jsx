import React, { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudUpload, Activity, BarChart3, FileText } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

const Upload = React.lazy(() => import("./Upload"));
const Analysis = React.lazy(() => import("./Analysis"));
const Dashboard = React.lazy(() => import("./Dashboard"));
const ReportsPage = React.lazy(() => import("./Reports"));

const panelMap = {
  upload: {
    title: "Upload",
    icon: CloudUpload,
    gradient: "from-cyan-500 to-cyan-600",
    desc: "Upload DCRM data for AI-driven resistance analysis.",
    comp: Upload,
  },
  analysis: {
    title: "Analysis",
    icon: Activity,
    gradient: "from-indigo-500 to-indigo-600",
    desc: "View intelligent resistance evaluation & predictions.",
    comp: Analysis,
  },
  dashboard: {
    title: "Dashboard",
    icon: BarChart3,
    gradient: "from-emerald-500 to-emerald-600",
    desc: "Explore system health trends & contact performance.",
    comp: Dashboard,
  },
  reports: {
    title: "Reports",
    icon: FileText,
    gradient: "from-rose-500 to-rose-600",
    desc: "Generate & download comprehensive DCRM reports.",
    comp: ReportsPage,
  },
};

export default function Home() {
  const [activePanel, setActivePanel] = useState(null);
  const backdropRef = useRef();
  const { theme } = useTheme();
  const panels = Object.keys(panelMap);

  // ✅ All event listeners are safely registered here (no invalid hook calls)
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && setActivePanel(null);
    const openUpload = () => setActivePanel("upload");
    const openAnalysis = () => {
      toast.success("Analysis ready! Displaying results...");
      setActivePanel("analysis");
    };

    window.addEventListener("keydown", esc);
    window.addEventListener("openUpload", openUpload);
    window.addEventListener("openAnalysis", openAnalysis);

    return () => {
      window.removeEventListener("keydown", esc);
      window.removeEventListener("openUpload", openUpload);
      window.removeEventListener("openAnalysis", openAnalysis);
    };
  }, []);

  return (
    <div
      className={`relative min-h-[calc(100vh-5rem)] flex items-center justify-center transition-colors duration-500 ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
          : "bg-gradient-to-br from-gray-100 via-slate-200 to-gray-100 text-slate-900"
      }`}
    >
      <AnimatePresence mode="wait">
        {!activePanel && (
          <motion.div
            key="grid"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-5xl mx-auto"
          >
            {panels.map((id) => {
              const { title, icon: Icon, gradient, desc } = panelMap[id];
              return (
                <motion.div
                  key={id}
                  onClick={() => setActivePanel(id)}
                  whileHover={{ y: -6 }}
                  className={`cursor-pointer rounded-2xl p-10 shadow-2xl bg-gradient-to-br ${gradient} text-white text-center flex flex-col justify-center items-center transition-transform`}
                >
                  <Icon size={48} />
                  <h3 className="text-2xl font-semibold mt-4">{title}</h3>
                  <p className="text-sm opacity-90 mt-2 max-w-sm mx-auto">
                    {desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* === InsidePanel View === */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            ref={backdropRef}
            onMouseDown={(e) =>
              e.target === backdropRef.current && setActivePanel(null)
            }
            key="inside"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex justify-center items-center gap-8 px-6 pt-8"
          >
            {/* Left side unopened panels */}
            <div className="flex flex-col justify-between h-[70vh] w-64 gap-4">
              {panels
                .filter((p) => p !== activePanel)
                .map((p) => {
                  const { icon: Icon, title, gradient } = panelMap[p];
                  return (
                    <motion.div
                      key={p}
                      onClick={() => setActivePanel(p)}
                      whileHover={{ scale: 1.05 }}
                      className={`cursor-pointer h-full flex flex-col justify-center items-center rounded-xl shadow-lg bg-gradient-to-br ${gradient} text-white hover:opacity-90 transition`}
                    >
                      <Icon size={28} />
                      <p className="mt-1 text-sm font-medium">{title}</p>
                    </motion.div>
                  );
                })}
            </div>

            {/* Right side opened panel */}
            <motion.div
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 25 }}
              transition={{ duration: 0.35 }}
              className="flex-1 max-w-5xl h-[70vh] bg-slate-900/80 dark:bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-5 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-800 rounded-lg">
                    {React.createElement(panelMap[activePanel].icon, {
                      size: 24,
                    })}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {panelMap[activePanel].title}
                    </h2>
                    <p className="text-sm opacity-80">
                      {panelMap[activePanel].desc}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePanel(null)}
                  className="px-4 py-2 text-sm bg-slate-800 rounded-md hover:bg-slate-700 transition"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
                  {React.createElement(panelMap[activePanel].comp)}
                </Suspense>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
