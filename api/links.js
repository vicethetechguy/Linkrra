import { Router } from 'express';
import { supabase } from '../database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data: links, error } = await supabase
      .from('links')
      .select('*')
      .eq('business_id', req.businessId)
      .order('position', { ascending: true });
      
    if (error) throw error;
    res.json(links || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, url, icon, type, image_url } = req.body;
    
    // Get max position to calculate next increment
    const { data: maxPosData, error: posError } = await supabase
      .from('links')
      .select('position')
      .eq('business_id', req.businessId)
      .order('position', { ascending: false })
      .limit(1);
      
    if (posError) throw posError;
    const position = ((maxPosData && maxPosData[0]?.position) || 0) + 1;
    
    const { data: link, error } = await supabase
      .from('links')
      .insert({
        user_id: req.userId,
        business_id: req.businessId,
        title: title || 'My Link',
        url: url || '',
        icon: icon || 'link',
        type: type || 'link',
        image_url: image_url || '',
        position
      })
      .select()
      .single();
      
    if (error) throw error;
    res.status(201).json(link);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, url, icon, type, position, is_active, image_url } = req.body;
    const id = Number(req.params.id);
    
    const { data: existing, error: existError } = await supabase
      .from('links')
      .select('*')
      .eq('id', id)
      .eq('business_id', req.businessId)
      .maybeSingle();
      
    if (existError) throw existError;
    if (!existing) return res.status(404).json({ error: 'Link not found' });
  
    const { data: updated, error: updateError } = await supabase
      .from('links')
      .update({
        title: title !== undefined ? title : existing.title,
        url: url !== undefined ? url : existing.url,
        icon: icon !== undefined ? icon : existing.icon,
        type: type !== undefined ? type : existing.type,
        position: position !== undefined ? position : existing.position,
        is_active: is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
        image_url: image_url !== undefined ? image_url : existing.image_url
      })
      .eq('id', id)
      .select()
      .single();
  
    if (updateError) throw updateError;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data: existing, error: existError } = await supabase
      .from('links')
      .select('*')
      .eq('id', id)
      .eq('business_id', req.businessId)
      .maybeSingle();
      
    if (existError) throw existError;
    if (!existing) return res.status(404).json({ error: 'Link not found' });
    
    const { error: deleteError } = await supabase
      .from('links')
      .delete()
      .eq('id', id);
      
    if (deleteError) throw deleteError;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
