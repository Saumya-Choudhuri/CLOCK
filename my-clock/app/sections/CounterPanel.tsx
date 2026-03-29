"use client";

import { useEffect, useRef, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatMs(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function CounterPanel() {
  const [preCount, setPreCount] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTsRef = useRef<number | null>(null);

  const clearTick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const stop = () => {
    setRunning(false);
    clearTick();
    startTsRef.current = null;
  };

  const reset = () => {
    stop();
    setElapsedMs(0);
    setPreCount(null);
  };

  const startTimerNow = () => {
    setRunning(true);
    startTsRef.current = Date.now() - elapsedMs;

    clearTick();
    intervalRef.current = setInterval(() => {
      if (startTsRef.current == null) return;
      setElapsedMs(Date.now() - startTsRef.current);
    }, 250);
  };

  const startWithCountdown = () => {
    if (running || preCount !== null) return;
    setPreCount(3);
  };

  useEffect(() => {
    if (preCount == null) return;

    if (preCount === 0) {
      setPreCount(null);
      startTimerNow();
      return;
    }

    const t = setTimeout(
      () => setPreCount((x) => (x == null ? null : x - 1)),
      1000
    );
    return () => clearTimeout(t);
  }, [preCount]);

  useEffect(() => {
    return () => clearTick();
  }, []);

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-lg border bg-white p-6">
        <div className="text-sm text-slate-600">Counter</div>

        {preCount != null ? (
          <div className="mt-3 text-6xl font-bold">{preCount}</div>
        ) : (
          <div className="mt-3 text-6xl font-bold tabular-nums">
            {formatMs(elapsedMs)}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {!running ? (
            <button
              className="px-4 py-2 rounded bg-slate-900 text-white"
              onClick={startWithCountdown}
            >
              Start
            </button>
          ) : (
            <button
              className="px-4 py-2 rounded bg-red-600 text-white"
              onClick={stop}
            >
              Stop
            </button>
          )}

          <button className="px-4 py-2 rounded border bg-white" onClick={reset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}