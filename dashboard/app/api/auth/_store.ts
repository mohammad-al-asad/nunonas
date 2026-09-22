import { promises as fs } from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data", "auth.json");

export type AuthStore = {
  users: Array<{ email: string; password: string }>;
  resetCodes: Record<string, { code: string; issuedAt: string }>;
};

export async function readAuthStore(): Promise<AuthStore> {
  const raw = await fs.readFile(dataPath, "utf-8");
  return JSON.parse(raw) as AuthStore;
}

export async function writeAuthStore(data: AuthStore) {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}
