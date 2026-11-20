import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { config } from '../config.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

// Register
router.post('/register', (req, res) => {
  const { email, password, name, role = 'USER', phone, companyName } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const validRoles = ['USER', 'ORGANIZER', 'PROMOTER', 'SPONSOR', 'ADMIN'];
  const userRole = validRoles.includes(role.toUpperCase()) ? role.toUpperCase() : 'USER';
  const passwordHash = bcrypt.hashSync(password, 10);
  const userId = `usr_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, phone, company_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, email.toLowerCase().trim(), passwordHash, name.trim(), userRole, phone || null, companyName || null);

  // If registering as promoter, initialize promoter_stats
  if (userRole === 'PROMOTER') {
    const code = `AXS${Math.floor(1000 + Math.random() * 9000)}`;
    db.prepare(`
      INSERT INTO promoter_stats (id, promoter_id, referral_code)
      VALUES (?, ?, ?)
    `).run(uuidv4(), userId, code);
  }

  const user = db.prepare('SELECT id, email, name, role, phone, company_name FROM users WHERE id = ?').get(userId);
  const token = createToken(user);

  res.status(201).json({
    message: 'Account created successfully',
    token,
    user
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    company_name: user.company_name
  };

  const token = createToken(safeUser);

  res.json({
    message: 'Login successful',
    token,
    user: safeUser
  });
});

// Switch role (Demo helper for instant previewing of different role dashboards)
router.post('/switch-role', (req, res) => {
  const { role } = req.body;
  const validRoles = ['USER', 'ORGANIZER', 'PROMOTER', 'SPONSOR', 'ADMIN'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }

  // Find sample user for this role
  const user = db.prepare('SELECT id, email, name, role, phone, company_name FROM users WHERE role = ? LIMIT 1').get(role);

  if (!user) {
    return res.status(404).json({ error: `No seeded user found for role: ${role}` });
  }

  const token = createToken(user);

  res.json({
    message: `Switched active role session to ${role}`,
    token,
    user
  });
});

// Current user profile
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Demo accounts metadata
router.get('/demo-accounts', (req, res) => {
  res.json({
    accounts: [
      { role: 'USER', label: 'Attendee (User)', email: 'attendee@axess.zone', password: 'axess123', name: 'Arjun Patel' },
      { role: 'ORGANIZER', label: 'Event Organiser', email: 'organizer@axess.zone', password: 'axess123', name: 'Temple Twister Records' },
      { role: 'PROMOTER', label: 'Promoter Partner', email: 'promoter@axess.zone', password: 'axess123', name: 'RaveConnect Goa' },
      { role: 'SPONSOR', label: 'Brand Sponsor', email: 'sponsor@axess.zone', password: 'axess123', name: 'Void Acoustics India' },
      { role: 'ADMIN', label: 'Platform Admin', email: 'admin@axess.zone', password: 'axess123', name: 'Axess Operations' },
    ]
  });
});

export default router;
