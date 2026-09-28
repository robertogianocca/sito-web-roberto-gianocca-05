"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const StudioDataContext = createContext(null);

export function StudioDataProvider({
  children,
  initialProjects = [],
  initialClients = [],
  initialSettings = {
    projectTypes: [],
    archiveDrives: [],
    driveCapacities: {},
  },
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [clients, setClients] = useState(initialClients);
  const [settings, setSettings] = useState(initialSettings);
  const [projectsLoading, setProjectsLoading] = useState(
    initialProjects.length === 0
  );

  const refreshProjects = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setProjectsLoading(true);
    try {
      const res = await fetch("/api/archive");
      if (!res.ok) throw new Error("Failed to load projects.");
      const data = await res.json();
      setProjects(data);
      return data;
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      projects,
      setProjects,
      clients,
      setClients,
      settings,
      setSettings,
      projectsLoading,
      refreshProjects,
    }),
    [
      projects,
      clients,
      settings,
      projectsLoading,
      refreshProjects,
    ]
  );

  return (
    <StudioDataContext.Provider value={value}>
      {children}
    </StudioDataContext.Provider>
  );
}

export function useStudioData() {
  const ctx = useContext(StudioDataContext);
  if (!ctx) {
    throw new Error("useStudioData must be used within StudioDataProvider");
  }
  return ctx;
}
