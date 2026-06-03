"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function LiveTimer({ startTimeStr }: { startTimeStr: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const start = new Date(startTimeStr).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, now - start); // Prevent negative times
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setElapsed(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTimeStr]);

  return (
    <div className="flex items-center space-x-2 space-x-reverse text-3xl font-mono text-emerald-400 font-bold bg-emerald-950/30 px-4 py-2 rounded-xl border border-emerald-900/50 shadow-inner">
      <Clock className="w-8 h-8 ml-3 opacity-80" />
      <span className="tracking-widest">{elapsed}</span>
    </div>
  );
}
