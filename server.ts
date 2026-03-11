import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey_prestasi';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Setup SQLite
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'database.sqlite');
const db = new Database(dbPath);

// Init DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nis TEXT UNIQUE,
    name TEXT,
    class_name TEXT
  );
  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );
  CREATE TABLE IF NOT EXISTS homeroom_teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );
  CREATE TABLE IF NOT EXISTS counseling_teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    student_id INTEGER,
    achievement_type TEXT,
    competition_name TEXT,
    rank TEXT,
    level TEXT,
    certificate_file TEXT,
    homeroom_teacher TEXT,
    counseling_teacher TEXT,
    follow_up TEXT,
    FOREIGN KEY(student_id) REFERENCES students(id)
  );
`);

// Migration: add level column if not exists
try {
  db.prepare('ALTER TABLE transactions ADD COLUMN level TEXT').run();
} catch (e) {
  // Column might already exist
}

// Insert default admin if not exists
const hash = bcrypt.hashSync('admin123', 10);
const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (!admin) {
  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hash);
} else {
  db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hash, 'admin');
}

// Setup Multer for uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

// Middleware to verify JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API Routes

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Auth
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/change-password', authenticateToken, (req: any, res) => {
  const { newUsername, newPassword } = req.body;
  const hash = bcrypt.hashSync(newPassword, 10);
  try {
    db.prepare('UPDATE users SET username = ?, password = ? WHERE id = ?').run(newUsername, hash, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Username might already exist' });
  }
});

// Dashboard Stats
app.get('/api/dashboard', authenticateToken, (req, res) => {
  const chartGrade = req.query.chartGrade as string || 'All';
  const tableGrade = req.query.tableGrade as string || 'All';
  const tableLimit = parseInt(req.query.tableLimit as string) || 5;

  let chartGradeCondition = '';
  let chartParams: any[] = [];
  if (chartGrade !== 'All') {
    chartGradeCondition = 'WHERE s.class_name LIKE ?';
    chartParams.push(`${chartGrade}%`);
  }

  let tableGradeCondition = '';
  let tableParams: any[] = [];
  if (tableGrade !== 'All') {
    tableGradeCondition = 'WHERE s.class_name LIKE ?';
    tableParams.push(`${tableGrade}%`);
  }

  const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number };
  const totalTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number };
  
  const typeStats = db.prepare(`
    SELECT achievement_type, COUNT(*) as count 
    FROM transactions 
    GROUP BY achievement_type
  `).all();

  const topStudentsQuery = `
    SELECT s.name, s.class_name, COUNT(t.id) as achievement_count
    FROM students s
    JOIN transactions t ON s.id = t.student_id
    ${tableGradeCondition}
    GROUP BY s.id
    ORDER BY achievement_count DESC
    LIMIT ?
  `;
  const topStudents = db.prepare(topStudentsQuery).all(...tableParams, tableLimit);

  const classStatsQuery = `
    SELECT s.class_name, COUNT(DISTINCT s.id) as student_count, COUNT(t.id) as achievement_count
    FROM students s
    JOIN transactions t ON s.id = t.student_id
    ${chartGradeCondition}
    GROUP BY s.class_name
    ORDER BY s.class_name ASC
  `;
  const classStats = db.prepare(classStatsQuery).all(...chartParams);

  const classDetailsQuery = `
    SELECT s.class_name, s.name, COUNT(t.id) as achievement_count
    FROM students s
    JOIN transactions t ON s.id = t.student_id
    GROUP BY s.class_name, s.name
    ORDER BY s.class_name ASC, s.name ASC
  `;
  const classDetails = db.prepare(classDetailsQuery).all();

  res.json({
    totalStudents: totalStudents.count,
    totalTransactions: totalTransactions.count,
    typeStats,
    topStudents,
    classStats,
    classDetails
  });
});

// Students Master
app.get('/api/students', authenticateToken, (req, res) => {
  const students = db.prepare('SELECT * FROM students ORDER BY name ASC').all();
  res.json(students);
});

app.post('/api/students', authenticateToken, (req, res) => {
  const { nis, name, class_name } = req.body;
  try {
    const result = db.prepare('INSERT INTO students (nis, name, class_name) VALUES (?, ?, ?)').run(nis, name, class_name);
    res.json({ id: result.lastInsertRowid, nis, name, class_name });
  } catch (err) {
    res.status(400).json({ error: 'NIS might already exist' });
  }
});

app.post('/api/students/bulk', authenticateToken, (req, res) => {
  const { students } = req.body; // Array of { nis, name, class_name }
  const insert = db.prepare('INSERT INTO students (nis, name, class_name) VALUES (?, ?, ?)');
  const check = db.prepare('SELECT id FROM students WHERE name = ? AND class_name = ?');
  
  const insertMany = db.transaction((students) => {
    for (const student of students) {
      const existing = check.get(student.name, student.class_name);
      if (!existing) {
        try {
          insert.run(student.nis, student.name, student.class_name);
        } catch (err) {
          // Ignore unique constraint errors if nis happens to collide
        }
      }
    }
  });
  insertMany(students);
  res.json({ success: true });
});

app.delete('/api/students/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Homeroom Teachers Master
app.get('/api/homeroom_teachers', authenticateToken, (req, res) => {
  const teachers = db.prepare('SELECT * FROM homeroom_teachers ORDER BY name ASC').all();
  res.json(teachers);
});

app.post('/api/homeroom_teachers/bulk', authenticateToken, (req, res) => {
  const { teachers } = req.body; // Array of { name }
  const insert = db.prepare('INSERT INTO homeroom_teachers (name) VALUES (?)');
  const check = db.prepare('SELECT id FROM homeroom_teachers WHERE name = ?');
  
  const insertMany = db.transaction((teachers) => {
    for (const teacher of teachers) {
      const existing = check.get(teacher.name);
      if (!existing) {
        try {
          insert.run(teacher.name);
        } catch (err) {}
      }
    }
  });
  insertMany(teachers);
  res.json({ success: true });
});

app.delete('/api/homeroom_teachers/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM homeroom_teachers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Counseling Teachers Master
app.get('/api/counseling_teachers', authenticateToken, (req, res) => {
  const teachers = db.prepare('SELECT * FROM counseling_teachers ORDER BY name ASC').all();
  res.json(teachers);
});

app.post('/api/counseling_teachers/bulk', authenticateToken, (req, res) => {
  const { teachers } = req.body; // Array of { name }
  const insert = db.prepare('INSERT INTO counseling_teachers (name) VALUES (?)');
  const check = db.prepare('SELECT id FROM counseling_teachers WHERE name = ?');
  
  const insertMany = db.transaction((teachers) => {
    for (const teacher of teachers) {
      const existing = check.get(teacher.name);
      if (!existing) {
        try {
          insert.run(teacher.name);
        } catch (err) {}
      }
    }
  });
  insertMany(teachers);
  res.json({ success: true });
});

app.delete('/api/counseling_teachers/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM counseling_teachers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Transactions
app.get('/api/transactions', authenticateToken, (req, res) => {
  const transactions = db.prepare(`
    SELECT t.*, s.name as student_name, s.nis, s.class_name
    FROM transactions t
    JOIN students s ON t.student_id = s.id
    ORDER BY t.date DESC
  `).all();
  res.json(transactions);
});

app.post('/api/transactions', authenticateToken, upload.single('certificate'), (req, res) => {
  const { date, student_id, achievement_type, competition_name, rank, level, homeroom_teacher, counseling_teacher } = req.body;
  const certificate_file = req.file ? `/uploads/${req.file.filename}` : null;

  const result = db.prepare(`
    INSERT INTO transactions 
    (date, student_id, achievement_type, competition_name, rank, level, certificate_file, homeroom_teacher, counseling_teacher) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(date, student_id, achievement_type, competition_name, rank, level, certificate_file, homeroom_teacher, counseling_teacher);
  
  res.json({ id: result.lastInsertRowid });
});

app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.put('/api/transactions/:id', authenticateToken, upload.single('certificate'), (req, res) => {
  const { date, student_id, achievement_type, competition_name, rank, level, homeroom_teacher, counseling_teacher } = req.body;
  const id = req.params.id;
  
  if (req.file) {
    const certificate_file = `/uploads/${req.file.filename}`;
    db.prepare(`
      UPDATE transactions 
      SET date = ?, student_id = ?, achievement_type = ?, competition_name = ?, rank = ?, level = ?, certificate_file = ?, homeroom_teacher = ?, counseling_teacher = ?
      WHERE id = ?
    `).run(date, student_id, achievement_type, competition_name, rank, level, certificate_file, homeroom_teacher, counseling_teacher, id);
  } else {
    db.prepare(`
      UPDATE transactions 
      SET date = ?, student_id = ?, achievement_type = ?, competition_name = ?, rank = ?, level = ?, homeroom_teacher = ?, counseling_teacher = ?
      WHERE id = ?
    `).run(date, student_id, achievement_type, competition_name, rank, level, homeroom_teacher, counseling_teacher, id);
  }
  
  res.json({ success: true });
});

// Backup & Restore
app.get('/api/database/backup', authenticateToken, (req, res) => {
  res.download(dbPath, 'database.sqlite');
});

app.post('/api/database/restore', authenticateToken, upload.single('database'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  // Close current DB
  db.close();
  
  // Replace file
  fs.copyFileSync(req.file.path, dbPath);
  
  // Restart server or just re-open DB? Better to just let the process exit and restart, but we can't easily do that here.
  // Actually, we can just re-open the DB. But since we use a global db object, it's tricky.
  // Let's just send a success message and ask user to restart server manually, or we can re-instantiate.
  // For simplicity, we'll just copy and the next request will fail until server restarts, or we can re-init.
  // Let's re-init.
  // Actually, re-init is hard because `db` is const. Let's just exit process and let nodemon/tsx restart it.
  res.json({ success: true, message: 'Database restored. Server will restart.' });
  setTimeout(() => process.exit(0), 1000);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

export default app;
