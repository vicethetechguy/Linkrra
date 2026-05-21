import { Router } from 'express';
import { supabase } from '../database.js';

const router = Router();

// Helper: Find profile and related details by username case-insensitively, ignoring spaces
async function findBusinessByUsername(username) {
  const normalizedUsername = username.toLowerCase().replace(/\s+/g, '');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*, business:business_id(*), user:user_id(plan)');
    
  if (error) throw error;
  
  const matched = (profiles || []).find(p => {
    const normalizedTitle = (p.title || '').toLowerCase().replace(/\s+/g, '');
    return normalizedTitle === normalizedUsername;
  });
  
  return matched || null;
}

// Get user by username and return profile
router.get('/:username/profile', async (req, res) => {
  try {
    const { username } = req.params;
    const profile = await findBusinessByUsername(username);
    
    if (!profile || !profile.business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    res.json({
      id: profile.user_id,
      business_id: profile.business_id,
      title: profile.title || 'User',
      bio: profile.bio || '',
      avatar_url: profile.avatar_url || '',
      banner_url: profile.banner_url || '',
      plan: (profile.user && profile.user.plan) || 'free'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get business's active links
router.get('/:username/links', async (req, res) => {
  try {
    const { username } = req.params;
    const profile = await findBusinessByUsername(username);
    
    if (!profile) return res.json([]);
    
    const { data: links, error } = await supabase
      .from('links')
      .select('*')
      .eq('business_id', profile.business_id)
      .eq('is_active', 1)
      .order('position', { ascending: true });
      
    if (error) throw error;
    res.json(links || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get business's shop items
router.get('/:username/shop', async (req, res) => {
  try {
    const { username } = req.params;
    const profile = await findBusinessByUsername(username);
    
    if (!profile) return res.json([]);
    
    const { data: items, error } = await supabase
      .from('shop_items')
      .select('*')
      .eq('business_id', profile.business_id)
      .eq('is_active', 1)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(items || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get business's design settings
router.get('/:username/design', async (req, res) => {
  try {
    const { username } = req.params;
    const profile = await findBusinessByUsername(username);
    
    if (!profile) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    const { data: design, error } = await supabase
      .from('design_settings')
      .select('*')
      .eq('business_id', profile.business_id)
      .maybeSingle();
      
    if (error) throw error;
    if (!design) return res.json({});
    
    // Ensure settings_json is returned as string for frontend compatibility if it's stored as JSONB object
    let settings = { ...design };
    if (settings.settings_json && typeof settings.settings_json === 'object') {
      settings.settings_json = JSON.stringify(settings.settings_json);
    }
    
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get business's blog posts
router.get('/:username/blog', async (req, res) => {
  try {
    const { username } = req.params;
    const profile = await findBusinessByUsername(username);
    
    if (!profile) return res.json([]);
    
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('business_id', profile.business_id)
      .eq('is_published', 1)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(posts || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
