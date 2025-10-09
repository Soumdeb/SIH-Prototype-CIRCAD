import { AnalysisProvider } from "./context/AnalysisContext";
import Upload from "./pages/Upload";
import Analysis from "./pages/Analysis";
import Dashboard from "./pages/Dashboard";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function App() {
  return (
    <AnalysisProvider>
      <BrowserRouter>
        <div className="min-h-screen flex bg-slate-50 text-gray-800">
          {/* Sidebar */}
          <aside className="w-64 bg-white shadow-md p-6 flex flex-col">
            <h1 className="text-2xl font-bold mb-6 text-cyan-700">CIRCAD</h1>
            <nav className="flex flex-col gap-3">
              <Link to="/" className="hover:text-cyan-600 font-medium">Upload</Link>
              <Link to="/analysis" className="hover:text-cyan-600 font-medium">Analysis</Link>
              <Link to="/dashboard" className="hover:text-cyan-600 font-medium">Dashboard</Link>
            </nav>
            <footer className="mt-auto text-xs text-gray-400">© 2025 CIRCAD</footer>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Upload />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AnalysisProvider>
  );
}

export default App;
