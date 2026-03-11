import { type User, type InsertUser } from "../shared/schema.js";
import { randomUUID } from "node:crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalysisRecord {
  id: string;
  timestamp: string;
  fileName: string | null;
  score: number;
  matchScore: number | null;
  resumeReport: any;
  matchReport: any;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Analysis History
  saveAnalysis(record: AnalysisRecord): Promise<void>;
  getAnalyses(): Promise<AnalysisRecord[]>;
  clearAnalyses(): Promise<void>;
}

// ─── In-Memory Implementation ─────────────────────────────────────────────────

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private analyses: AnalysisRecord[];
  private readonly MAX_HISTORY = 50;

  constructor() {
    this.users = new Map();
    this.analyses = [];
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveAnalysis(record: AnalysisRecord): Promise<void> {
    this.analyses.unshift(record);
    // Keep only the last MAX_HISTORY records
    if (this.analyses.length > this.MAX_HISTORY) {
      this.analyses = this.analyses.slice(0, this.MAX_HISTORY);
    }
  }

  async getAnalyses(): Promise<AnalysisRecord[]> {
    return this.analyses;
  }

  async clearAnalyses(): Promise<void> {
    this.analyses = [];
  }
}

export const storage = new MemStorage();
