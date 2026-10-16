import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));

// These fixtures create mock auth objects. Never target a linked Supabase project.
if (!['127.0.0.1', 'localhost', '::1'].includes(process.env.PGHOST) || process.env.PGDATABASE !== 'mgzavri_test') {
  console.error('Use a disposable local PostgreSQL database: PGHOST=127.0.0.1 PGDATABASE=mgzavri_test. Hosted projects are refused.');
  process.exit(1);
}

const files = [
  'supabase/tests/bootstrap.sql',
  ...readdirSync(path.join(root, 'supabase/migrations')).filter((name) => name.endsWith('.sql')).sort().map((name) => `supabase/migrations/${name}`),
  'supabase/tests/security.sql',
  'supabase/tests/launch.sql',
];
for (const file of files) {
  console.log(`Checking ${file}`);
  const result = spawnSync('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-f', path.join(root, file)], { stdio: 'inherit', cwd: root });
  if (result.error) { console.error(result.error.message); process.exit(1); }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Database migration and access-control tests passed.');
