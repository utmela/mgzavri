const tables = ["auth.users", "public.profiles", "public.rides", "public.bookings", "public.requests"];
const identifier = (value) => `"${value.replaceAll('"', '""')}"`;

export async function restoreSnapshot(client, snapshot) {
  const target = await client.query("select current_database() as name,host(inet_server_addr()) as host");
  if (target.rows[0].name !== "mgzavri_restore_test" || !["127.0.0.1", "::1"].includes(target.rows[0].host)) throw new Error("Restore drills require an isolated local mgzavri_restore_test database.");
  if (snapshot.format !== "mgzavri-application-snapshot-v1" || !snapshot.tables) throw new Error("Invalid application snapshot.");
  for (const key of Object.keys(snapshot.tables)) if (!tables.includes(key)) throw new Error("Unexpected snapshot table.");
  for (const table of tables) {
    const [schema, name] = table.split(".");
    const count = await client.query(`select count(*)::integer as count from ${identifier(schema)}.${identifier(name)}`);
    if (count.rows[0].count !== 0) throw new Error("Refusing to restore into a nonempty database.");
  }
  await client.query("begin");
  try {
    // Only inside this guarded, disposable restore database. Avoid replaying
    // signup, rate-limit and audit side effects while restoring exact rows.
    await client.query("set local session_replication_role=replica");
    for (const table of tables) {
      const [schema, name] = table.split(".");
      const columns = await client.query("select column_name from information_schema.columns where table_schema=$1 and table_name=$2", [schema, name]);
      const allowed = new Set(columns.rows.map((column) => column.column_name));
      const rows = snapshot.tables[table] || [];
      if (!Array.isArray(rows)) throw new Error("Invalid snapshot rows.");
      for (const row of rows) {
        const keys = Object.keys(row);
        if (!keys.length || keys.some((key) => !allowed.has(key))) throw new Error("Snapshot schema does not match the restore schema.");
        await client.query(`insert into ${identifier(schema)}.${identifier(name)}(${keys.map(identifier).join(",")}) values(${keys.map((_, index) => `$${index + 1}`).join(",")})`, keys.map((key) => row[key]));
      }
    }
    const invalid = await client.query("select count(*)::integer as count from public.bookings b where not exists(select 1 from public.rides r where r.id=b.ride_id)");
    if (invalid.rows[0].count) throw new Error("Restored bookings reference missing trips.");
    for (const table of tables) {
      const [schema, name] = table.split(".");
      const restored = await client.query(`select count(*)::integer as count from ${identifier(schema)}.${identifier(name)}`);
      if (restored.rows[0].count !== (snapshot.tables[table]?.length || 0)) throw new Error("Restored row count does not match the snapshot.");
    }
    await client.query("commit");
  } catch (error) { await client.query("rollback"); throw error; }
}
