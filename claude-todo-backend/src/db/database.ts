import Database from "better-sqlite3";
import path from "path";
import { runMigrations } from "./migrations.js";

const DB_PATH = process.env.DB_PATH ?? path.resolve(process.cwd(), "todo.db");

class DatabaseService {
  readonly db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("journal_mode = WAL");
    runMigrations(this.db);
  }
}

export const databaseService = new DatabaseService();
export const db: InstanceType<typeof Database> = databaseService.db;
