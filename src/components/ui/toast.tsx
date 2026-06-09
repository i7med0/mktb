"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-full fade-in transition-all
              ${t.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : ""}
              ${t.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" : ""}
              ${t.type === "warning" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : ""}
            `}
          >
            {t.type === "success" && <CheckCircle2 className="w-5 h-5" />}
            {t.type === "error" && <XCircle className="w-5 h-5" />}
            {t.type === "warning" && <AlertCircle className="w-5 h-5" />}
            <span className="font-medium text-sm">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="ml-2 text-zinc-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
