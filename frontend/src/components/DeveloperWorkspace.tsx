import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, FolderKanban, Users, Plus, KeyRound, RefreshCw,
  Send, Trash2, CalendarDays, ExternalLink, ShieldCheck, CheckCircle2,
  Clock, AlertCircle, ChevronRight, X, ArrowLeft, ArrowUpRight, LogOut, Sun, Moon
} from "lucide-react";
import { apiFetch } from "../lib/api";
import CredentialsVault from "./CredentialsVault";

type Developer = {
  id: string;
  name: string;
  email: string;
  assigned_projects?: number;
  completed_projects?: number;
  active_projects?: number;
  average_progress?: number | string;
  last_activity_at?: string | null;
};

type Project = {
  id: string;
  name: string;
  client_name: string | null;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  progress?: number | string;
  assigned_developer_id: string;
  developer_name?: string;
};

type Update = {
  id: string;
  message: string;
  progress: number;
  author_name?: string;
  created_at: string;
};

export default function DeveloperWorkspace({
  admin = false,
  embedded = false,
  onLogout,
  onBack,
  dark: propDark,
  onToggleTheme,
}: {
  admin?: boolean;
  embedded?: boolean;
  onLogout?: () => void;
  onBack?: () => void;
  dark?: boolean;
  onToggleTheme?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"projects" | "team" | "assign" | "vault">("projects");
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeDeveloperId, setActiveDeveloperId] = useState<string | null>(null);
  const [projectStatusFilter, setProjectStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<Project | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<"" | "developer" | "project" | "update">("");
  const [removingDeveloper, setRemovingDeveloper] = useState(false);
  const [showCreateDevModal, setShowCreateDevModal] = useState(false);
  const [dark, setDark] = useState<boolean>(() => {
    if (propDark !== undefined) return propDark;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zootechx_theme");
      if (saved) return saved === "dark";
    }
    return true;
  });

  useEffect(() => {
    if (propDark !== undefined) {
      setDark(propDark);
    }
  }, [propDark]);

  const handleToggleTheme = () => {
    const nextDark = !dark;
    setDark(nextDark);
    if (typeof window !== "undefined") {
      localStorage.setItem("zootechx_theme", nextDark ? "dark" : "light");
      if (nextDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    }
    if (onToggleTheme) {
      onToggleTheme();
    }
  };

  // Forms
  const [developerForm, setDeveloperForm] = useState({ name: "", email: "", password: "" });
  const [projectForm, setProjectForm] = useState({
    name: "",
    clientName: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    assignedDeveloperId: "",
  });
  const dueDateRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const projectResponse = await apiFetch("/api/projects");
      const projectData = await projectResponse.json();
      if (!projectResponse.ok) throw new Error(projectData.message || "Unable to load projects");
      setProjects(projectData.data ?? []);

      if (admin) {
        const developerResponse = await apiFetch("/api/developers");
        const developerData = await developerResponse.json();
        if (!developerResponse.ok) throw new Error(developerData.message || "Unable to load developers");
        setDevelopers(developerData.data ?? []);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to reach the project service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    if (!admin) return;
    const refreshId = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(refreshId);
  }, [admin]);

  const selectProject = async (project: Project) => {
    setSelected(project);
    setProgress(Number(project.progress ?? (project.status === "COMPLETED" ? 100 : 0)));
    try {
      const response = await apiFetch(`/api/projects/${project.id}/updates`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load updates");
      setUpdates(data.data ?? []);
    } catch (error) {
      setUpdates([]);
      setNotice(error instanceof Error ? error.message : "Unable to load updates");
    }
  };

  const createDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!developerForm.name.trim() || !developerForm.email.trim() || developerForm.password.length < 8) {
      setNotice("Enter a name, email, and password with at least 8 characters.");
      return;
    }
    setSaving("developer");
    try {
      const response = await apiFetch("/api/developers", {
        method: "POST",
        body: JSON.stringify(developerForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setDevelopers((current) => [data.data, ...current]);
      setDeveloperForm({ name: "", email: "", password: "" });
      setShowCreateDevModal(false);
      setNotice("Developer account created successfully.");
      void load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create developer");
    } finally {
      setSaving("");
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name.trim() || !projectForm.assignedDeveloperId) {
      setNotice("Enter a project name and select an assigned developer.");
      return;
    }
    setSaving("project");
    try {
      const response = await apiFetch("/api/projects", {
        method: "POST",
        body: JSON.stringify(projectForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setProjects((current) => [data.data, ...current]);
      setProjectForm({
        name: "",
        clientName: "",
        description: "",
        priority: "MEDIUM",
        dueDate: "",
        assignedDeveloperId: "",
      });
      setNotice("Project assigned successfully.");
      setActiveTab("projects");
      void load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to assign project");
    } finally {
      setSaving("");
    }
  };

  const addUpdate = async () => {
    if (!selected) return;
    setSaving("update");
    try {
      const response = await apiFetch(`/api/projects/${selected.id}/updates`, {
        method: "POST",
        body: JSON.stringify({ message, progress, status: selected.status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setUpdates((current) => [data.data, ...current]);
      if (data.project) {
        const next = { ...selected, status: data.project.status, progress: data.project.progress };
        setSelected(next);
        setProjects((current) => current.map((p) => (p.id === next.id ? { ...p, ...next } : p)));
      }
      setMessage("");
      setNotice("Progress update saved.");
      void load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save update");
    } finally {
      setSaving("");
    }
  };

  const removeDeveloper = async () => {
    if (!activeDeveloperId) return;
    const developer = developers.find((item) => item.id === activeDeveloperId);
    if (!developer || !window.confirm(`Remove ${developer.name}'s developer login?`)) return;
    setRemovingDeveloper(true);
    try {
      const response = await apiFetch(`/api/developers/${developer.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Unable to remove developer");
      }
      setNotice("Developer account removed.");
      setActiveDeveloperId(null);
      void load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to remove developer");
    } finally {
      setRemovingDeveloper(false);
    }
  };

  const updateProjectStatus = async (status: string) => {
    if (!selected) return;
    setSaving("update");
    try {
      const response = await apiFetch(`/api/projects/${selected.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update project status");
      const next = { ...selected, ...data.data, progress: selected.progress };
      setSelected(next);
      setProjects((current) => current.map((p) => (p.id === next.id ? { ...p, ...next } : p)));
      setNotice(`Project status updated to ${status.replace("_", " ")}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update status");
    } finally {
      setSaving("");
    }
  };

  const visibleProjects = projects.filter(
    (project) =>
      (!activeDeveloperId || project.assigned_developer_id === activeDeveloperId) &&
      (projectStatusFilter === "ALL" || project.status === projectStatusFilter)
  );

  const activeProjects = projects.filter((p) => p.status === "IN_PROGRESS").length;
  const completedProjects = projects.filter((p) => p.status === "COMPLETED").length;
  const averageProgress = projects.length
    ? Math.round(
        projects.reduce(
          (sum, p) => sum + Number(p.progress ?? (p.status === "COMPLETED" ? 100 : 0)),
          0
        ) / projects.length
      )
    : 0;

  // Colors (Nocturne & Ivory Luxury Palette)
  const bgMain = dark ? "bg-[#0c1017] text-[#f1f5f9]" : "bg-[#fbf8f2] text-[#1c1917]";
  const bgSidebar = dark ? "bg-[#0f1420] border-[#1b2438]" : "bg-[#f8f4ec] border-[#ede5d8]";
  const bgCard = dark ? "bg-[#121826] border-[#1e293b] text-[#f1f5f9]" : "bg-white border-[#eee6da] text-[#1c1917] shadow-[0_4px_20px_-2px_rgba(180,155,120,0.08)]";
  const inputBg = dark ? "bg-[#171f30] border-[#222d42] text-[#f1f5f9] placeholder-[#5a687d]" : "bg-[#fcfaf7] border-[#e5dcd0] text-[#1c1917] placeholder-[#a8a199]";
  const mutedText = dark ? "text-[#8e9bb0]" : "text-[#78716c]";

  type NavItem = {
    id: "projects" | "team" | "assign" | "vault";
    label: string;
    icon: React.ComponentType<any>;
    badge?: number;
  };

  const navigationItems: NavItem[] = [
    { id: "projects", label: admin ? "All Projects" : "My Projects", icon: FolderKanban, badge: projects.length },
    ...(admin ? [{ id: "team", label: "Team Members", icon: Users, badge: developers.length } as NavItem] : []),
    ...(admin ? [{ id: "assign", label: "Assign Project", icon: Plus } as NavItem] : []),
    { id: "vault", label: "Credentials & API Vault", icon: KeyRound },
  ];

  const renderTabContent = () => (
    <>
      {/* NOTICE BANNER */}
      {notice && (
        <div className="flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-xs font-semibold text-indigo-300">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice("")} className="opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* TAB 1: PROJECTS */}
          {activeTab === "projects" && (
            <div className="space-y-6 max-w-[1600px] mx-auto w-full">
              {/* TOP STATS CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Projects", value: projects.length, color: "text-white" },
                  { label: "Active In Progress", value: activeProjects, color: "text-cyan-400" },
                  { label: "Completed", value: completedProjects, color: "text-emerald-400" },
                  { label: "Avg Delivery Rate", value: `${averageProgress}%`, color: "text-indigo-400" },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-3xl border p-4 lg:p-5 ${bgCard} shadow-sm`}>
                    <div className={`text-[11px] font-semibold uppercase tracking-wider ${mutedText}`}>
                      {stat.label}
                    </div>
                    <div className={`text-2xl lg:text-3xl font-bold mt-1.5 ${stat.color}`}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* FILTERS & SEARCH */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {["ALL", "NEW", "IN_PROGRESS", "COMPLETED"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setProjectStatusFilter(st)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        projectStatusFilter === st
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                          : `${mutedText} border border-inherit hover:bg-white/5`
                      }`}
                    >
                      {st === "ALL" ? "All Projects" : st.replace("_", " ")}
                    </button>
                  ))}
                </div>

                {admin && (
                  <div className="flex items-center gap-2">
                    <select
                      value={activeDeveloperId ?? ""}
                      onChange={(e) => setActiveDeveloperId(e.target.value || null)}
                      className={`h-9 rounded-xl border px-3 text-xs outline-none ${inputBg}`}
                    >
                      <option value="">All Developers</option>
                      {developers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setActiveTab("assign")}
                      className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 text-xs font-semibold text-white shadow hover:opacity-95"
                    >
                      <Plus size={14} />
                      <span>New Project</span>
                    </button>
                  </div>
                )}
              </div>

              {/* PROJECTS GRID */}
              {loading && projects.length === 0 ? (
                <div className={`rounded-3xl border p-12 text-center text-sm ${bgCard}`}>
                  Loading projects...
                </div>
              ) : visibleProjects.length === 0 ? (
                <div className={`rounded-3xl border border-dashed p-14 text-center ${bgCard}`}>
                  <FolderKanban size={32} className="mx-auto text-slate-500 opacity-60 mb-2" />
                  <p className="text-sm font-semibold">No projects found in this category.</p>
                  <p className={`text-xs mt-1 ${mutedText}`}>
                    {admin ? "Assign a new project to get started." : "No tasks currently assigned to you."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleProjects.map((project) => {
                    const projectProgress = Number(
                      project.progress ?? (project.status === "COMPLETED" ? 100 : 0)
                    );
                    const isSelected = selected?.id === project.id;
                    return (
                      <div
                        key={project.id}
                        onClick={() => void selectProject(project)}
                        className={`cursor-pointer rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/20"
                            : `${bgCard} hover:border-indigo-500/40`
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className={`font-bold text-sm leading-tight ${dark ? "text-white" : "text-slate-900"}`}>
                              {project.name}
                            </h3>
                            <div className={`text-xs mt-1 ${mutedText}`}>
                              {project.client_name || "Internal Project"}
                              {project.developer_name ? ` • ${project.developer_name}` : ""}
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              project.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : project.status === "IN_PROGRESS"
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {project.status.replace("_", " ")}
                          </span>
                        </div>

                        <p className={`mt-3 line-clamp-2 text-xs leading-relaxed ${mutedText}`}>
                          {project.description || "No description provided."}
                        </p>

                        <div className="mt-4 pt-3 border-t border-inherit">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className={mutedText}>Completion</span>
                            <span className="font-semibold text-indigo-400">{projectProgress}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 transition-all duration-500"
                              style={{ width: `${projectProgress}%` }}
                            />
                          </div>
                        </div>

                        {project.due_date && (
                          <div className={`mt-3 flex items-center gap-1.5 text-[11px] ${mutedText}`}>
                            <CalendarDays size={13} />
                            <span>Due: {new Date(project.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PROJECT DETAILS & PROGRESS UPDATE MODAL/DRAWER */}
              <AnimatePresence>
                {selected && (
                  <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelected(null)}
                      className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 lg:p-8 shadow-2xl ${
                        dark ? "border-white/10 bg-[#121624] text-white" : "border-slate-200 bg-white text-slate-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 border-b border-inherit pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold">{selected.name}</h3>
                            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {selected.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 ${mutedText}`}>
                            Client: {selected.client_name || "Internal"} • Assigned:{" "}
                            {selected.developer_name || "Developer"}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelected(null)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-white"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Project Description */}
                      <div className="mt-4">
                        <h4 className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>
                          Project Scope & Non-secret Notes
                        </h4>
                        <p className={`mt-1 text-xs leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>
                          {selected.description || "No description added."}
                        </p>
                      </div>

                      {/* STATUS TOGGLE */}
                      <div className="mt-5 rounded-2xl border border-inherit p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold">Update Status</span>
                          <span className="text-xs text-indigo-400 font-semibold">{progress}% complete</span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {[
                            { id: "NEW", label: "New" },
                            { id: "PENDING", label: "Pending" },
                            { id: "IN_PROGRESS", label: "In Progress" },
                            { id: "COMPLETED", label: "Completed" },
                          ].map((s) => (
                            <button
                              key={s.id}
                              onClick={() => void updateProjectStatus(s.id)}
                              className={`py-2 rounded-xl text-xs font-semibold transition ${
                                selected.status === s.id
                                  ? "bg-indigo-600 text-white shadow-md"
                                  : "border border-inherit text-slate-400 hover:bg-white/5"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>

                        {/* Slider */}
                        <label className="block text-xs font-semibold mb-1">Progress Percentage</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progress}
                          onChange={(e) => setProgress(Number(e.target.value))}
                          className="w-full accent-indigo-600 h-2 bg-slate-800 rounded-lg cursor-pointer"
                        />

                        {/* Note */}
                        <textarea
                          rows={2}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Add progress note or milestone completed..."
                          className={`mt-3 w-full rounded-xl border p-3 text-xs outline-none ${inputBg}`}
                        />

                        <button
                          disabled={saving === "update"}
                          onClick={() => void addUpdate()}
                          className="mt-3 w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow hover:opacity-95 disabled:opacity-50"
                        >
                          <Send size={14} />
                          <span>{saving === "update" ? "Saving..." : "Save Progress Update"}</span>
                        </button>
                      </div>

                      {/* UPDATES TIMELINE */}
                      <div className="mt-6">
                        <h4 className="text-xs font-bold mb-3">Delivery Updates History</h4>
                        <div className="space-y-2.5 max-h-56 overflow-y-auto">
                          {updates.map((u) => (
                            <div key={u.id} className="rounded-2xl border border-inherit p-3 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-200">
                                  {u.author_name || "Developer"}
                                </span>
                                <span className="font-mono text-indigo-400 font-bold">{u.progress}%</span>
                              </div>
                              {u.message && <p className={`mt-1 ${mutedText}`}>{u.message}</p>}
                              <div className={`mt-1.5 text-[10px] ${mutedText}`}>
                                {new Date(u.created_at).toLocaleString()}
                              </div>
                            </div>
                          ))}
                          {updates.length === 0 && (
                            <div className={`text-center py-4 text-xs ${mutedText}`}>
                              No progress logs recorded yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* TAB 2: TEAM MEMBERS (ADMIN ONLY) */}
          {activeTab === "team" && admin && (
            <div className="space-y-6 max-w-[1600px] mx-auto w-full">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className={`text-xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Engineering Team Directory</h3>
                  <p className={`text-xs mt-1 ${mutedText}`}>
                    Manage developer logins, delivery workloads, and active task progress.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateDevModal(true)}
                  className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow hover:bg-indigo-700"
                >
                  <Plus size={16} />
                  <span>Create Developer Login</span>
                </button>
              </div>

              {/* Developer Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {developers.map((dev) => {
                  const assigned = Number(dev.assigned_projects ?? 0);
                  const active = Number(dev.active_projects ?? 0);
                  const done = Number(dev.completed_projects ?? 0);
                  const avg = Number(dev.average_progress ?? 0);
                  const isSelected = activeDeveloperId === dev.id;

                  return (
                    <div
                      key={dev.id}
                      className={`rounded-3xl border p-5 transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/20"
                          : bgCard
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-sm">{dev.name}</div>
                          <div className={`text-xs mt-0.5 ${mutedText}`}>{dev.email}</div>
                        </div>
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400">
                          {avg}% Progress
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-white/5 p-2">
                          <div className="text-base font-bold text-white">{assigned}</div>
                          <div className={`text-[10px] uppercase ${mutedText}`}>Assigned</div>
                        </div>
                        <div className="rounded-xl bg-cyan-500/10 p-2">
                          <div className="text-base font-bold text-cyan-400">{active}</div>
                          <div className="text-[10px] uppercase text-cyan-400">Active</div>
                        </div>
                        <div className="rounded-xl bg-emerald-500/10 p-2">
                          <div className="text-base font-bold text-emerald-400">{done}</div>
                          <div className="text-[10px] uppercase text-emerald-400">Done</div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveDeveloperId(isSelected ? null : dev.id);
                            setActiveTab("projects");
                          }}
                          className="flex-1 h-8 rounded-xl border border-inherit text-xs font-semibold hover:bg-white/5 transition"
                        >
                          View Projects
                        </button>
                        <button
                          onClick={() => {
                            setActiveDeveloperId(dev.id);
                            void removeDeveloper();
                          }}
                          title="Remove developer"
                          className="h-8 w-8 flex items-center justify-center rounded-xl text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ASSIGN PROJECT (ADMIN ONLY) */}
          {activeTab === "assign" && admin && (
            <div className="max-w-2xl mx-auto w-full space-y-5">
              <div className={`rounded-3xl border p-6 lg:p-8 ${bgCard} shadow-xl`}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="h-9 w-9 rounded-xl bg-indigo-600/15 text-indigo-400 flex items-center justify-center">
                    <Plus size={18} />
                  </div>
                  <h3 className="text-lg font-bold">Assign New Project</h3>
                </div>
                <p className={`text-xs mb-6 ${mutedText}`}>
                  Allocate a client or internal project with clear deliverables and assigned developer.
                </p>

                <form onSubmit={createProject} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Project Title *
                    </label>
                    <input
                      required
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                      placeholder="e.g. Next.js E-Commerce Redesign"
                      className={`h-11 w-full rounded-xl border px-3.5 text-xs outline-none focus:border-indigo-500 ${inputBg}`}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Client / Business Name
                      </label>
                      <input
                        value={projectForm.clientName}
                        onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                        placeholder="e.g. Apex Global"
                        className={`h-11 w-full rounded-xl border px-3.5 text-xs outline-none focus:border-indigo-500 ${inputBg}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Assign Developer *
                      </label>
                      <select
                        required
                        value={projectForm.assignedDeveloperId}
                        onChange={(e) => setProjectForm({ ...projectForm, assignedDeveloperId: e.target.value })}
                        className={`h-11 w-full rounded-xl border px-3 text-xs outline-none focus:border-indigo-500 ${inputBg}`}
                      >
                        <option value="">Select an engineer</option>
                        {developers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Priority Level
                      </label>
                      <select
                        value={projectForm.priority}
                        onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })}
                        className={`h-11 w-full rounded-xl border px-3 text-xs outline-none focus:border-indigo-500 ${inputBg}`}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Target Due Date
                      </label>
                      <input
                        type="date"
                        ref={dueDateRef}
                        value={projectForm.dueDate}
                        onChange={(e) => setProjectForm({ ...projectForm, dueDate: e.target.value })}
                        className={`h-11 w-full rounded-xl border px-3 text-xs outline-none focus:border-indigo-500 ${inputBg}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Deliverables & Scope Brief
                    </label>
                    <textarea
                      rows={3}
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                      placeholder="Describe the expected functionality, endpoints, Figma links, or deployment requirements..."
                      className={`w-full rounded-xl border p-3.5 text-xs outline-none focus:border-indigo-500 ${inputBg}`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving === "project" || developers.length === 0}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 hover:opacity-95 disabled:opacity-50"
                  >
                    {saving === "project" ? "Assigning Project..." : "Assign Project to Developer"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: CREDENTIALS VAULT */}
          {activeTab === "vault" && (
            <div className="max-w-[1600px] mx-auto w-full">
              <CredentialsVault dark={dark} />
            </div>
          )}

          {/* CREATE DEVELOPER MODAL */}
          <AnimatePresence>
            {showCreateDevModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                  onClick={() => setShowCreateDevModal(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl ${bgCard}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base">Create Developer Login</h3>
                    <button
                      onClick={() => setShowCreateDevModal(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <form onSubmit={createDeveloper} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Developer Full Name</label>
                      <input
                        required
                        value={developerForm.name}
                        onChange={(e) => setDeveloperForm({ ...developerForm, name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Work Email</label>
                      <input
                        required
                        type="email"
                        value={developerForm.email}
                        onChange={(e) => setDeveloperForm({ ...developerForm, email: e.target.value })}
                        placeholder="e.g. rahul@company.com"
                        className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Temporary Password</label>
                      <input
                        required
                        type="password"
                        minLength={8}
                        value={developerForm.password}
                        onChange={(e) => setDeveloperForm({ ...developerForm, password: e.target.value })}
                        placeholder="Min 8 characters"
                        className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`}
                      />
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateDevModal(false)}
                        className="h-9 px-4 rounded-xl border border-inherit text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving === "developer"}
                        className="h-9 px-5 rounded-xl bg-indigo-600 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {saving === "developer" ? "Creating..." : "Create Account"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      );

      if (embedded) {
        return (
          <div className="max-w-[1600px] mx-auto w-full space-y-6">
            {/* PAGE HEADER MATCHING SUPER ADMIN PAGES */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className={`text-[22px] font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                    Developers & Projects
                  </h1>
                  <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400">
                    Engineering Hub
                  </span>
                </div>
                <p className={`text-[13px] ${mutedText} mt-0.5`}>
                  Manage engineering team, monitor delivery progress, and assign client tasks
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => void load()}
                  title="Refresh projects"
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                    dark ? "border-white/10 text-slate-400 hover:text-white hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <RefreshCw size={15} className={loading ? "animate-spin text-indigo-400" : ""} />
                </button>

                {admin && (
                  <>
                    <button
                      onClick={() => setShowCreateDevModal(true)}
                      className={`h-9 px-3.5 rounded-xl border text-[13px] font-semibold flex items-center gap-2 transition ${
                        dark
                          ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Users size={15} />
                      <span>Add Developer</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("assign");
                        setSelected(null);
                      }}
                      className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-medium flex items-center gap-2 shadow-sm hover:opacity-95"
                    >
                      <Plus size={16} />
                      <span>Assign Project</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* SUBNAV TABS */}
            <div className={`flex items-center gap-2 border-b pb-3 ${dark ? "border-white/10" : "border-[#eee6da]"}`}>
              {[
                { id: "projects", label: "Projects & Tasks", icon: FolderKanban, badge: projects.length },
                ...(admin ? [{ id: "team", label: "Team Members", icon: Users, badge: developers.length }] : []),
                ...(admin ? [{ id: "assign", label: "Assign Project", icon: Plus }] : []),
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setSelected(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? (dark
                            ? "bg-[#171f30] text-[#cca45f] border border-[#cca45f]/30 shadow-sm font-semibold"
                            : "bg-white text-[#a07432] border border-[#eee6da] shadow-sm font-semibold")
                        : `${mutedText} hover:${dark ? "bg-white/5 text-[#f1f5f9]" : "bg-[#f4eee4] text-[#1c1917]"}`
                    }`}
                  >
                    <tab.icon size={15} />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          active
                            ? (dark ? "bg-[#cca45f]/20 text-[#cca45f]" : "bg-[#f5eddf] text-[#a07432]")
                            : (dark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-700")
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB BODY CONTENT */}
            {renderTabContent()}
          </div>
        );
      }

      return (
        <div className={`luxury-app ${dark ? "dark-theme" : "light-theme"} h-screen w-full overflow-hidden flex flex-row ${bgMain} font-sans antialiased transition-colors duration-200`}>
          {/* SIDEBAR NAVIGATION */}
          <aside className={`w-[260px] shrink-0 hidden md:flex flex-col border-r ${bgSidebar} h-screen z-20`}>
            {/* Brand Header */}
            <div className="p-5 border-b border-inherit flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-base border ${
                  dark 
                    ? "bg-[#171f30] border-[#222d42] text-[#cca45f] shadow-[0_0_15px_rgba(204,164,95,0.15)]" 
                    : "bg-white border-[#eee6da] text-[#a07432] shadow-sm"
                }`}>
                  Z
                </div>
                <div>
                  <div className="font-bold text-[14px] leading-tight flex items-center gap-1.5">
                    ZootechX<span className={dark ? "text-[#cca45f]" : "text-[#a07432]"}>.ai</span>
                    <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${dark ? "bg-[#cca45f]" : "bg-[#a07432]"}`} />
                  </div>
                  <div className={`text-[10px] font-mono uppercase tracking-widest font-semibold ${dark ? "text-[#cca45f]" : "text-[#a07432]"}`}>
                    {admin ? "Engineering Hub" : "Developer Workspace"}
                  </div>
                </div>
              </div>
              {onBack && (
                <button
                  onClick={onBack}
                  title="Return to portal"
                  className={`p-1.5 rounded-lg border border-inherit transition ${dark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
                >
                  <ArrowLeft size={16} />
                </button>
              )}
            </div>

            {/* Navigation List */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              {navigationItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setSelected(null);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[13px] font-medium transition-all ${
                      active
                        ? (dark ? "bg-[#171f30] text-[#cca45f] border border-[#cca45f]/30 shadow-md font-semibold" : "bg-white text-[#a07432] border border-[#eee6da] shadow-sm font-semibold")
                        : `${mutedText} ${dark ? "hover:bg-[#121826] hover:text-[#f1f5f9]" : "hover:bg-[#f4eee4] hover:text-[#1c1917]"}`
                    }`}
                  >
                    <item.icon size={18} className={active ? (dark ? "text-[#cca45f]" : "text-[#a07432]") : (dark ? "text-slate-400" : "text-slate-500")} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                          active
                            ? (dark ? "bg-[#cca45f]/20 text-[#cca45f]" : "bg-[#f5eddf] text-[#a07432]")
                            : (dark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-700")
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-inherit space-y-2">
              <button
                onClick={handleToggleTheme}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${dark ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {dark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
                <span>{dark ? "Light Mode" : "Dark Mode"}</span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut size={15} />
                  <span>Log out</span>
                </button>
              )}
            </div>
          </aside>

          {/* MAIN VIEWPORT */}
          <div className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden">
            {/* TOP BAR */}
            <header className={`h-16 shrink-0 border-b flex items-center justify-between px-6 backdrop-blur-xl ${bgSidebar}`}>
              <div className="flex items-center gap-3">
                <h2 className={`text-lg font-bold tracking-tight capitalize ${dark ? "text-white" : "text-slate-900"}`}>
                  {activeTab === "projects"
                    ? "Projects & Tasks"
                    : activeTab === "team"
                    ? "Team Developers"
                    : activeTab === "assign"
                    ? "Assign Project"
                    : "Credentials & Secret Vault"}
                </h2>
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400">
                  {admin ? "Super Admin Access" : "Developer Role"}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Day & Night Theme Toggle Button */}
                <button
                  onClick={handleToggleTheme}
                  title={dark ? "Switch to Day (Light Mode)" : "Switch to Night (Dark Mode)"}
                  aria-label={dark ? "Switch to Day (Light Mode)" : "Switch to Night (Dark Mode)"}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                    dark 
                      ? "bg-[#121826] border-[#1e293b] text-[#f1f5f9] hover:border-[#cca45f]/40 shadow-sm" 
                      : "bg-white border-[#eee6da] text-[#1c1917] hover:border-[#a07432]/40 shadow-sm"
                  }`}
                >
                  {dark ? (
                    <Moon size={13} className="text-[#cca45f]" />
                  ) : (
                    <Sun size={13} className="text-amber-500" />
                  )}
                  <span className="text-[10px] font-bold tracking-widest uppercase font-mono">
                    {dark ? "NIGHT" : "DAY"}
                  </span>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                    dark ? "bg-[#090d16] justify-end" : "bg-[#ede5d8] justify-start"
                  }`}>
                    <div className={`w-3 h-3 rounded-full shadow transition-transform ${
                      dark ? "bg-[#cca45f]" : "bg-[#b88a44]"
                    }`} />
                  </div>
                </button>

                <button
                  onClick={() => void load()}
                  title="Refresh projects"
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                    dark ? "border-white/10 text-slate-400 hover:text-white hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <RefreshCw size={15} className={loading ? "animate-spin text-indigo-400" : ""} />
                </button>

                {/* Mobile tab buttons */}
                <div className="flex md:hidden items-center gap-1">
                  {navigationItems.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => {
                        setActiveTab(it.id as any);
                        setSelected(null);
                      }}
                      className={`p-2 rounded-xl border ${
                        activeTab === it.id
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : (dark ? "border-white/10 text-slate-400 hover:text-white" : "border-slate-200 text-slate-600 hover:bg-slate-100")
                      }`}
                    >
                      <it.icon size={16} />
                    </button>
                  ))}
                </div>
              </div>
            </header>

            {/* CONTENT AREA */}
            <main className={`flex-1 h-full overflow-y-auto p-6 lg:p-8 space-y-6 ${bgMain}`}>
              {renderTabContent()}
            </main>
          </div>
        </div>
      );
    }
