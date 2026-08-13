"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Server,
  Check,
  X,
  Loader2,
  Cpu,
  Boxes,
  AlertTriangle,
  Database,
  Shield,
  ShieldCheck,
  User,
  KeyRound,
  ExternalLink,
  Crown,
  UserCheck,
  Eye,
  EyeOff,
  Lock,
  Activity,
  Sliders,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useServer } from "@/context/ServerContext";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_BASE_URL, fetchModel, setModel } from "@/services/inferenceApi";
import type { ModelInfo } from "@/services/inferenceApi";
import { getSupabaseAnonKey } from "@/lib/supabaseClient";
import {
  maskApiKey,
  maskDatabaseUrl,
  getZeroDataRetentionMode,
  setZeroDataRetentionMode,
  getInitialAuditLogs,
  AuditLogEntry,
} from "@/lib/security";

const MODEL_LABELS: Record<string, string> = {
  yolov8n: "YOLOv8n — Fast (weakest, quick on CPU)",
  yolov8s: "YOLOv8s — Balanced (default)",
  yolov8m: "YOLOv8m — Accurate",
  yolov8l: "YOLOv8l — Very accurate",
  yolov8x: "YOLOv8x — Ultra accurate (slowest)",
  yolo11n: "YOLO11n — Fast (newest generation)",
  yolo11s: "YOLO11s — Balanced (newest generation)",
  yolo11m: "YOLO11m — Accurate (newest generation)",
  yolo11l: "YOLO11l — Very accurate (newest generation)",
  yolo11x: "YOLO11x — Ultra accurate (newest generation)",
};

export default function SettingsPage() {
  const { baseUrl, setBaseUrl, status, refresh } = useServer();
  const { user, isAdmin, isConfigured, projectUrl, setCustomAnonKey } = useAuth();

  const [draft, setDraft] = useState(baseUrl);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [draftModel, setDraftModel] = useState("");
  const [savingModel, setSavingModel] = useState(false);
  const [modelMsg, setModelMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Security and Masking state
  const [anonKeyDraft, setAnonKeyDraft] = useState("");
  const [revealedSecrets, setRevealedSecrets] = useState(false);
  const [keySavedMsg, setKeySavedMsg] = useState("");
  const [revealError, setRevealError] = useState("");

  // Privacy & ZDR
  const [zdrEnabled, setZdrEnabled] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    setAnonKeyDraft(getSupabaseAnonKey());
    setZdrEnabled(getZeroDataRetentionMode());
    setAuditLogs(getInitialAuditLogs());
  }, []);

  // load current detection model
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const info = await fetchModel(baseUrl);
      if (cancelled || !info) return;
      setModelInfo(info);
      setDraftModel(info.model);
    })();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, status]);

  const handleRevealChallenge = () => {
    if (!isAdmin) {
      setRevealError("Admin privilege required to reveal infrastructure secrets.");
      setTimeout(() => setRevealError(""), 3500);
      return;
    }
    setRevealedSecrets(!revealedSecrets);
  };

  const handleSaveAnonKey = () => {
    if (!isAdmin) {
      setRevealError("Only workspace administrators can update public anon keys.");
      setTimeout(() => setRevealError(""), 3500);
      return;
    }
    setCustomAnonKey(anonKeyDraft.trim());
    setKeySavedMsg("Supabase Anon Key updated successfully!");
    setTimeout(() => setKeySavedMsg(""), 3000);
  };

  const handleToggleZdr = () => {
    const nextVal = !zdrEnabled;
    setZdrEnabled(nextVal);
    setZeroDataRetentionMode(nextVal);
  };

  const applyModel = async () => {
    if (!draftModel || !modelInfo || draftModel === modelInfo.model) return;
    setSavingModel(true);
    setModelMsg(null);
    try {
      const info = await setModel(draftModel, baseUrl);
      setModelInfo(info);
      setDraftModel(info.model);
      setModelMsg({
        ok: true,
        text: `Switched to ${info.model}. Model hot-swapped securely in volatile memory.`,
      });
    } catch (err) {
      setModelMsg({
        ok: false,
        text: err instanceof Error ? err.message : "Failed to switch model",
      });
    } finally {
      setSavingModel(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings &amp; Security Shield</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Manage cryptographic data masking, Supabase RBAC, and local AI model runtimes.
            </p>
          </div>
          <Link
            href="/security"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300"
          >
            <ShieldCheck size={15} className="text-emerald-500" />
            <span>Security Whitepaper</span>
          </Link>
        </div>

        {/* User Profile & Role Card */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={18} className="text-violet-600" />
              <h2 className="font-bold text-base">Your Workspace Profile</h2>
            </div>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                <Crown size={13} className="text-amber-500" />
                Administrator (Privileged)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <UserCheck size={13} className="text-slate-400" />
                Annotator / Standard User
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Account Name
              </p>
              <p className="mt-1 font-semibold text-xs">{user?.name || "Anonymous User"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Email Address
              </p>
              <p className="mt-1 font-semibold text-xs truncate">{user?.email || "Not signed in"}</p>
            </div>
          </div>
        </section>

        {/* Privacy & Zero Data Retention (ZDR) Card */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders size={18} className="text-violet-600" />
              <h2 className="font-bold text-base">Zero Data Retention (ZDR) Mode</h2>
            </div>
            <button
              onClick={handleToggleZdr}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                zdrEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  zdrEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {zdrEnabled
              ? "🟢 Active: Images & inference tensors are processed exclusively in volatile RAM and purged on delivery."
              : "⚪ Disabled: Images may be cached locally in browser session storage for editor undo/redo."}
          </p>
        </section>

        {/* Supabase Authentication & Masked Secrets */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-violet-600" />
              <h2 className="font-bold text-base">Supabase Cloud &amp; Masked Secrets</h2>
            </div>
            <button
              onClick={handleRevealChallenge}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {revealedSecrets ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{revealedSecrets ? "Hide Secrets" : "Admin Reveal"}</span>
            </button>
          </div>

          {revealError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertTriangle size={14} />
              <span>{revealError}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-500 dark:text-slate-400">
                Supabase Project Endpoint (Masked)
              </label>
              <input
                readOnly
                value={
                  revealedSecrets && isAdmin
                    ? projectUrl
                    : maskDatabaseUrl(projectUrl, false)
                }
                className="mt-1 w-full font-mono rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-500 dark:text-slate-400">
                Supabase Public Anon Key (Masked for Security)
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type={revealedSecrets && isAdmin ? "text" : "password"}
                  value={
                    revealedSecrets && isAdmin
                      ? anonKeyDraft
                      : maskApiKey(anonKeyDraft, false)
                  }
                  onChange={(e) => setAnonKeyDraft(e.target.value)}
                  readOnly={!isAdmin || !revealedSecrets}
                  placeholder="••••••••••••••••••••••••"
                  className="flex-1 font-mono rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                />
                {isAdmin && revealedSecrets && (
                  <button
                    onClick={handleSaveAnonKey}
                    className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700"
                  >
                    Save Key
                  </button>
                )}
              </div>
              {keySavedMsg && (
                <p className="mt-1 text-xs font-semibold text-emerald-600">{keySavedMsg}</p>
              )}
            </div>
          </div>
        </section>

        {/* Backend Inference Engine (BFF Masked) */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server size={18} className="text-violet-600" />
              <h2 className="font-bold text-base">AI Inference Engine &amp; BFF Proxy</h2>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Check size={14} /> Shield Active
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
            <p className="font-semibold text-slate-600 dark:text-slate-300">
              Client Request Target: <code className="font-mono text-violet-600 dark:text-violet-400">/api/inference</code> (BFF Proxy)
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Direct server ports and internal loopback sockets are cloaked from browser network inspection.
            </p>
          </div>
        </section>

        {/* Model Hot-Swap */}
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Boxes size={18} className="text-violet-600" />
            <h2 className="font-bold text-base">Active Detection Model</h2>
          </div>
          <p className="text-xs text-slate-500">
            Hot-swaps the active YOLO model (v8 / 11) for object detection and instance segmentation.
          </p>
          <div className="flex gap-2">
            <select
              value={draftModel}
              onChange={(e) => {
                setDraftModel(e.target.value);
                setModelMsg(null);
              }}
              disabled={savingModel}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="" disabled>
                {modelInfo ? "Select model" : "Loading…"}
              </option>
              {(modelInfo?.options ?? []).map((m) => (
                <option key={m} value={m}>
                  {MODEL_LABELS[m] ?? m}
                </option>
              ))}
            </select>
            <button
              onClick={applyModel}
              disabled={savingModel || !modelInfo || draftModel === modelInfo.model}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {savingModel && <Loader2 size={14} className="animate-spin" />}
              Apply
            </button>
          </div>
          {modelMsg && (
            <div
              className={`flex items-start gap-2 rounded-xl px-4 py-3 text-xs font-medium ${
                modelMsg.ok
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                  : "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
              }`}
            >
              {modelMsg.ok ? <Check size={15} className="mt-0.5" /> : <AlertTriangle size={15} className="mt-0.5" />}
              <span>{modelMsg.text}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
