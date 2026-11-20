"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "@/components/studio/api";

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
      const data = await apiFetch("/api/archive", {
        fallbackMessage: "Failed to load projects.",
      });
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
