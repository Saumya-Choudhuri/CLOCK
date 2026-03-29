"use client";

import { useEffect, useMemo, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function ClockScreen() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date()); // set initial time only on client
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = useMemo(() => {
    if (!now) return "--:--:--";
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }, [now]);

  const date = useMemo(() => {
    if (!now) return "Loading date...";
    return now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [now]);

  return (
    <div className="h-full w-full flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="text-7xl font-bold tabular-nums">{time}</div>
        <div className="mt-3 text-slate-600">{date}</div>
      </div>
    </div>
  );
}