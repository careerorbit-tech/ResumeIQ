// ─── Plain TypeScript Types ───────────────────────────────────────────────────
// This project does NOT use a database. These are plain TypeScript interfaces
// kept for backward compatibility with any code that imports from this file.

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface InsertUser {
  username: string;
  password: string;
}
