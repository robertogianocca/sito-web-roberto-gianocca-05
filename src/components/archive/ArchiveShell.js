"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { ExportButton } from "./ExportButton";
import { StatusLegend } from "./StatusLegend";
import { ArchiveTable } from "./ArchiveTable";
import { ProjectDrawer } from "./ProjectDrawer";
import { SettingsDrawer } from "./SettingsDrawer";
import { getStatus, formatProjectId } from "./archiveStatus";
import { parseSize, formatBytes } from "@/lib/archiveSize";

function projectArchiveDrives(project) {
  if (Array.isArray(project.archiveDrive)) return project.archiveDrive;
  if (project.archiveDrive) return [project.archiveDrive];
  return [];
}

export function ArchiveShell({ initialSettings, initialClients, locale, logoutAction }) {
  const [settings, setSettings] = useState(
    initialSettings ?? { projectTypes: [], archiveDrives: [], driveCapacities: {} }
  );
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState(initialClients ?? []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterArchiveDrive, setFilterArchiveDrive] = useState("all");
  const [sortKey, setSortKey] = useState("projectId");
  const [sortDir, setSortDir] = useState("asc");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function fetchProjects() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/archive");
      if (!res.ok) throw new Error("Failed to load projects.");
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set(
      projects
        .map((p) => p.date?.match(/\d{4}/)?.[0])
        .filter(Boolean)
    );
    return [...years].sort((a, b) => b.localeCompare(a));
  }, [projects]);

  const filtered = useMemo(() => {
    let result = projects;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          (Array.isArray(p.client) ? p.client.some((c) => c.toLowerCase().includes(q)) : p.client?.toLowerCase().includes(q)) ||
          p.projectId?.toLowerCase().includes(q) ||
          formatProjectId(p.projectId).toLowerCase().includes(q) ||
          p.invoiceNumber?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filterType !== "all") {
      result = result.filter((p) =>
        Array.isArray(p.type) ? p.type.includes(filterType) : p.type === filterType
      );
    }

    if (filterYear !== "all") {
      result = result.filter((p) => p.date?.includes(filterYear));
    }

    if (filterStatus !== "all") {
      result = result.filter((p) => getStatus(p) === filterStatus);
    }

    if (filterArchiveDrive !== "all") {
      result = result.filter((p) =>
        Array.isArray(p.archiveDrive)
          ? p.archiveDrive.includes(filterArchiveDrive)
          : p.archiveDrive === filterArchiveDrive
      );
    }

    return [...result].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "cleaned") {
        return (Number(Boolean(a.cleaned)) - Number(Boolean(b.cleaned))) * dir;
      }
      if (sortKey === "backupType") {
        const order = { "": 0, export: 1, full: 2 };
        const av = order[a.backupType] ?? 0;
        const bv = order[b.backupType] ?? 0;
        return (av - bv) * dir;
      }
      const av = Array.isArray(a[sortKey])
        ? a[sortKey].join(", ")
        : sortKey === "projectId"
          ? formatProjectId(a.projectId)
          : (a[sortKey] ?? "");
      const bv = Array.isArray(b[sortKey])
        ? b[sortKey].join(", ")
        : sortKey === "projectId"
          ? formatProjectId(b.projectId)
          : (b[sortKey] ?? "");
      return String(av).localeCompare(String(bv), undefined, {
        numeric: true,
        sensitivity: "base",
      }) * dir;
    });
  }, [projects, search, filterType, filterYear, filterStatus, filterArchiveDrive, sortKey, sortDir]);

  const driveUsageSummary = useMemo(() => {
    if (filterArchiveDrive === "all") return null;

    let usedBytes = 0;
    for (const project of filtered) {
      const drives = projectArchiveDrives(project);
      if (drives.length === 1 && drives[0] === filterArchiveDrive) {
        usedBytes += parseSize(project.size);
      }
    }

    const capacityStr = settings.driveCapacities?.[filterArchiveDrive] ?? "";
    const capacityBytes = parseSize(capacityStr);
    const usedLabel = formatBytes(usedBytes);

    if (capacityBytes > 0) {
      const freeBytes = capacityBytes - usedBytes;
      if (freeBytes >= 0) {
        return `${filterArchiveDrive} · ${usedLabel} used · ${formatBytes(freeBytes)} free of ${formatBytes(capacityBytes)}`;
      }
      return `${filterArchiveDrive} · ${usedLabel} used · ${formatBytes(-freeBytes)} over ${formatBytes(capacityBytes)}`;
    }

    return `${filterArchiveDrive} · ${usedLabel} used · capacity not set`;
  }, [filterArchiveDrive, filtered, settings.driveCapacities]);

  const openNew = useCallback(() => {
    setEditingProject(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((project) => {
    setEditingProject(project);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingProject(null);
  }, []);

  const handleSave = useCallback(async (form) => {
    const payload = { ...form, projectId: formatProjectId(form.projectId) };

    const newClients = (Array.isArray(payload.client) ? payload.client : [])
      .filter((name) => name && !clients.includes(name));
    if (newClients.length > 0) {
      let updated = clients;
      for (const name of newClients) {
        const res = await fetch("/api/archive/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (res.ok) updated = await res.json();
      }
      setClients(updated);
    }

    const existingTypes = settings.projectTypes ?? [];
    const newTypes = (Array.isArray(payload.type) ? payload.type : [])
      .filter((name) => name && !existingTypes.includes(name));

    const existingDrives = settings.archiveDrives ?? [];
    const newDrives = (Array.isArray(payload.archiveDrive) ? payload.archiveDrive : [])
      .filter((name) => name && !existingDrives.includes(name));

    if (newTypes.length > 0 || newDrives.length > 0) {
      const nextSettings = {
        ...settings,
        projectTypes: [...existingTypes, ...newTypes],
        archiveDrives: [...existingDrives, ...newDrives],
      };
      const res = await fetch("/api/archive/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSettings),
      });
      if (res.ok) setSettings(await res.json());
    }

    if (payload.id) {
      const res = await fetch(`/api/archive/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update project.");
      const updated = await res.json();
      setProjects((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
    } else {
      const res = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create project.");
      const created = await res.json();
      setProjects((prev) => [...prev, created]);
    }
  }, [clients, settings]);

  const handleDelete = useCallback(async (id) => {
    const res = await fetch(`/api/archive/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete project.");
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleSettingsSaved = useCallback(async (newSettings, newClients) => {
    setSettings(newSettings);
    setClients(newClients);
    try {
      const res = await fetch("/api/archive");
      if (res.ok) setProjects(await res.json());
    } catch {
      // ignore refetch errors
    }
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-zinc-200 bg-background px-6 py-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">Archive</h1>
            {!loading && (
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                {filtered.length}
                {filtered.length !== projects.length
                  ? ` / ${projects.length}`
                  : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ExportButton />
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              title="Settings"
              aria-label="Open settings"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button
              onClick={openNew}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-zinc-50 transition hover:bg-zinc-700"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              New
            </button>
            <form action={logoutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
                title="Log out"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchBar value={search} onChange={setSearch} />
          <div className="flex-1">
            <FilterBar
              filterType={filterType}
              filterYear={filterYear}
              filterStatus={filterStatus}
              filterArchiveDrive={filterArchiveDrive}
              projectTypes={settings.projectTypes}
              archiveDrives={settings.archiveDrives}
              availableYears={availableYears}
              onFilterType={setFilterType}
              onFilterYear={setFilterYear}
              onFilterStatus={setFilterStatus}
              onFilterArchiveDrive={setFilterArchiveDrive}
            />
          </div>
        </div>

        {driveUsageSummary && (
          <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800">
            {driveUsageSummary}
          </p>
        )}

        <div className="mt-3">
          <StatusLegend />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-24 text-sm text-zinc-400">
            Loading…
          </div>
        )}
        {error && !loading && (
          <div className="flex items-center justify-center py-24 text-sm text-red-500">
            {error}
          </div>
        )}
        {!loading && !error && (
          <ArchiveTable
            projects={filtered}
            onEdit={openEdit}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(key) => {
              if (key === sortKey) {
                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
              } else {
                setSortKey(key);
                setSortDir(key === "date" ? "desc" : "asc");
              }
            }}
          />
        )}
      </main>

      <ProjectDrawer
        open={drawerOpen}
        project={editingProject}
        archiveDrives={settings.archiveDrives}
        projectTypes={settings.projectTypes}
        clients={clients}
        onClose={closeDrawer}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <SettingsDrawer
        open={settingsOpen}
        settings={settings}
        clients={clients}
        onClose={() => setSettingsOpen(false)}
        onSaved={handleSettingsSaved}
      />
    </div>
  );
}
