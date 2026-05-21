import { Router } from 'express';
import { supabase } from '../database.js';

const router = Router();

// Get scheduled posts
router.get('/posts', async (req, res) => {
  try {
    const businessId = req.businessId;
    
    const { data: posts, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('business_id', businessId)
      .order('scheduled_for', { ascending: true });
      
    if (error) throw error;
    res.json(posts || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Schedule a post
router.post('/posts', async (req, res) => {
  try {
    const userId = req.userId;
    const businessId = req.businessId;
    const { platform, content, media_url, scheduled_for } = req.body;
    
    if (!platform || !content) {
      return res.status(400).json({ error: 'Platform and content required' });
    }

    const { error } = await supabase
      .from('social_posts')
      .insert({
        user_id: userId,
        business_id: businessId,
        platform,
        content,
        media_url: media_url || null,
        scheduled_for: scheduled_for || null,
        status: 'scheduled'
      });

    if (error) throw error;
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
