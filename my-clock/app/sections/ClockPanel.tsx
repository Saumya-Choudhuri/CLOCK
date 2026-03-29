"use client";

import { useEffect, useState } from "react";
import ClockScreen from "../components/ClockScreen";

export default function ClockPanel() {
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);

  useEffect(() => {
    const saved = window.localStorage.getItem("clock_overlay_opacity");
    if (saved) setOverlayOpacity(Number(saved));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("clock_overlay_opacity", String(overlayOpacity));
  }, [overlayOpacity]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-700 w-32">Transparency</label>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(Number(e.target.value))}
            className="flex-1"
          />
          <div className="w-14 text-right text-sm font-mono tabular-nums">
            {Math.round(overlayOpacity * 100)}%
          </div>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border">
        <div className="h-[70vh]" style={{ opacity: overlayOpacity }}>
          <ClockScreen />
        </div>
      </div>
    </div>
  );
}