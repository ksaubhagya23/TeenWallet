// Gives the seeded demo users a real password so you can log in as them.
// Run once after loading db/seed.sql:  npm run demo-passwords
const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');

(async () => {
  const hash = await bcrypt.hash('password123', 10);
  const r = await pool.query(`UPDATE users SET password_hash = $1 WHERE email IN ('parent@example.com', 'teen@example.com')`, [hash]);
  console.log(`Updated ${r.rowCount} users. Login with parent@example.com / teen@example.com and password: password123`);
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
