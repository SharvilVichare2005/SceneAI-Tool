"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DEFAULT_BASE_URL, checkHealth } from "@/services/inferenceApi";

type ServerStatus = "unknown" | "online" | "offline";

interface ServerContextValue {
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  status: ServerStatus;
  refresh: () => void;
}

const ServerContext = createContext<ServerContextValue>({
  baseUrl: DEFAULT_BASE_URL,
  setBaseUrl: () => {},
  status: "unknown",
  refresh: () => {},
});

export function ServerProvider({ children }: { children: React.ReactNode }) {
  const [baseUrl, setBaseUrlState] = useState<string>(DEFAULT_BASE_URL);
  const [status, setStatus] = useState<ServerStatus>("unknown");

  useEffect(() => {
    const stored = localStorage.getItem("app:baseUrl");
    if (stored) setBaseUrlState(stored);
  }, []);

  const refresh = useCallback(async () => {
    const ok = await checkHealth(baseUrl);
    setStatus(ok ? "online" : "offline");
  }, [baseUrl]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [refresh]);

  const setBaseUrl = (url: string) => {
    const clean = url.trim().replace(/\/$/, "");
    setBaseUrlState(clean || DEFAULT_BASE_URL);
    localStorage.setItem("app:baseUrl", clean || DEFAULT_BASE_URL);
  };

  return (
    <ServerContext.Provider value={{ baseUrl, setBaseUrl, status, refresh }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  return useContext(ServerContext);
}
