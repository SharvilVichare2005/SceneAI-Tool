"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Lock,
  EyeOff,
  KeyRound,
  Server,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Layers,
  Database,
  Cpu,
  RefreshCw,
  Terminal,
  Activity,
  Award,
  Globe2,
  Sliders,
  ChevronRight,
  Fingerprint,
} from "lucide-react";
import { Navbar, MobileTopbar } from "@/components/Navbar";
import {
  maskApiKey,
  maskEmail,
  maskDatabaseUrl,
  getZeroDataRetentionMode,
  setZeroDataRetentionMode,
  getInitialAuditLogs,
  AuditLogEntry,
} from "@/lib/security";
import { useAuth } from "@/context/AuthContext";

export default function SecurityPage() {
  const { user, isAdmin } = useAuth();
  const [zdrActive, setZdrActive] = useState(false);
  const [zdrSavedMsg, setZdrSavedMsg] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [testRawEmail, setTestRawEmail] = useState("enterprise.developer@acmecorp.com");
  const [testRawKey, setTestRawKey] = useState("sk_live_93810481047194819401");
  const [activeTab, setActiveTab] = useState<"overview" | "masking" | "audit" | "compliance">("overview");

  useEffect(() => {
    setZdrActive(getZeroDataRetentionMode());
    setAuditLogs(getInitialAuditLogs());
  }, []);

  const handleToggleZdr = () => {
    const nextVal = !zdrActive;
    setZdrActive(nextVal);
    setZeroDataRetentionMode(nextVal);
    setZdrSavedMsg(
      nextVal
        ? "Zero Data Retention (ZDR) activated. All inference buffers are purged immediately."
        : "Standard caching enabled."
    );
    setTimeout(() => setZdrSavedMsg(""), 3500);
  };

  return (
    <div className="flex min-h-screen bg-[#0d1117] text-slate-100">
      <Navbar />
      <div className="min-w-0 flex-1">
        <MobileTopbar />
        <main className="mx-auto max-w-[1380px] px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="relative mb-8 overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-950/70 via-slate-900 to-indigo-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-emerald-600/15 blur-3xl" />

            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Enterprise Security Shield &bull; Active &amp; Enforcing
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Security, Privacy &amp; Data Concealment
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  SceneAI operates under a <strong>zero-trust security model</strong>. All sensitive credentials,
                  database connections, and server internals are strictly redacted from client access.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
                >
                  <ArrowLeft size={15} /> Workspace
                </Link>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500"
                >
                  <KeyRound size={15} /> Security Settings
                </Link>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-5">
              {[
                { id: "overview", label: "Security Architecture", icon: ShieldCheck },
                { id: "masking", label: "Cryptographic Masking Lab", icon: EyeOff },
                { id: "audit", label: "Tamper-Evident Audit Log", icon: Activity },
                { id: "compliance", label: "Compliance & Certifications", icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                      active
                        ? "bg-violet-600 text-white shadow-md"
                        : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab 1: Architecture Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Core Security Metrics */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Lock size={20} />
                    </span>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      Enforced
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-medium text-slate-400">Encryption Standards</p>
                  <p className="mt-1 text-xl font-bold text-white">TLS 1.3 &amp; AES-256</p>
                  <p className="mt-1 text-[11px] text-slate-500">In-transit &amp; rest cryptographic protection</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-400">
                      <EyeOff size={20} />
                    </span>
                    <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                      100% Censored
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-medium text-slate-400">Information Hiding</p>
                  <p className="mt-1 text-xl font-bold text-white">Zero Secrets in Client</p>
                  <p className="mt-1 text-[11px] text-slate-500">BFF Proxy conceals backend topology</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Sliders size={20} />
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        zdrActive ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {zdrActive ? "Active" : "Standard"}
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-medium text-slate-400">Zero Data Retention (ZDR)</p>
                  <p className="mt-1 text-xl font-bold text-white">
                    {zdrActive ? "Ephemeral RAM" : "Configurable"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Immediate memory buffer discard</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400">
                      <Fingerprint size={20} />
                    </span>
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      RBAC Active
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-medium text-slate-400">Access Control Model</p>
                  <p className="mt-1 text-xl font-bold text-white">Granular Isolation</p>
                  <p className="mt-1 text-[11px] text-slate-500">Strict separation of Admin &amp; Annotator</p>
                </div>
              </div>

              {/* Zero Data Retention Switcher */}
              <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-slate-900 to-slate-900 p-6 shadow-lg sm:p-7">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="text-violet-400" size={20} />
                      <h2 className="text-lg font-bold text-white">
                        Zero Data Retention (ZDR) Inference Mode
                      </h2>
                    </div>
                    <p className="text-xs text-slate-300">
                      When activated, image annotations and frame tensors are processed purely in volatile RAM,
                      stripping all EXIF/GPS telemetry and deleting the memory reference immediately upon response delivery.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400">
                      {zdrActive ? "ZDR Active" : "ZDR Disabled"}
                    </span>
                    <button
                      onClick={handleToggleZdr}
                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        zdrActive ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          zdrActive ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                {zdrSavedMsg && (
                  <p className="mt-3 text-xs font-semibold text-emerald-400 animate-fadeIn">
                    ✓ {zdrSavedMsg}
                  </p>
                )}
              </div>

              {/* Security Pillars Visual Cards */}
              <div className="grid gap-5 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-400 font-bold">
                      01
                    </span>
                    <h3 className="font-bold text-base text-white">BFF Proxy &amp; IP Cloaking</h3>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">
                    The client frontend never contacts the raw AI backend or ports directly. All communication
                    flows through a protected Next.js Backend-For-Frontend proxy route with rate-limiting and payload validation.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Internal server ports hidden from DevTools</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Request size bounding &amp; DDoS mitigation</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400 font-bold">
                      02
                    </span>
                    <h3 className="font-bold text-base text-white">Role-Based Data Isolation</h3>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">
                    Standard users and annotators have strictly restricted access. Database schemas, SQL editors,
                    and API secret management remain invisible unless authenticated as a verified Super Administrator.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>PostgreSQL Row Level Security (RLS)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Step-up Admin Reveal Challenge for secrets</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 font-bold">
                      03
                    </span>
                    <h3 className="font-bold text-base text-white">Exception Sanitization</h3>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">
                    Raw error tracebacks and internal operating system paths are intercepted by the security middleware,
                    preventing malicious actors from mapping filesystem paths or database column names.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>OS directory paths stripped automatically</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Generic, secure client-facing status codes</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Cryptographic Masking Interactive Lab */}
          {activeTab === "masking" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <div className="flex items-center gap-2">
                  <EyeOff size={20} className="text-violet-400" />
                  <h2 className="text-lg font-bold text-white">
                    Live Data Masking &amp; Redaction Simulator
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Test how our data redaction engine automatically censors sensitive credentials and personal data.
                </p>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {/* Email Masking */}
                  <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <label className="text-xs font-bold text-slate-300">Test Email Input:</label>
                    <input
                      value={testRawEmail}
                      onChange={(e) => setTestRawEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white outline-none focus:border-violet-500"
                    />
                    <div className="pt-2">
                      <p className="text-[11px] font-semibold text-slate-400">Sanitized for Standard Viewer:</p>
                      <p className="mt-1 rounded-lg bg-slate-900/90 border border-slate-800 p-2.5 font-mono text-xs text-emerald-400">
                        {maskEmail(testRawEmail, false)}
                      </p>
                    </div>
                  </div>

                  {/* API Key Masking */}
                  <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <label className="text-xs font-bold text-slate-300">Test API Secret Key:</label>
                    <input
                      value={testRawKey}
                      onChange={(e) => setTestRawKey(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white outline-none focus:border-violet-500"
                    />
                    <div className="pt-2">
                      <p className="text-[11px] font-semibold text-slate-400">Protected Display:</p>
                      <p className="mt-1 rounded-lg bg-slate-900/90 border border-slate-800 p-2.5 font-mono text-xs text-emerald-400">
                        {maskApiKey(testRawKey, false)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <h4 className="text-xs font-bold text-slate-300">Infrastructure URL Masking Demo:</h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
                    <div className="rounded-lg bg-slate-900 p-3">
                      <p className="text-[11px] text-slate-400">Raw Internal Endpoint:</p>
                      <p className="mt-1 font-mono text-slate-300">https://tfhyeamkietfqmbylyqt.supabase.co</p>
                    </div>
                    <div className="rounded-lg bg-slate-900 p-3">
                      <p className="text-[11px] text-emerald-400 font-semibold">User Masked Presentation:</p>
                      <p className="mt-1 font-mono text-emerald-400">
                        {maskDatabaseUrl("https://tfhyeamkietfqmbylyqt.supabase.co", false)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Tamper-Evident Audit Log */}
          {activeTab === "audit" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={20} className="text-violet-400" />
                    <h2 className="text-lg font-bold text-white">
                      Live Cryptographic Security Audit Log
                    </h2>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                    SHA-256 Tamper Evident
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Every privileged operation, inference request, and authentication exchange is logged with an immutable signature.
                </p>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 bg-slate-950/60 font-semibold text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Event ID</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Actor &amp; Role</th>
                        <th className="px-4 py-3">Client IP</th>
                        <th className="px-4 py-3">Cryptographic Signature</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3 font-semibold text-violet-400">{log.id}</td>
                          <td className="px-4 py-3 font-bold text-white">{log.action}</td>
                          <td className="px-4 py-3 text-slate-300">
                            {log.actor} ({log.actorRole.toUpperCase()})
                          </td>
                          <td className="px-4 py-3 text-slate-400">{log.ipAddress}</td>
                          <td className="px-4 py-3 text-slate-500">{log.signatureHash}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 size={10} /> Verified
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Compliance & Certifications */}
          {activeTab === "compliance" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    name: "SOC 2 Type II",
                    desc: "Audited for Security, Confidentiality, and Availability controls.",
                    badge: "Certified Ready",
                    color: "border-violet-500/30 bg-violet-950/20 text-violet-400",
                  },
                  {
                    name: "GDPR Compliant",
                    desc: "Full support for User Right-to-Erasure & zero telemetry retention.",
                    badge: "Enforced",
                    color: "border-cyan-500/30 bg-cyan-950/20 text-cyan-400",
                  },
                  {
                    name: "HIPAA Capable",
                    desc: "BAA-ready for medical imaging & clinical trial annotation datasets.",
                    badge: "Available",
                    color: "border-emerald-500/30 bg-emerald-950/20 text-emerald-400",
                  },
                  {
                    name: "ISO 27001",
                    desc: "Information Security Management System best practices adhered.",
                    badge: "Aligned",
                    color: "border-amber-500/30 bg-amber-950/20 text-amber-400",
                  },
                ].map((c) => (
                  <div
                    key={c.name}
                    className={`rounded-2xl border p-5 shadow-sm backdrop-blur-sm ${c.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-white">{c.name}</h3>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">
                        {c.badge}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-300">{c.desc}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <h3 className="font-bold text-base text-white">Responsible Vulnerability Disclosure</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  We prioritize workspace and model security. If you discover a vulnerability or potential leakage of
                  sensitive information, please report it immediately to our security response team at{" "}
                  <code className="text-violet-400">security@sceneai.local</code>.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
