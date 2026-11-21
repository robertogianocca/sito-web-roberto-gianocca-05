"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ArchiveHeader } from "./ArchiveHeader";
import { ArchiveTable } from "./ArchiveTable";
import { ProjectDrawer } from "./ProjectDrawer";
import { SettingsDrawer } from "./SettingsDrawer";
import { formatProjectId } from "./archiveStatus";
import {
  EMPTY_FILTERS,
  availableYears,
  defaultSortDir,
  driveUsageSummary,
  filterProjects,
  sortProjects,
} from "./archiveFilters";
import { useStudioData } from "@/components/studio/StudioDataProvider";
import { apiFetch } from "@/components/studio/api";

export function ArchiveShell() {
  const {
    projects,
    setProjects,
    clients,
    setClients,
    settings,
    setSettings,
    projectsLoading,
    refreshProjects,
  } = useStudioData();

  const [error, setError] = useState(null);
  const loading = projectsLoading;

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState("projectId");
  const [sortDir, setSortDir] = useState("asc");

  const setFilter = (key) => (value) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Background refresh if we arrived with empty cache
    if (projects.length === 0) {
      refreshProjects().catch((err) => setError(err.message));
    } else {
      refreshProjects({ silent: true }).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once on mount

  const years = useMemo(() => availableYears(projects), [projects]);
  const shown = useMemo(
    () => sortProjects(filterProjects(projects, filters), sortKey, sortDir),
    [projects, filters, sortKey, sortDir]
  );
  const driveUsage = useMemo(
    () => driveUsageSummary(shown, filters.archiveDrive, settings.driveCapacities),
    [shown, filters.archiveDrive, settings.driveCapacities]
  );

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
    const isUpdate = Boolean(payload.id);

    // New clients/types/drives typed in the form are added to the lists by
    // the server, in the same transaction as the project.
    const knownTypes = settings.projectTypes ?? [];
    const knownDrives = settings.archiveDrives ?? [];
    const addsToLists =
      (payload.client ?? []).some((name) => name && !clients.includes(name)) ||
      (payload.type ?? []).some((name) => name && !knownTypes.includes(name)) ||
      [...(payload.archiveDrive ?? []), ...(payload.backupDrive ?? [])].some(
        (name) => name && !knownDrives.includes(name)
      );

    // Errors are shown inside the drawer (ProjectDrawer catches them).
    const saved = await apiFetch(isUpdate ? `/api/archive/${payload.id}` : "/api/archive", {
      method: isUpdate ? "PATCH" : "POST",
      body: payload,
      fallbackMessage: isUpdate ? "Failed to update project." : "Failed to create project.",
    });
    setProjects((prev) =>
      isUpdate ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved]
    );

    if (addsToLists) {
      // The project is saved; a failed refresh of the lists only means they
      // show up after the next reload.
      const [nextClients, nextSettings] = await Promise.all([
        apiFetch("/api/archive/clients").catch(() => null),
        apiFetch("/api/archive/settings").catch(() => null),
      ]);
      if (nextClients) setClients(nextClients);
      if (nextSettings) setSettings(nextSettings);
    }
  }, [clients, settings, setClients, setSettings, setProjects]);

  const handleDelete = useCallback(async (id) => {
    await apiFetch(`/api/archive/${id}`, {
      method: "DELETE",
      fallbackMessage: "Failed to delete project.",
    });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, [setProjects]);

  const handleSettingsSaved = useCallback(async (newSettings, newClients) => {
    setSettings(newSettings);
    setClients(newClients);
    try {
      await refreshProjects({ silent: true });
    } catch {
      // ignore refetch errors
    }
  }, [setSettings, setClients, refreshProjects]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ArchiveHeader
        loading={loading}
        shownCount={shown.length}
        totalCount={projects.length}
        filters={filters}
        setFilter={setFilter}
        onClearFilters={() => setFilters(EMPTY_FILTERS)}
        projectTypes={settings.projectTypes}
        archiveDrives={settings.archiveDrives}
        availableYears={years}
        driveUsage={driveUsage}
        onOpenSettings={() => setSettingsOpen(true)}
        onNew={openNew}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortKey={(key) => {
          setSortKey(key);
          setSortDir(defaultSortDir(key));
        }}
        onToggleSortDir={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
      />

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
            projects={shown}
            onEdit={openEdit}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(key) => {
              if (key === sortKey) {
                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
              } else {
                setSortKey(key);
                setSortDir(defaultSortDir(key));
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
