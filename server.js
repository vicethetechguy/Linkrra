import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import jwt from 'jsonwebtoken';

import authRoutes from './api/auth.js';
import linksRoutes from './api/links.js';
import profileRoutes from './api/profile.js';
import designRoutes from './api/design.js';
import shopRoutes from './api/shop.js';
import blogRoutes from './api/blog.js';
import publicRoutes from './api/public.js';
import invoiceRoutes from './api/invoices.js';
import businessRoutes from './api/businesses.js';
import analyticsRoutes from './api/analytics.js';
import loyaltyRoutes from './api/loyalty.js';
import notificationRoutes from './api/notifications.js';
import socialRoutes from './api/social.js';
import { initDB, supabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'linkrra-secret-key-change-in-production';

// Middleware - increased limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Auth middleware
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
    } catch (e) { /* invalid token */ }
  }
  next();
});

function requireAuth(req, res, next) {
  if (!req.userId) return res.status(401).json({ error: 'Authentication required' });
  next();
}

async function requireBusiness(req, res, next) {
  const businessIdHeader = req.headers['x-business-id'];
  if (!businessIdHeader) return res.status(400).json({ error: 'X-Business-Id header required' });
  
  const businessId = parseInt(businessIdHeader);
  
  try {
    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .eq('user_id', req.userId)
      .maybeSingle();
      
    if (error || !business) {
      return res.status(403).json({ error: 'Invalid or unauthorized business' });
    }
    
    req.businessId = businessId;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', requireAuth, businessRoutes);
app.use('/api/links', requireAuth, requireBusiness, linksRoutes);
app.use('/api/profile', requireAuth, requireBusiness, profileRoutes);
app.use('/api/design', requireAuth, requireBusiness, designRoutes);
app.use('/api/shop', requireAuth, requireBusiness, shopRoutes);
app.use('/api/blog', requireAuth, requireBusiness, blogRoutes);
app.use('/api/invoices', requireAuth, requireBusiness, invoiceRoutes);
app.use('/api/analytics', requireAuth, requireBusiness, analyticsRoutes);
app.use('/api/loyalty', requireAuth, requireBusiness, loyaltyRoutes);
app.use('/api/notifications', requireAuth, requireBusiness, notificationRoutes);
app.use('/api/social', requireAuth, requireBusiness, socialRoutes);
app.use('/api/public', publicRoutes);

// Serve static files first
app.use(express.static(join(__dirname, 'public')));

// Serve user page for username routes (e.g., linkrra.com/my-business)
app.get('/:username', (req, res, next) => {
  // If it's an API call or looks like a file, skip to next handlers
  if (req.path.includes('.') || req.path.startsWith('/api')) return next();
  res.sendFile(join(__dirname, 'public', 'user.html'));
});

// SPA fallback (for dashboard routes like /links, /design, etc.)
// ONLY match if it doesn't look like an API or file
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  if (req.path.includes('.')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(join(__dirname, 'public', 'dashboard.html'));
});

// Start server after DB is ready
async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`\n  ⚡ Linkrra server running at http://localhost:${PORT}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
