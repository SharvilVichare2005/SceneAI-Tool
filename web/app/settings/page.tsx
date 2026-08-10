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
  User,
  KeyRound,
  ExternalLink,
  Crown,
  UserCheck,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useServer } from "@/context/ServerContext";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_BASE_URL, fetchModel, setModel } from "@/services/inferenceApi";
import type { ModelInfo } from "@/services/inferenceApi";
import { getSupabaseAnonKey } from "@/lib/supabaseClient";

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

const MODEL_HINTS: Record<string, string> = {
  yolov8n: "Best for quick previews; may miss small or distant objects.",
  yolov8s: "Good default for most images. Decent speed/accuracy trade-off.",
  yolov8m: "Catches more small objects than s; ~2x slower.",
  yolov8l: "High recall on busy scenes (crowds, sports).",
  yolov8x: "Highest accuracy in the v8 family; a few seconds per image on CPU.",
  yolo11n: "Newer architecture, better accuracy than v8 at the same speed.",
  yolo11s: "Newer architecture, better accuracy than v8 at the same speed.",
  yolo11m: "Newer architecture, better accuracy than v8 at the same speed.",
  yolo11l: "Newer architecture, better accuracy than v8 at the same speed.",
  yolo11x: "Newest + largest: top accuracy on any image; slowest on CPU.",
};

export default function SettingsPage() {
  const { baseUrl, setBaseUrl, status, refresh } = useServer();
  const { user, isAdmin, isConfigured, projectUrl, setCustomAnonKey } = useAuth();

  const [draft, setDraft] = useState(baseUrl);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [draftModel, setDraftModel] = useState("");
  const [savingModel, setSavingModel] = useState(false);
  const [modelMsg, setModelMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  // Supabase anon key settings
  const [anonKeyDraft, setAnonKeyDraft] = useState("");
  const [keySavedMsg, setKeySavedMsg] = useState("");

  useEffect(() => {
    setAnonKeyDraft(getSupabaseAnonKey());
  }, []);

  // load current detection model whenever the backend comes online / URL changes
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

  const saveBackendUrl = () => {
    setBaseUrl(draft);
    setTimeout(refresh, 200);
  };

  const handleSaveAnonKey = () => {
    setCustomAnonKey(anonKeyDraft.trim());
    setKeySavedMsg("Supabase Anon Key updated successfully!");
    setTimeout(() => setKeySavedMsg(""), 3000);
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
        text: `Switched to ${info.model}. Weights for ${info.model} / ${info.seg_model} download automatically on the next detect/segment.`,
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings &amp; Configuration</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your Supabase cloud backend, user role, and local AI inference models.
          </p>
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
                Administrator
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <UserCheck size={13} className="text-slate-400" />
                Annotator / User
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Account Name
              </p>
              <p className="mt-1 font-semibold text-sm">{user?.name || "Anonymous User"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </p>
              <p className="mt-1 font-semibold text-sm truncate">{user?.email || "Not signed in"}</p>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-2 flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-amber-600" />
                <span>You have full administrative privileges to manage users and roles.</span>
              </div>
              <Link
                href="/admin"
                className="font-bold underline hover:text-amber-700"
              >
                Open Admin Console &rarr;
              </Link>
            </div>
          )}
        </section>

        {/* Supabase Authentication & Database Configuration */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-violet-600" />
              <h2 className="font-bold text-base">Supabase Authentication &amp; RBAC</h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {isConfigured ? "Connected" : "Configured"}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-500 dark:text-slate-400">
                Supabase Project URL
              </label>
              <input
                readOnly
                value={projectUrl}
                className="mt-1 w-full font-mono rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-500 dark:text-slate-400">
                  Supabase Anon Public Key (browser client)
                </label>
                <a
                  href="https://supabase.com/dashboard/project/tfhyeamkietfqmbylyqt/settings/api"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:underline dark:text-violet-400"
                >
                  <span>Get from Supabase Dashboard</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <div className="mt-1 flex gap-2">
                <input
                  type="password"
                  value={anonKeyDraft}
                  onChange={(e) => setAnonKeyDraft(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                  className="flex-1 font-mono rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  onClick={handleSaveAnonKey}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
                >
                  Save Key
                </button>
              </div>
              {keySavedMsg && (
                <p className="mt-1 text-xs font-medium text-emerald-600">{keySavedMsg}</p>
              )}
            </div>
          </div>
        </section>

        {/* Backend Inference Server */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Server size={18} className="text-violet-600" />
            <h2 className="font-bold text-base">Inference server</h2>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Status:</span>
            {status === "online" && (
              <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <Check size={15} /> Online
              </span>
            )}
            {status === "offline" && (
              <span className="flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                <X size={15} /> Offline
              </span>
            )}
            {status === "unknown" && (
              <span className="flex items-center gap-1 font-medium text-slate-500">
                <Loader2 size={15} className="animate-spin" /> Checking…
              </span>
            )}
            <button
              onClick={refresh}
              className="ml-auto text-xs font-medium text-violet-600 hover:underline"
            >
              Recheck
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">
              Backend base URL
            </label>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={DEFAULT_BASE_URL}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                onClick={saveBackendUrl}
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Save
              </button>
            </div>
          </div>
        </section>

        {/* Detection model hot-swap */}
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Boxes size={18} className="text-violet-600" />
            <h2 className="font-bold text-base">Detection model</h2>
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
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
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
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {savingModel && <Loader2 size={15} className="animate-spin" />}
              Apply
            </button>
          </div>
          {modelMsg && (
            <div
              className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
                modelMsg.ok
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                  : "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
              }`}
            >
              {modelMsg.ok ? (
                <Check size={16} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              )}
              <span>{modelMsg.text}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
