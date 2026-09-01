import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BriefcaseBusiness, CalendarDays, Code2, FolderKanban, LogOut, Plus, RefreshCw, Send, Trash2, Users } from "lucide-react";
import { apiFetch } from "../lib/api";

type Developer = { id: string; name: string; email: string; assigned_projects?: number; completed_projects?: number; active_projects?: number; average_progress?: number | string; last_activity_at?: string | null };
type Project = { id: string; name: string; client_name: string | null; description: string | null; status: string; priority: string; due_date: string | null; progress?: number | string; assigned_developer_id: string; developer_name?: string };
type Update = { id: string; message: string; progress: number; author_name?: string; created_at: string };

export default function DeveloperWorkspace({ admin = false, onLogout }: { admin?: boolean; onLogout?: () => void }) {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeDeveloperId, setActiveDeveloperId] = useState<string | null>(null);
  const [projectStatusFilter, setProjectStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<Project | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<"" | "developer" | "project" | "update">("");
  const [removingDeveloper, setRemovingDeveloper] = useState(false);
  const [developerForm, setDeveloperForm] = useState({ name: "", email: "", password: "" });
  const [projectForm, setProjectForm] = useState({ name: "", clientName: "", description: "", priority: "MEDIUM", dueDate: "", assignedDeveloperId: "" });
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
      setNotice(error instanceof Error ? error.message : "Unable to reach the project service. Start the backend, then retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [admin]);

  const selectProject = async (project: Project) => {
    setSelected(project);
    setProgress(0);
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

  const createDeveloper = async () => {
    if (!developerForm.name.trim() || !developerForm.email.trim() || developerForm.password.length < 8) {
      setNotice("Enter a name, email, and temporary password with at least 8 characters.");
      return;
    }
    setSaving("developer");
    try {
      const response = await apiFetch("/api/developers", { method: "POST", body: JSON.stringify(developerForm) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setDevelopers(current => [data.data, ...current]);
      setDeveloperForm({ name: "", email: "", password: "" });
      setNotice("Developer account created. Share the temporary password securely.");
      void load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create developer");
    } finally {
      setSaving("");
    }
  };

  const createProject = async () => {
    if (!projectForm.name.trim() || !projectForm.assignedDeveloperId) {
      setNotice("Enter a project name and select the responsible developer.");
      return;
    }
    setSaving("project");
    try {
      const response = await apiFetch("/api/projects", { method: "POST", body: JSON.stringify(projectForm) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setProjects(current => [data.data, ...current]);
      setProjectForm({ name: "", clientName: "", description: "", priority: "MEDIUM", dueDate: "", assignedDeveloperId: "" });
      setNotice("Project assigned successfully and saved to the delivery workspace.");
      void load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to assign project");
    } finally {
      setSaving("");
    }
  };

  const addUpdate = async () => {
    if (!selected || !message.trim()) {
      setNotice("Write an update before saving it.");
      return;
    }
    setSaving("update");
    try {
      const response = await apiFetch(`/api/projects/${selected.id}/updates`, { method: "POST", body: JSON.stringify({ message, progress }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setUpdates(current => [data.data, ...current]);
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
    const developer = developers.find(item => item.id === activeDeveloperId);
    if (!developer || !window.confirm(`Remove ${developer.name}'s developer login? Developers with assigned projects must be reassigned first.`)) return;
    setRemovingDeveloper(true);
    try {
      const response = await apiFetch(`/api/developers/${developer.id}`, { method: "DELETE" });
      if (!response.ok) { const data = await response.json(); throw new Error(data.message || "Unable to remove developer"); }
      setNotice("Developer account removed.");
      selectDeveloper(null);
      void load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to remove developer"); }
    finally { setRemovingDeveloper(false); }
  };

  const updateProjectStatus = async (status: string) => {
    if (!selected) return;
    setSaving("update");
    try {
      const response = await apiFetch(`/api/projects/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update project status");
      const next = { ...selected, ...data.data, progress: selected.progress };
      setSelected(next); setProjects(current => current.map(project => project.id === next.id ? { ...project, ...next } : project));
      setNotice(`Project status changed to ${status.replace("_", " ")}.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to update project status"); }
    finally { setSaving(""); }
  };

  const input = "mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";
  const visibleProjects = projects.filter(project => (!activeDeveloperId || project.assigned_developer_id === activeDeveloperId) && (projectStatusFilter === "ALL" || project.status === projectStatusFilter));
  const selectDeveloper = (developerId: string | null) => { setActiveDeveloperId(developerId); setSelected(null); setUpdates([]); };

  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="mx-auto max-w-7xl space-y-6 p-4 lg:p-6">
    <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950 via-[#121936] to-cyan-950 p-6 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-indigo-200"><Code2 size={16}/> Product delivery workspace</div>
          <h1 className="text-3xl font-semibold tracking-tight">{admin ? "Developer Delivery Hub" : "My Project Workspace"}</h1>
          <p className="mt-2 text-sm text-slate-300">{admin ? "Create developer access, assign work, and monitor delivery." : "Keep project updates, progress and delivery notes in one place."}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-center"><div className="text-xl font-semibold">{projects.length}</div><div className="text-xs text-slate-300">{admin ? "projects" : "assigned"}</div></div>
          {admin && <div className="rounded-2xl bg-white/10 px-4 py-3 text-center"><div className="text-xl font-semibold">{developers.length}</div><div className="text-xs text-slate-300">developers</div></div>}
          <button aria-label="Refresh workspace" onClick={() => void load()} className="rounded-xl bg-white/10 p-3 transition hover:bg-white/20" title="Refresh workspace"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/></button>
          {onLogout && <button onClick={onLogout} className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2.5 text-sm font-semibold transition hover:bg-white/10"><LogOut size={15}/>Log out</button>}
        </div>
      </div>
    </div>
    {notice && <div role="status" className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">{notice}</div>}

    {admin && <div className="space-y-5">
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-slate-900"><Users size={18} className="text-indigo-600"/> Create developer login</div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <input className={input} placeholder="Developer name" value={developerForm.name} onChange={e => setDeveloperForm({ ...developerForm, name: e.target.value })}/>
          <input className={input} type="email" placeholder="Email" value={developerForm.email} onChange={e => setDeveloperForm({ ...developerForm, email: e.target.value })}/>
          <input className={input} type="password" minLength={8} placeholder="Temporary password" value={developerForm.password} onChange={e => setDeveloperForm({ ...developerForm, password: e.target.value })}/>
          <button disabled={saving === "developer"} onClick={() => void createDeveloper()} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{saving === "developer" ? "Creating…" : "Create developer"}</button>
        </div>
      </motion.section>
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-slate-900"><Plus size={18} className="text-indigo-600"/> Assign a project</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder="Project name" value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}/>
          <input className={input} placeholder="Client name" value={projectForm.clientName} onChange={e => setProjectForm({ ...projectForm, clientName: e.target.value })}/>
          <select className={input} value={projectForm.assignedDeveloperId} onChange={e => setProjectForm({ ...projectForm, assignedDeveloperId: e.target.value })}><option value="">Assign developer</option>{developers.map(developer => <option key={developer.id} value={developer.id}>{developer.name}</option>)}</select>
          <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-600">Due date</label><div className="mt-1 flex gap-2"><input ref={dueDateRef} aria-label="Project due date" className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" type="date" value={projectForm.dueDate} onChange={e => setProjectForm({ ...projectForm, dueDate: e.target.value })}/><button type="button" aria-label="Open due date calendar" onClick={() => { const picker = dueDateRef.current as (HTMLInputElement & { showPicker?: () => void }) | null; picker?.showPicker?.(); picker?.focus(); }} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-indigo-600 hover:bg-indigo-50"><CalendarDays size={17}/></button></div></div>
          <textarea className="sm:col-span-2 mt-1 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800" placeholder="Scope, deliverables and non-secret access notes" value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}/>
        </div>
        <p className="mt-2 text-xs text-slate-500">Do not add client passwords or API keys here. Project secrets belong in a dedicated encrypted vault.</p>
        <button disabled={saving === "project"} onClick={() => void createProject()} className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving === "project" ? "Assigning…" : "Assign project"}</button>
      </motion.section>
    </div>}

    {admin && <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><div className="flex items-center gap-2 font-semibold text-slate-900"><Users size={18} className="text-indigo-600"/> Team delivery overview</div><p className="mt-1 text-sm text-slate-500">Select a developer and project status to see exactly what is assigned and how much is complete.</p></div><div className="flex flex-wrap gap-2"><select aria-label="Select developer overview" value={activeDeveloperId ?? ""} onChange={e => selectDeveloper(e.target.value || null)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"><option value="">All developers</option>{developers.map(developer => <option key={developer.id} value={developer.id}>{developer.name}</option>)}</select><select aria-label="Filter project status" value={projectStatusFilter} onChange={e => setProjectStatusFilter(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"><option value="ALL">All statuses</option><option value="NEW">New</option><option value="PENDING">Pending</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option></select></div></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {developers.map(developer => { const total = Number(developer.assigned_projects ?? 0); const completed = Number(developer.completed_projects ?? 0); const active = Number(developer.active_projects ?? 0); const completion = Number(developer.average_progress ?? 0); return <button key={developer.id} onClick={() => selectDeveloper(developer.id)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md ${activeDeveloperId === developer.id ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 bg-white"}`}><div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-slate-900">{developer.name}</div><div className="mt-1 truncate text-xs text-slate-500">{developer.email}</div></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{completion}% progress</span></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-slate-50 p-2"><div className="text-base font-semibold text-slate-900">{total}</div><div className="text-[10px] uppercase tracking-wide text-slate-500">Assigned</div></div><div className="rounded-xl bg-blue-50 p-2"><div className="text-base font-semibold text-blue-700">{active}</div><div className="text-[10px] uppercase tracking-wide text-blue-600">Active</div></div><div className="rounded-xl bg-emerald-50 p-2"><div className="text-base font-semibold text-emerald-700">{completed}</div><div className="text-[10px] uppercase tracking-wide text-emerald-600">Done</div></div></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${completion}%` }}/></div><div className="mt-2 text-xs text-slate-400">{developer.last_activity_at ? `Last activity ${new Date(developer.last_activity_at).toLocaleDateString()}` : "No project activity yet"}</div></button>; })}
        {developers.length === 0 && !loading && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">Create a developer account to begin assigning and tracking delivery work.</div>}
      </div>
      {activeDeveloperId && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="text-sm text-slate-600">To preserve delivery history, reassign this developer’s projects before removing their account.</div><button disabled={removingDeveloper} onClick={() => void removeDeveloper()} className="flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"><Trash2 size={15}/>{removingDeveloper ? "Removing…" : "Remove selected developer"}</button></div>}
    </motion.section>}

    <div className="grid gap-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 font-semibold text-slate-900"><FolderKanban size={18} className="text-indigo-600"/>{admin ? activeDeveloperId ? `${developers.find(developer => developer.id === activeDeveloperId)?.name ?? "Developer"} — projects` : "All projects" : "My assignments"}</div>
        <div className="space-y-3">
          {loading && <div className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-500">Refreshing workspace…</div>}
          {visibleProjects.length === 0 && !loading && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">{activeDeveloperId ? "This developer has no assigned projects." : "No projects assigned yet."}</div>}
          {visibleProjects.map(project => { const projectProgress = Number(project.progress ?? (project.status === "COMPLETED" ? 100 : 0)); return <button key={project.id} onClick={() => void selectProject(project)} className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md ${selected?.id === project.id ? "border-indigo-400 bg-indigo-50" : "border-slate-200"}`}><div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-slate-900">{project.name}</div><div className="mt-1 text-xs text-slate-500">{project.client_name || "Internal project"} {project.developer_name ? `· ${project.developer_name}` : ""}</div></div><span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold text-indigo-700">{project.status.replace("_", " ")}</span></div><div className="mt-3 line-clamp-2 text-sm text-slate-600">{project.description || "No delivery brief added."}</div><div className="mt-3 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${projectProgress}%` }}/></div><span className="text-xs font-semibold text-slate-600">{projectProgress}% done</span></div></button>; })}
        </div>
      </section>
    </div>
  </motion.div>;
}
