import { Router } from 'express';
import { supabase } from '../database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('business_id', req.businessId)
      .maybeSingle();
      
    if (error) throw error;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { title, bio, avatar_url, banner_url, layout_type, title_style } = req.body;
    
    const { data: existing, error: existError } = await supabase
      .from('profiles')
      .select('*')
      .eq('business_id', req.businessId)
      .maybeSingle();
      
    if (existError) throw existError;
    if (!existing) return res.status(404).json({ error: 'Profile not found' });
  
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({
        title: title !== undefined ? title : existing.title,
        bio: bio !== undefined ? bio : existing.bio,
        avatar_url: avatar_url !== undefined ? avatar_url : existing.avatar_url,
        banner_url: banner_url !== undefined ? banner_url : existing.banner_url,
        layout_type: layout_type !== undefined ? layout_type : existing.layout_type,
        title_style: title_style !== undefined ? title_style : existing.title_style
      })
      .eq('business_id', req.businessId)
      .select()
      .single();
  
    if (updateError) throw updateError;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
