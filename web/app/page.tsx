"use client";

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
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen bg-[#f7f8fc] text-slate-950 dark:bg-slate-950 dark:text-white">
      <Navbar />
      <div className="min-w-0 flex-1"><MobileTopbar /><main className="mx-auto max-w-[1440px] px-4 pb-12 pt-7 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold text-violet-600 dark:text-violet-300">Workspace • {user?.role === "admin" ? "Administrator View" : "Annotator View"}</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-[34px]">Good morning, {user?.name?.split(" ")[0] || "Sharvil"} <span aria-hidden>✦</span></h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Here&apos;s what&apos;s happening across your AI workspace.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/analysis" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-800 dark:bg-slate-900"><ScanLine size={16} /> Open analyzer</Link>
            <button className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"><Plus size={17} /> New project</button>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Images labeled" value="25,440" change="+18.4%" note="vs. last month" icon={ImageIcon} tone="violet" />
          <Metric label="Active projects" value="08" change="+2" note="this month" icon={FolderKanban} tone="cyan" />
          <Metric label="Models trained" value="24" change="+6" note="this month" icon={WandSparkles} tone="amber" />
          <Metric label="Avg. precision" value="94.8%" change="+3.2%" note="across all models" icon={Target} tone="emerald" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between">
              <div><h2 className="font-semibold">Labeling activity</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Images processed over the last 30 days</p></div>
              <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">Last 30 days <ChevronDown size={14} /></button>
            </div>
            <div className="mt-7 flex h-52 items-end gap-2 sm:gap-3">
              {[32, 44, 38, 57, 51, 72, 65, 76, 68, 89, 79, 94, 83, 100, 88, 97, 91, 78, 90, 84, 96, 100, 86, 91, 97, 88, 94, 90, 100, 96].map((height, index) => <div key={index} className="group relative flex h-full flex-1 items-end"><div style={{ height: `${height}%` }} className={`w-full rounded-t-md transition group-hover:bg-violet-500 ${index > 20 ? "bg-violet-500" : "bg-violet-200 dark:bg-violet-900/60"}`} /></div>)}
            </div>
            <div className="mt-3 flex justify-between text-[11px] font-medium text-slate-400"><span>Jul 12</span><span>Jul 19</span><span>Jul 26</span><span>Aug 02</span><span>Aug 10</span></div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm sm:p-6">
            <div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-400">Latest model</p><h2 className="mt-1 text-2xl font-semibold">YOLO11 • v2.4</h2></div><span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">Production</span></div>
            <div className="mt-8 grid grid-cols-3 gap-3"><ModelStat label="mAP@50" value="94.8%" /><ModelStat label="Precision" value="96.2%" /><ModelStat label="Recall" value="91.7%" /></div>
            <div className="mt-7 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/20 text-violet-300"><Activity size={18} /></span><div><p className="text-sm font-semibold">Warehouse safety</p><p className="text-xs text-slate-400">Updated 12 min ago</p></div></div><ArrowUpRight size={18} className="text-slate-400" /></div>
            <Link href="/training" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-50"><Play size={15} fill="currentColor" /> View training run</Link>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Your projects</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Keep an eye on labeling progress</p></div><Link href="/datasets" className="text-sm font-semibold text-violet-600 hover:text-violet-700">View all</Link></div>
            <div className="space-y-3">{projects.map((project) => <Link href="/analysis" key={project.name} className="group flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition hover:border-violet-200 hover:bg-violet-50/50 dark:border-slate-800 dark:hover:border-violet-900 dark:hover:bg-violet-950/20"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white ${project.color}`}>{project.icon}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold">{project.name}</p><span className="text-xs font-semibold text-slate-500">{project.progress}%</span></div><p className="mt-1 text-xs text-slate-500">{project.type} • {project.items}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-violet-500" style={{ width: `${project.progress}%` }} /></div></div><MoreHorizontal size={17} className="text-slate-400" /></Link>)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Recent activity</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Updates from your team</p></div><Clock3 size={18} className="text-slate-400" /></div><div className="space-y-5">{activity.map((item) => { const Icon = item.icon; return <div key={item.title} className="flex gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white ${item.tone}`}><Icon size={16} /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{item.detail}</p><p className="mt-1 text-[11px] font-medium text-slate-400">{item.time}</p></div></div>})}</div><button className="mt-7 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:text-slate-300">See all activity</button></div>
        </section>

        <section className="mt-5 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white shadow-lg shadow-violet-200/50 dark:border-violet-900 dark:shadow-none sm:p-7"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-100"><Sparkles size={16} /> New in LabellingApp</div><h2 className="text-xl font-semibold">Train smarter with experiment tracking</h2><p className="mt-1 max-w-xl text-sm text-violet-100">Compare every run, metric, and dataset version in one place. Start with a ready-to-use YOLO11 recipe.</p></div><Link href="/training" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50">Start a training run <ArrowUpRight size={16} /></Link></div></section>
      </main></div>
    </div>
  );
}

function Metric({ label, value, change, note, icon: Icon, tone }: { label: string; value: string; change: string; note: string; icon: typeof ImageIcon; tone: "violet" | "cyan" | "amber" | "emerald" }) {
  const colors = { violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300", cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300", amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300", emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[tone]}`}><Icon size={19} /></span><span className="text-xs font-semibold text-emerald-600">{change}</span></div><p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p><div className="mt-1 flex items-baseline gap-2"><p className="text-2xl font-semibold tracking-tight">{value}</p><span className="text-xs text-slate-400">{note}</span></div></div>;
}

function ModelStat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[11px] font-medium text-slate-400">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>; }
