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
    const t = setInterval(() => setNow(new Date()), 1000);
    setNow(new Date()); // set initial time only on client
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

  const timeColor = theme === "light" ? "var(--clock-ink)" : "var(--clock-ink-inverse)";
  const dateColor = theme === "light" ? "var(--clock-subtle)" : "var(--clock-subtle-inverse)";

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <div
          className="text-7xl md:text-8xl clock-font font-semibold tabular-nums time-glow"
          style={{
            color: timeColor,
          }}
        >
          {time}
        </div>
        <div
          className="mt-4 text-xs uppercase tracking-[0.25em]"
          style={{
            color: dateColor,
          }}
        >
          {date}
        </div>
      </div>
    </div>
  );
}