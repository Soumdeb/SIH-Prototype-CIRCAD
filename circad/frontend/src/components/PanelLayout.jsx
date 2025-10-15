// src/components/PanelLayout.jsx
import React, { useRef, useState } from "react";

/**
 * A simple 2x2 grid that supports:
 * - Vertical splitter between left/right columns
 * - Horizontal splitter between top/bottom rows
 *
 * Uses inline grid style with gridTemplateColumns / gridTemplateRows percentages.
 * Drag the vertical / horizontal bar to adjust sizes.
 *
 * Children: expects four children in order:
 *  [0] top-left, [1] top-right, [2] bottom-left, [3] bottom-right
 */

export default function PanelLayout({ children }) {
  const containerRef = useRef(null);

  // column widths as percentages (left, right)
  const [colPct, setColPct] = useState([50, 50]);
  // row heights as percentages (top, bottom)
  const [rowPct, setRowPct] = useState([50, 50]);

  // dragging state
  const dragState = useRef({ type: null, startX: 0, startY: 0, startCol: 50, startRow: 50 });

  // vertical drag handlers
  const onStartVertical = (e) => {
    e.preventDefault();
    dragState.current = { type: "vertical", startX: e.clientX, startCol: colPct[0] };
    window.addEventListener("mousemove", onVerticalMove);
    window.addEventListener("mouseup", onStopDrag);
  };

  const onVerticalMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const pct = (relX / rect.width) * 100;
    // clamp 10% - 90%
    const clamped = Math.max(10, Math.min(90, pct));
    setColPct([clamped, 100 - clamped]);
  };

  // horizontal drag handlers
  const onStartHorizontal = (e) => {
    e.preventDefault();
    dragState.current = { type: "horizontal", startY: e.clientY, startRow: rowPct[0] };
    window.addEventListener("mousemove", onHorizontalMove);
    window.addEventListener("mouseup", onStopDrag);
  };

  const onHorizontalMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const pct = (relY / rect.height) * 100;
    const clamped = Math.max(10, Math.min(90, pct));
    setRowPct([clamped, 100 - clamped]);
  };

  const onStopDrag = () => {
    dragState.current = { type: null };
    window.removeEventListener("mousemove", onVerticalMove);
    window.removeEventListener("mousemove", onHorizontalMove);
    window.removeEventListener("mouseup", onStopDrag);
  };

  // layout styles
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `${colPct[0]}% ${colPct[1]}%`,
    gridTemplateRows: `${rowPct[0]}% ${rowPct[1]}%`,
    gap: "12px",
    height: "calc(100vh - 120px)", // leaves room for topbar + padding
  };

  const verticalBarStyle = {
    width: "10px",
    cursor: "col-resize",
    background: "transparent",
    alignSelf: "stretch",
    zIndex: 30,
  };

  const horizontalBarStyle = {
    height: "10px",
    cursor: "row-resize",
    background: "transparent",
    zIndex: 30,
  };

  return (
    <div ref={containerRef} className="w-full" style={gridStyle}>
      {/* top-left */}
      <div className="min-h-0 overflow-auto p-0">
        {children[0]}
      </div>

      {/* top-right */}
      <div className="min-h-0 overflow-auto p-0">
        {children[1]}
      </div>

      {/* vertical splitter column overlay at top/bottom */}
      <div
        style={{ gridColumn: "1 / 3", gridRow: "1 / 2", display: "flex", justifyContent: "center", pointerEvents: "none" }}
      >
        {/* top overlay - not needed visually */}
      </div>

      {/* bottom-left */}
      <div className="min-h-0 overflow-auto p-0">
        {children[2]}
      </div>

      {/* bottom-right */}
      <div className="min-h-0 overflow-auto p-0">
        {children[3]}
      </div>

      {/* vertical draggable bar placed between columns, spans rows */}
      <div
        onMouseDown={onStartVertical}
        style={{
          gridColumn: "1 / 3",
          gridRow: "1 / 3",
          justifySelf: "center",
          alignSelf: "stretch",
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          aria-hidden
          style={{
            width: "12px",
            height: "100%",
            marginLeft: `calc(${colPct[0]}% - 6px)`,
            transform: `translateX(-50%)`,
            cursor: "col-resize",
          }}
        >
          {/* thin visible handle */}
          <div className="hidden md:block h-full" style={{ width: "2px", background: "transparent" }} />
        </div>
      </div>

      {/* horizontal draggable bar placed between rows, spans columns */}
      <div
        onMouseDown={onStartHorizontal}
        style={{
          gridColumn: "1 / 3",
          gridRow: "1 / 3",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          pointerEvents: "auto",
        }}
      >
        <div
          aria-hidden
          style={{
            height: "12px",
            width: "100%",
            marginTop: `calc(${rowPct[0]}% - 6px)`,
            transform: `translateY(-50%)`,
            cursor: "row-resize",
          }}
        >
          {/* thin handle */}
          <div className="hidden md:block w-full" style={{ height: "2px", background: "transparent" }} />
        </div>
      </div>
    </div>
  );
}
