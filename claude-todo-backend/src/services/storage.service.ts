import fs from "fs";
import path from "path";
import type { DbSchema } from "../types/index.js";
 
const DB_PATH = path.resolve(process.cwd(), "db.json");
 
const DEFAULT_DB: DbSchema = {
  todos: [],
  tags: [],
  version: 1,
};
 
class StorageService {
  private data: DbSchema;
 
  constructor() {
    this.data = this.load();
  }
 
  // ── Private ──────────────────────────────────────────────────────────────
 
  private load(): DbSchema {
    try {
      if (!fs.existsSync(DB_PATH)) {
        this.persist(DEFAULT_DB);
        return structuredClone(DEFAULT_DB);
      }
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(raw) as DbSchema;
    } catch {
      console.error("[StorageService] Failed to load db.json, using default.");
      return structuredClone(DEFAULT_DB);
    }
  }
 
  private persist(data: DbSchema): void {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  }
 
  // ── Public Read ───────────────────────────────────────────────────────────
 
  getDb(): DbSchema {
    return structuredClone(this.data);
  }
 
  // ── Public Write ──────────────────────────────────────────────────────────
 
  save(data: DbSchema): void {
    this.data = structuredClone(data);
    this.persist(this.data);
  }
}
 
// Singleton — share one instance across the app
export const storageService = new StorageService();