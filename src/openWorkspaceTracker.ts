import path from "node:path";
import vscode from "vscode";

interface OpenWorkspaceEntry {
  path: string;
  pid: number;
}

export function normalizePath(p: string): string {
  const resolved = path.resolve(p);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

const STORAGE_KEY = "openWorkspaces";

export default class OpenWorkspaceTracker {
  constructor(private globalState: vscode.Memento) {}

  register(workspacePath: string): void {
    const entries = this.getEntries().filter((e) => e.pid !== process.pid);
    entries.push({ path: normalizePath(workspacePath), pid: process.pid });
    this.globalState.update(STORAGE_KEY, entries);
  }

  unregister(): void {
    const entries = this.getEntries().filter((e) => e.pid !== process.pid);
    this.globalState.update(STORAGE_KEY, entries);
  }

  isOpen(workspacePath: string): boolean {
    return this.getOpenWorkspacePaths().has(normalizePath(workspacePath));
  }

  private getOpenWorkspacePaths(): Set<string> {
    const entries = this.getEntries();
    const alive = entries.filter((e) => isProcessRunning(e.pid));
    if (alive.length !== entries.length) {
      this.globalState.update(STORAGE_KEY, alive);
    }
    return new Set(alive.map((e) => e.path));
  }

  private getEntries(): OpenWorkspaceEntry[] {
    return this.globalState.get<OpenWorkspaceEntry[]>(STORAGE_KEY, []);
  }
}
