import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../database.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'linkrra-secret-key-change-in-production';

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, business_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Check if user already exists
    const { data: existing, error: existError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existError) throw existError;
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Hash password
    const hash = await bcrypt.hash(password, 12);

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({ email, password_hash: hash, business_name: business_name || '' })
      .select()
      .single();

    if (userError) throw userError;
    const userId = newUser.id;

    // Create first business
    const { data: newBusiness, error: bizError } = await supabase
      .from('businesses')
      .insert({ user_id: userId, name: business_name || 'My First Business' })
      .select()
      .single();

    if (bizError) throw bizError;
    const businessId = newBusiness.id;

    // Create default profile for this business
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        business_id: businessId,
        title: business_name || email.split('@')[0]
      });

    if (profileError) throw profileError;
    
    // Create default design settings for this business
    const { error: designError } = await supabase
      .from('design_settings')
      .insert({
        user_id: userId,
        business_id: businessId
      });

    if (designError) throw designError;

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: userId, email, business_name, firstBusinessId: businessId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, business_name: user.business_name, plan: user.plan } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, business_name, plan, created_at')
      .eq('id', req.userId)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upgrade plan (requires auth)
router.post('/upgrade', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });
  
  const { plan } = req.body;
  const validPlans = ['free', 'starter', 'pro', 'business'];
  
  if (!validPlans.includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }
  
  try {
    // Update user plan
    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({ plan })
      .eq('id', req.userId)
      .select('id, email, business_name, plan')
      .single();

    if (updateError) throw updateError;
    
    res.json({ success: true, plan: user.plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
