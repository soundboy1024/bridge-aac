/**
 * Loads ./.env (next to package.json) into process.env if present, without a
 * dependency. Import this first in entry points (server, cli, evals).
 * Existing environment variables win over the file.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", ".env");
if (fs.existsSync(envPath)) {
  const before = new Set(Object.keys(process.env));
  process.loadEnvFile(envPath);
  // loadEnvFile does not override existing vars, so nothing else to do; keep `before` for debugging.
  void before;
}
