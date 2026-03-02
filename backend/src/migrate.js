const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';
  const database = process.env.DB_NAME || 'seguimiento_v2';

  console.log('Connecting to DB', { host, user, database });
  const conn = await mysql.createConnection({ host, user, password, multipleStatements: true });

  for (const f of files) {
    const p = path.join(dir, f);
    console.log('Running migration', f);
    const sql = fs.readFileSync(p, 'utf8');
    try {
      await conn.query(sql);
      console.log('Applied', f);
    } catch (err) {
      console.error('Error applying', f, err.message);
      await conn.end();
      process.exit(1);
    }
  }

  await conn.end();
  console.log('All migrations applied');
}

run().catch(err => { console.error(err); process.exit(1); });
