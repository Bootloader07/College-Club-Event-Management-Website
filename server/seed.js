import 'dotenv/config';
import db from './db.js';
import bcrypt from 'bcryptjs';

// ── Admin seed ────────────────────────────────────────────────────────────────

const username = process.env.ADMIN_USERNAME ?? 'admin';
const password = process.env.ADMIN_PASSWORD ?? 'admin123';

const existingAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);

if (existingAdmin) {
  console.log(`ℹ️  Admin "${username}" already exists. Skipping.`);
} else {
  const hash = bcrypt.hashSync(password, 12);
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, hash);
  console.log('\n✅ Admin account created:');
  console.log(`   Username : ${username}`);
  console.log(`   Password : ${password}`);
  console.log('\n⚠️  Remember to change ADMIN_PASSWORD in .env before deploying!\n');
}

// ── Demo student seed ─────────────────────────────────────────────────────────

const demoEmail = 'demo@student.edu';
const existingDemo = db.prepare('SELECT id FROM students WHERE email = ?').get(demoEmail);

if (existingDemo) {
  console.log(`ℹ️  Demo student "${demoEmail}" already exists. Skipping.`);
} else {
  const demoHash = bcrypt.hashSync('demo123', 10);
  db.prepare(
    `INSERT INTO students (name, email, password_hash, college, year, phone)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run('Demo Student', demoEmail, demoHash, 'Demo College', '2nd Year', '9000000000');
  console.log('\n✅ Demo student account created:');
  console.log('   Email    : demo@student.edu');
  console.log('   Password : demo123\n');
}

process.exit(0);
