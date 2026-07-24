import Database from 'better-sqlite3';

for (const path of ['./dev.db', './prisma/dev.db']) {
  console.log('\n--- ' + path + ' ---');
  try {
    const db = new Database(path);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables.map(t => t.name).join(', '));
    if (tables.some(t => t.name === 'SystemConfig')) {
      const rows = db.prepare('SELECT key, value FROM "SystemConfig"').all();
      console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
  } catch(e) {
    console.log('Error:', e.message);
  }
}
