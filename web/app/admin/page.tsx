"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Users,
  UserCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Database,
  ArrowLeft,
  Crown,
  Activity,
  Layers,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Download,
} from "lucide-react";
import { Navbar, MobileTopbar } from "@/components/Navbar";
import { useAuth, AppUser, UserRole } from "@/context/AuthContext";
import { maskEmail, maskDatabaseUrl } from "@/lib/security";

export default function AdminConsolePage() {
  const { user, isAdmin, fetchAllUsers, updateUserRole, isConfigured, projectUrl } = useAuth();
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [copiedSql, setCopiedSql] = useState(false);

  // Schema lock state
  const [unlockedSchema, setUnlockedSchema] = useState(false);
  const [revealedEmails, setRevealedEmails] = useState(false);

  // Load user profiles
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingUsers(true);
      try {
        const list = await fetchAllUsers();
        if (active) setUsersList(list);
      } catch {
        // fallback
      } finally {
        if (active) setLoadingUsers(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchAllUsers]);

  const handleRoleChange = async (userId: string, targetRole: UserRole) => {
    setActionSuccess("");
    setActionError("");
    try {
      await updateUserRole(userId, targetRole);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
      );
      setActionSuccess(`User role updated to ${targetRole.toUpperCase()}`);
      setTimeout(() => setActionSuccess(""), 3500);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update role");
      setTimeout(() => setActionError(""), 4000);
    }
  };

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [usersList, searchQuery, roleFilter]);

  const stats = useMemo(() => {
    const total = usersList.length;
    const admins = usersList.filter((u) => u.role === "admin").length;
    const annotators = usersList.filter((u) => u.role === "user").length;
    return { total, admins, annotators };
  }, [usersList]);

  const copySqlSchema = () => {
    const sql = `-- Supabase profiles schema for LabellingApp
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // If user is not an Admin, show access gate
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen bg-[#f7f8fc] dark:bg-slate-950">
        <Navbar />
        <div className="min-w-0 flex-1">
          <MobileTopbar />
          <main className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-4 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
              <Shield size={32} />
            </div>
            <h1 className="mt-5 text-2xl font-bold">Admin Privileges Required</h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              You are signed in as an <strong>Annotator (User)</strong>. Access to the Admin Console
              and database management is restricted by workspace security policy.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700"
              >
                <ArrowLeft size={15} /> Return to Workspace
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f7f8fc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <div className="min-w-0 flex-1">
        <MobileTopbar />
        <main className="mx-auto max-w-[1400px] px-4 py-7 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400">
                <Crown size={15} /> Workspace Administration &amp; RBAC Shield
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Manage role-based permissions, inspect team activity, and administer database policies.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 px-3.5 py-2 text-xs font-bold text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Privileged Administrator ({user?.name})</span>
            </div>
          </div>

          {/* Feedback alerts */}
          {actionSuccess && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CheckCircle2 size={16} />
              <span>{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
              <AlertCircle size={16} />
              <span>{actionError}</span>
            </div>
          )}

          {/* Summary Stat Cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                  <Users size={19} />
                </span>
                <span className="text-xs font-bold text-violet-600">Total</span>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                Registered Accounts
              </p>
              <p className="mt-1 text-2xl font-bold">{stats.total}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                  <Shield size={19} />
                </span>
                <span className="text-xs font-bold text-amber-600">Privileged</span>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                Administrators
              </p>
              <p className="mt-1 text-2xl font-bold">{stats.admins}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300">
                  <UserCheck size={19} />
                </span>
                <span className="text-xs font-bold text-cyan-600">Workspace</span>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                Annotators / Standard Users
              </p>
              <p className="mt-1 text-2xl font-bold">{stats.annotators}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Database size={19} />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  Secured
                </span>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                Supabase Protection
              </p>
              <p className="mt-1 truncate text-xs font-bold text-slate-700 dark:text-slate-300">
                RLS Policies Active
              </p>
            </div>
          </section>

          {/* User Management Section */}
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Table Filters & Toolbar */}
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-base">User Directory &amp; RBAC Control</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Elevate team members to Administrator or assign standard Annotator permissions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-52 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                {/* Email Anonymization Toggle */}
                <button
                  onClick={() => setRevealedEmails(!revealedEmails)}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {revealedEmails ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{revealedEmails ? "Mask Emails" : "Reveal PII"}</span>
                </button>

                {/* Role Filter Tabs */}
                <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800">
                  <button
                    onClick={() => setRoleFilter("all")}
                    className={`rounded-lg px-2.5 py-1 transition ${
                      roleFilter === "all"
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    }`}
                  >
                    All ({stats.total})
                  </button>
                  <button
                    onClick={() => setRoleFilter("admin")}
                    className={`rounded-lg px-2.5 py-1 transition ${
                      roleFilter === "admin"
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    }`}
                  >
                    Admins ({stats.admins})
                  </button>
                  <button
                    onClick={() => setRoleFilter("user")}
                    className={`rounded-lg px-2.5 py-1 transition ${
                      roleFilter === "user"
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    }`}
                  >
                    Annotators ({stats.annotators})
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-xs font-semibold text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Email (Masked by Policy)</th>
                    <th className="px-5 py-3.5">Assigned Role</th>
                    <th className="px-5 py-3.5">Joined</th>
                    <th className="px-5 py-3.5 text-right">Role Elevation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        Loading directory…
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isCurrent = u.id === user?.id || u.email === user?.email;
                      return (
                        <tr
                          key={u.id}
                          className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`grid h-8 w-8 place-items-center rounded-xl text-xs font-bold text-white shadow-sm ${
                                  u.role === "admin"
                                    ? "bg-gradient-to-tr from-amber-500 to-violet-600"
                                    : "bg-gradient-to-tr from-violet-500 to-cyan-500"
                                }`}
                              >
                                {u.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-xs text-slate-900 dark:text-white">
                                  {u.name} {isCurrent && <span className="text-[10px] text-violet-500 font-bold">(You)</span>}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">ID: {u.id.slice(0, 8)}…</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-mono text-slate-600 dark:text-slate-300">
                            {revealedEmails ? u.email : maskEmail(u.email, false)}
                          </td>
                          <td className="px-5 py-4">
                            {u.role === "admin" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                <Crown size={12} className="text-amber-500" />
                                Administrator
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                <UserCheck size={12} className="text-slate-400" />
                                Annotator
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Active"}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {u.role === "admin" ? (
                              <button
                                onClick={() => handleRoleChange(u.id, "user")}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
                              >
                                Demote to Annotator
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRoleChange(u.id, "admin")}
                                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
                              >
                                Elevate to Admin
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Supabase Schema & SQL Security Section */}
          <section className="mt-7 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-violet-600" />
                <h3 className="font-bold text-base">Supabase Infrastructure Endpoint</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Protected database connection topology:
              </p>
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/70">
                <p className="text-[10px] font-bold text-slate-400">Target Endpoint:</p>
                <p className="mt-0.5 font-mono text-violet-600 dark:text-violet-400 break-all">
                  {maskDatabaseUrl(projectUrl, false)}
                </p>
              </div>
              <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Real-time GoTrue authentication active</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Row Level Security (RLS) verified</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock size={18} className="text-violet-600" />
                  <h3 className="font-bold text-base">Database Schema Lock</h3>
                </div>
                <button
                  onClick={() => setUnlockedSchema(!unlockedSchema)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {unlockedSchema ? "Lock Schema" : "Unlock Schema"}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                SQL schema definitions are hidden by default to prevent internal architecture disclosure.
              </p>

              {unlockedSchema ? (
                <div className="mt-3">
                  <div className="flex justify-end mb-1">
                    <button
                      onClick={copySqlSchema}
                      className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:underline"
                    >
                      {copiedSql ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>{copiedSql ? "Copied!" : "Copy SQL"}</span>
                    </button>
                  </div>
                  <pre className="max-h-36 overflow-y-auto rounded-xl bg-slate-900 p-3 text-[10px] font-mono text-slate-200">
{`CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT now()
);`}
                  </pre>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
                  <Lock size={20} className="mx-auto mb-1 text-slate-400" />
                  <span>Schema concealed by Master Admin lock.</span>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
