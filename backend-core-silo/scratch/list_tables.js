
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres', host: 'localhost', database: 'school_silo_db', password: 'Haile', port: 5432,
});
async function listTables() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables:", res.rows.map(r => r.table_name).join(', '));
    
    // Also check silo_users columns
    const userRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'silo_users'");
    console.log("\nsilo_users Columns:", userRes.rows.map(r => r.column_name).join(', '));

    // Check a driver in silo_users
    const drvUser = await pool.query("SELECT * FROM silo_users WHERE username = 'DRV-3001'");
    console.log("\nDRV-3001 User:", JSON.stringify(drvUser.rows, null, 2));

  } catch (err) { console.error(err); } finally { await pool.end(); }
}
listTables();
