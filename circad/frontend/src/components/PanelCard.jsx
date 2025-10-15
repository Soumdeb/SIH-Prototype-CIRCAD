import React from "react";

export default function PanelCard({ title, desc, Icon, onClick, color }) {
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-lg transform transition-all duration-200 hover:scale-[1.03]`}
      style={{
        background: `linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3))`,
      }}
    >
      <div
        className={`p-4 rounded-full mb-4 bg-white/60`}
        aria-hidden
      >
        <Icon size={48} className={`text-slate-800`} />
      </div>

      <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs">
        {desc}
      </p>
    </div>
  );
}
