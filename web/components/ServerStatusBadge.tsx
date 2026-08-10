"use client";

import { useServer } from "@/context/ServerContext";

export function ServerStatusBadge() {
  const { status } = useServer();
  const map = {
    online: { dot: "bg-emerald-500", text: "Server online", cls: "text-emerald-600 dark:text-emerald-400" },
    offline: { dot: "bg-rose-500", text: "Server offline", cls: "text-rose-600 dark:text-rose-400" },
    unknown: { dot: "bg-slate-400", text: "Checking…", cls: "text-slate-500" },
  }[status];

  return (
    <span
      className={`hidden items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium sm:flex dark:border-slate-700 ${map.cls}`}
      title="Inference backend health"
    >
      <span className={`h-2 w-2 rounded-full ${map.dot}`} />
      {map.text}
    </span>
  );
}
