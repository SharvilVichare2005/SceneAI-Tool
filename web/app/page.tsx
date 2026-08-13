"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  ChevronDown,
  Clock3,
  CloudUpload,
  FolderKanban,
  Image as ImageIcon,
  Layers3,
  MoreHorizontal,
  Play,
  Plus,
  ScanLine,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  WandSparkles,
  Shield,
  ShieldCheck,
  Lock,
  EyeOff,
  CheckCircle2,
  Zap,
  Cpu,
  Award,
  Layers,
  ArrowRight,
  Boxes,
  Camera,
  Video,
  Calculator,
} from "lucide-react";
import { Navbar, MobileTopbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

const projects = [
  { name: "Warehouse safety", type: "Object detection", items: "12,840 images", progress: 82, color: "bg-violet-500", icon: "WS" },
  { name: "Retail shelf audit", type: "Instance segmentation", items: "8,420 images", progress: 64, color: "bg-cyan-500", icon: "RS" },
  { name: "Roadside inventory", type: "Object detection", items: "4,180 images", progress: 38, color: "bg-amber-500", icon: "RI" },
];

const activity = [
  { title: "Training run completed", detail: "YOLO11 • Warehouse safety", time: "12 min ago", tone: "bg-emerald-500", icon: TrendingUp },
  { title: "1,240 images imported", detail: "Retail shelf audit", time: "48 min ago", tone: "bg-cyan-500", icon: CloudUpload },
  { title: "Alex joined your team", detail: "Annotator access granted", time: "2 hr ago", tone: "bg-violet-500", icon: Users },
];

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const [viewMode, setViewMode] = useState<"workspace" | "product">("product");

  // ROI Calculator state
  const [calcImages, setCalcImages] = useState(5000);
  const [calcCostPerHour, setCalcCostPerHour] = useState(25);

  const manualHours = Math.round((calcImages * 1.5) / 60);
  const aiHours = Math.round((calcImages * 0.15) / 60);
  const manualCost = manualHours * calcCostPerHour;
  const aiCost = aiHours * calcCostPerHour;
  const savings = Math.max(0, manualCost - aiCost);

  return (
    <div className="flex min-h-screen bg-[#f7f8fc] text-slate-950 dark:bg-slate-950 dark:text-white">
      <Navbar />
      <div className="min-w-0 flex-1">
        <MobileTopbar />
        <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-7 sm:px-6 lg:px-8">
          {/* Top Mode Bar */}
          <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent p-4 dark:border-violet-900/50 dark:bg-slate-900 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white shadow-sm">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  SceneAI Platform
                </p>
                <p className="text-sm font-semibold">
                  {viewMode === "product"
                    ? "Product Showcase & Capabilities"
                    : `Workspace • ${isAdmin ? "Administrator Mode" : "Annotator Mode"}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-slate-200 bg-white p-1 text-xs font-bold dark:border-slate-800 dark:bg-slate-800">
                <button
                  onClick={() => setViewMode("product")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    viewMode === "product"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  Product Overview
                </button>
                <button
                  onClick={() => setViewMode("workspace")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    viewMode === "workspace"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  Workspace Dashboard
                </button>
              </div>

              <Link
                href="/security"
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
              >
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Security Hub</span>
              </Link>
            </div>
          </div>

          {/* VIEW 1: PRODUCT SHOWCASE */}
          {viewMode === "product" ? (
            <div className="space-y-12 animate-fadeIn">
              {/* Product Hero Section */}
              <section className="relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-14 text-white shadow-2xl dark:border-slate-800 sm:px-12 sm:py-20">
                <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-cyan-600/20 blur-3xl" />

                <div className="relative z-10 mx-auto max-w-3xl text-center">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/15 px-4 py-1 text-xs font-bold text-violet-300 backdrop-blur-md">
                    <Sparkles size={14} className="text-violet-400" />
                    <span>Next-Gen Computer Vision &amp; Auto-Labeling</span>
                  </div>

                  <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl sm:leading-tight">
                    Annotate, Train &amp; Deploy AI Vision Models with{" "}
                    <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
                      Military-Grade Security
                    </span>
                  </h1>

                  <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
                    Accelerate your dataset creation by <strong>10x</strong> with integrated YOLO11
                    auto-detection, polygon segmentation, and zero-data-retention cryptographic masking.
                  </p>

                  <div className="mt-8 flex flex-wrap justify-center gap-4">
                    <Link
                      href="/analysis"
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/40 transition hover:bg-violet-500"
                    >
                      <ScanLine size={18} /> Launch AI Analyzer
                    </Link>
                    <button
                      onClick={() => setViewMode("workspace")}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
                    >
                      Open Workspace Dashboard <ArrowRight size={16} />
                    </button>
                  </div>

                  {/* Trust badges */}
                  <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-400" /> SOC 2 Type II Certified
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-400" /> Zero Data Retention
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-400" /> Real-time YOLO11
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-400" /> Supabase RBAC
                    </span>
                  </div>
                </div>
              </section>

              {/* Feature Highlights Grid */}
              <section className="grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                    <Zap size={24} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">1-Click Auto-Annotation</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Pre-label thousands of images instantaneously with state-of-the-art YOLO11 and YOLOv8
                    bounding boxes and instance segmentation masks.
                  </p>
                  <Link
                    href="/analysis"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline"
                  >
                    Try interactive demo &rarr;
                  </Link>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">Zero-Knowledge Privacy</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Cryptographic data masking conceals all API keys, backend topology, and sensitive PII.
                    Inference buffers are discarded on delivery in Zero-Retention mode.
                  </p>
                  <Link
                    href="/security"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Explore security whitepaper &rarr;
                  </Link>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300">
                    <Layers size={24} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">Multi-Format Dataset Hub</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Export datasets seamlessly to COCO 1.0, YOLO PyTorch, and Pascal VOC. Train custom
                    weights directly with our automated experiment tracking pipeline.
                  </p>
                  <Link
                    href="/datasets"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:underline"
                  >
                    Manage datasets &rarr;
                  </Link>
                </div>
              </section>

              {/* Interactive ROI & Throughput Calculator */}
              <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                    <Calculator size={20} />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold">AI Labeling ROI &amp; Time Savings Calculator</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Estimate how much time and budget your team saves with SceneAI auto-assisted annotation.
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-2">
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs font-bold">
                        <span>Dataset Size:</span>
                        <span className="text-violet-600 font-mono">{calcImages.toLocaleString()} Images</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="50000"
                        step="500"
                        value={calcImages}
                        onChange={(e) => setCalcImages(Number(e.target.value))}
                        className="mt-2 w-full accent-violet-600"
                      />
                      <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                        <span>500</span>
                        <span>25,000</span>
                        <span>50,000</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold">
                        <span>Annotator Hourly Cost:</span>
                        <span className="text-violet-600 font-mono">${calcCostPerHour} / hour</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={calcCostPerHour}
                        onChange={(e) => setCalcCostPerHour(Number(e.target.value))}
                        className="mt-2 w-full accent-violet-600"
                      />
                      <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                        <span>$10</span>
                        <span>$50</span>
                        <span>$100</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/60">
                    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">
                      <p className="text-[11px] font-semibold text-slate-400">Time Saved</p>
                      <p className="mt-1 text-2xl font-extrabold text-violet-600">
                        {Math.max(0, manualHours - aiHours)} hrs
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">~90% reduction in manual effort</p>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">
                      <p className="text-[11px] font-semibold text-slate-400">Estimated Cost Savings</p>
                      <p className="mt-1 text-2xl font-extrabold text-emerald-600">
                        ${savings.toLocaleString()}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">Net operating budget efficiency</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Plan & Pricing Tier Grid */}
              <section className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">Enterprise-Grade Plans &amp; Capabilities</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Choose the plan that fits your computer vision workflow.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-bold text-lg">Developer</h3>
                    <p className="mt-1 text-xs text-slate-500">For individual researchers</p>
                    <p className="mt-4 text-3xl font-extrabold">$0 <span className="text-xs font-normal text-slate-400">/ month</span></p>
                    <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> YOLOv8 &amp; YOLO11 Inference</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> 5 Datasets per workspace</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> Standard COCO Export</li>
                    </ul>
                    <button onClick={() => setViewMode("workspace")} className="mt-7 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                      Get Started Free
                    </button>
                  </div>

                  <div className="relative rounded-3xl border-2 border-violet-600 bg-white p-7 shadow-xl dark:bg-slate-900">
                    <span className="absolute -top-3 right-6 rounded-full bg-violet-600 px-3 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      Most Popular
                    </span>
                    <h3 className="font-bold text-lg">Team Pro</h3>
                    <p className="mt-1 text-xs text-slate-500">For active engineering squads</p>
                    <p className="mt-4 text-3xl font-extrabold">$49 <span className="text-xs font-normal text-slate-400">/ seat / mo</span></p>
                    <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> Unlimited Datasets &amp; Annotations</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> Real-time Video Stream Inference</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> Supabase RBAC &amp; Team Roles</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> Hot-swap Model Hub</li>
                    </ul>
                    <button onClick={() => setViewMode("workspace")} className="mt-7 w-full rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-500">
                      Launch Pro Workspace
                    </button>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-bold text-lg">Enterprise Shield</h3>
                    <p className="mt-1 text-xs text-slate-500">Maximum security &amp; compliance</p>
                    <p className="mt-4 text-3xl font-extrabold">Custom <span className="text-xs font-normal text-slate-400">/ SLA</span></p>
                    <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> Zero Data Retention (ZDR) Enforced</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> On-Premise Air-Gapped Deployment</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> SOC2 / HIPAA Compliance BAA</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" /> 24/7 Dedicated Support Engineering</li>
                    </ul>
                    <Link href="/security" className="mt-7 block text-center rounded-xl border border-slate-200 py-2.5 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                      Contact Security Team
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            /* VIEW 2: WORKSPACE DASHBOARD */
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="mb-1 text-xs font-bold text-violet-600 dark:text-violet-400">
                    Workspace • {isAdmin ? "Administrator Mode" : "Annotator Mode"}
                  </p>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Good morning, {user?.name?.split(" ")[0] || "Sharvil"}{" "}
                    <span aria-hidden className="text-violet-500">✦</span>
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Here&apos;s what&apos;s happening across your protected computer vision workspace.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/analysis"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold shadow-sm transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <ScanLine size={15} /> Open Analyzer
                  </Link>
                  <Link
                    href="/datasets"
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
                  >
                    <Plus size={16} /> New Project
                  </Link>
                </div>
              </div>

              {/* Metrics */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Images labeled" value="25,440" change="+18.4%" note="vs. last month" icon={ImageIcon} tone="violet" />
                <Metric label="Active projects" value="08" change="+2" note="this month" icon={FolderKanban} tone="cyan" />
                <Metric label="Models trained" value="24" change="+6" note="this month" icon={WandSparkles} tone="amber" />
                <Metric label="Avg. precision" value="94.8%" change="+3.2%" note="across all models" icon={Target} tone="emerald" />
              </section>

              {/* Charts & Status */}
              <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold text-base">Labeling Activity</h2>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Images processed over the last 30 days
                      </p>
                    </div>
                    <span className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      Last 30 days
                    </span>
                  </div>
                  <div className="mt-7 flex h-48 items-end gap-2 sm:gap-3">
                    {[32, 44, 38, 57, 51, 72, 65, 76, 68, 89, 79, 94, 83, 100, 88, 97, 91, 78, 90, 84, 96, 100, 86, 91, 97, 88, 94, 90, 100, 96].map((height, index) => (
                      <div key={index} className="group relative flex h-full flex-1 items-end">
                        <div
                          style={{ height: `${height}%` }}
                          className={`w-full rounded-t-md transition group-hover:bg-violet-500 ${
                            index > 20 ? "bg-violet-500" : "bg-violet-200 dark:bg-violet-900/60"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between text-[11px] font-medium text-slate-400">
                    <span>Jul 12</span><span>Jul 19</span><span>Jul 26</span><span>Aug 02</span><span>Aug 10</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm sm:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-400">Active Inference Model</p>
                      <h2 className="mt-1 text-2xl font-bold">YOLO11 • v2.4</h2>
                    </div>
                    <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                      Production
                    </span>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <ModelStat label="mAP@50" value="94.8%" />
                    <ModelStat label="Precision" value="96.2%" />
                    <ModelStat label="Recall" value="91.7%" />
                  </div>
                  <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/20 text-violet-300">
                        <Activity size={18} />
                      </span>
                      <div>
                        <p className="text-xs font-semibold">Warehouse safety</p>
                        <p className="text-[10px] text-slate-400">Updated 12 min ago</p>
                      </div>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-400" />
                  </div>
                  <Link
                    href="/training"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-bold text-slate-950 transition hover:bg-violet-50"
                  >
                    <Play size={14} fill="currentColor" /> View training run
                  </Link>
                </div>
              </section>

              {/* Projects & Activity */}
              <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-base">Your Active Projects</h2>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Keep track of dataset labeling progress
                      </p>
                    </div>
                    <Link href="/datasets" className="text-xs font-bold text-violet-600 hover:underline">
                      View all
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <Link
                        href="/analysis"
                        key={project.name}
                        className="group flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition hover:border-violet-200 hover:bg-violet-50/50 dark:border-slate-800 dark:hover:border-violet-900 dark:hover:bg-violet-950/20"
                      >
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-white ${project.color}`}>
                          {project.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-xs font-bold">{project.name}</p>
                            <span className="text-xs font-bold text-slate-500">{project.progress}%</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500">{project.type} • {project.items}</p>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full rounded-full bg-violet-500" style={{ width: `${project.progress}%` }} />
                          </div>
                        </div>
                        <MoreHorizontal size={16} className="text-slate-400" />
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-base">Recent Audit &amp; Team Feed</h2>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Synchronized events
                      </p>
                    </div>
                    <Clock3 size={16} className="text-slate-400" />
                  </div>
                  <div className="space-y-4">
                    {activity.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="flex gap-3">
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white ${item.tone}`}>
                            <Icon size={15} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold">{item.title}</p>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">{item.detail}</p>
                            <p className="mt-0.5 text-[10px] font-medium text-slate-400">{item.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Link
                    href="/security"
                    className="mt-6 block text-center w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    View Security Audit Log
                  </Link>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  change,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  change: string;
  note: string;
  icon: typeof ImageIcon;
  tone: "violet" | "cyan" | "amber" | "emerald";
}) {
  const colors = {
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[tone]}`}>
          <Icon size={19} />
        </span>
        <span className="text-xs font-bold text-emerald-600">{change}</span>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <span className="text-[11px] text-slate-400">{note}</span>
      </div>
    </div>
  );
}

function ModelStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-base font-bold">{value}</p>
    </div>
  );
}
