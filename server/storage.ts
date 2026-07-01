// ─── Types ────────────────────────────────────────────────────────────────────
// Plain TypeScript types — no database dependency required.
// This project does NOT persist any data.

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface InsertUser {
  username: string;
  password: string;
}

export interface AnalysisRecord {
  id: string;
  timestamp: string;
  fileName: string | null;
  score: number;
  matchScore: number | null;
  resumeReport: unknown;
  matchReport: unknown;
}

export interface IStorage {
  // Analysis History (in-memory only)
  saveAnalysis(record: AnalysisRecord): Promise<void>;
  getAnalyses(): Promise<AnalysisRecord[]>;
  clearAnalyses(): Promise<void>;
}

// ─── In-Memory Implementation ─────────────────────────────────────────────────
// Everything is in-memory and discarded when the serverless function completes.
// No database, no persistence, no user accounts.

export class MemStorage implements IStorage {
  private analyses: AnalysisRecord[];
  private readonly MAX_HISTORY = 50;

  constructor() {
    this.analyses = [];
  }

  async saveAnalysis(record: AnalysisRecord): Promise<void> {
    this.analyses.unshift(record);
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
