import { readFile, writeFile } from "fs/promises";
import path from "path";

const PROJECTS_PATH = path.join(process.cwd(), "src/data/archive/projects.json");
const CLIENTS_PATH = path.join(process.cwd(), "src/data/archive/clients.json");

export async function readProjects() {
  try {
    const text = await readFile(PROJECTS_PATH, "utf-8");
    return JSON.parse(text);
  } catch {
    return [];
  }
}

export async function writeProjects(projects) {
  await writeFile(PROJECTS_PATH, JSON.stringify(projects, null, 2), "utf-8");
}

export async function readClients() {
  try {
    const text = await readFile(CLIENTS_PATH, "utf-8");
    return JSON.parse(text);
  } catch {
    return [];
  }
}

export async function writeClients(clients) {
  await writeFile(CLIENTS_PATH, JSON.stringify(clients, null, 2), "utf-8");
}

export function generateId() {
  return `arc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
