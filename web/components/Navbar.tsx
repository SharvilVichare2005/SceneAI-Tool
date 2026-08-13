"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Camera,
  FolderKanban,
  ImageIcon,
  LayoutDashboard,
  Settings,
  Sparkles,
  Video,
  WandSparkles,
  Shield,
  ShieldCheck,
  LogOut,
  Crown,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ServerStatusBadge } from "@/components/ServerStatusBadge";
import { useAuth } from "@/context/AuthContext";
import { maskEmail } from "@/lib/security";

const primaryLinks = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/datasets", label: "Datasets", icon: FolderKanban },
  { href: "/analysis", label: "Annotate", icon: ImageIcon },
  { href: "/training", label: "Training", icon: BarChart3 },
  { href: "/models", label: "Model hub", icon: WandSparkles },
];

export function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const pathname = usePathname();

  const workspaceShell =
    pathname === "/" ||
    pathname.startsWith("/datasets") ||
    pathname.startsWith("/training") ||
    pathname.startsWith("/models") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/security");

  if (!workspaceShell) return <LegacyNavbar />;

  return (
    <aside className="hidden min-h-screen w-[248px] shrink-0 border-r border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col">
      {/* Brand logo */}
      <Link href="/" className="flex items-center gap-2 px-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white shadow-sm">
          <Sparkles size={18} />
        </span>
        <span className="text-[15px] font-bold tracking-tight">
          Scene<span className="text-violet-600">AI</span>
        </span>
      </Link>

      {/* Primary Workspace links */}
      <div className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        Workspace
      </div>
      <nav className="mt-3 space-y-1">
        {primaryLinks.map((link) => {
          const Icon = link.icon;
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              <Icon size={17} />
              {link.label}
              {link.label === "Training" && (
                <span className="ml-auto rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  2
                </span>
              )}
            </Link>
          );
        })}

        {/* Security Hub Link */}
        <Link
          href="/security"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            pathname.startsWith("/security")
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800"
          }`}
        >
          <ShieldCheck size={17} className="text-emerald-500" />
          <span>Security Hub</span>
          <span className="ml-auto rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
            Shield
          </span>
        </Link>

        {/* Admin Console Link (Visible only to Admin) */}
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              pathname.startsWith("/admin")
                ? "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                : "text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-slate-800"
            }`}
          >
            <Shield size={17} className="text-amber-500" />
            <span>Admin console</span>
            <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
              RBAC
            </span>
          </Link>
        )}
      </nav>

      {/* Capture Section */}
      <div className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        Capture
      </div>
      <nav className="mt-3 space-y-1">
        <Link
          href="/camera"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Camera size={17} /> Camera
        </Link>
        <Link
          href="/video"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Video size={17} /> Video
        </Link>
      </nav>

      {/* Footer Profile & Settings */}
      <div className="mt-auto pt-8">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Settings size={17} /> Settings &amp; Shield
        </Link>

        {/* User Card */}
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/70">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-bold text-white shadow-sm ${
                isAdmin
                  ? "bg-gradient-to-tr from-amber-500 to-violet-600"
                  : "bg-gradient-to-tr from-violet-500 to-indigo-500"
              }`}
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-bold">{user?.name || "User"}</p>
                {isAdmin && <Crown size={11} className="shrink-0 text-amber-500" />}
              </div>
              <p className="text-[10px] text-slate-400 capitalize">
                {user?.role || "user"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
            <span className="text-[10px] font-medium text-slate-400 truncate max-w-[120px]">
              {user?.email ? maskEmail(user.email, false) : "signed_out"}
            </span>
            <button
              onClick={signOut}
              title="Sign out"
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
            >
              <LogOut size={12} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function LegacyNavbar() {
  const { user, signOut, isAdmin } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
        <Link href="/" className="mr-2 flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-600 text-white">
            <Sparkles size={17} />
          </span>
          <span className="hidden sm:inline">
            Scene<span className="text-violet-600">AI</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/camera"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Camera size={16} />
            <span className="hidden sm:inline">Camera</span>
          </Link>
          <Link
            href="/video"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Video size={16} />
            <span className="hidden sm:inline">Video</span>
          </Link>
          <Link
            href="/security"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800"
          >
            <ShieldCheck size={16} className="text-emerald-500" />
            <span className="hidden sm:inline">Security Hub</span>
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-slate-800"
            >
              <Shield size={16} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <Link
            href="/settings"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Settings size={16} />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user && (
            <span className="hidden sm:inline text-xs font-semibold text-slate-500">
              {user.name} ({user.role})
            </span>
          )}
          <ServerStatusBadge />
          <ThemeToggle />
          <button
            onClick={signOut}
            title="Sign out"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function MobileTopbar() {
  const { user, signOut, isAdmin } = useAuth();
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
      <Link href="/" className="flex items-center gap-2 font-bold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-600 text-white">
          <Sparkles size={16} />
        </span>
        Scene<span className="text-violet-600">AI</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/security"
          className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-600 dark:text-emerald-400"
          title="Security Hub"
        >
          <ShieldCheck size={16} />
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="rounded-lg bg-amber-500/15 p-1.5 text-amber-600 dark:text-amber-400"
            title="Admin Console"
          >
            <Shield size={16} />
          </Link>
        )}
        <ServerStatusBadge />
        <ThemeToggle />
        <button
          onClick={signOut}
          title="Sign out"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
