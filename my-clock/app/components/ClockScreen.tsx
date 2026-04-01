"use client";

import { useEffect, useMemo, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

interface ClockScreenProps {
  theme?: "light" | "dark";
}

export default function ClockScreen({ theme = "light" }: ClockScreenProps) {
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
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <div
          className="text-7xl font-bold tabular-nums"
          style={{
            color: theme === "light" ? "#ffffff" : "#0f172a",
          }}
        >
          {time}
        </div>
        <div
          className="mt-3"
          style={{
            color: theme === "light" ? "#cbd5e1" : "#475569",
          }}
        >
          {date}
        </div>
      </div>
    </div>
  );
}