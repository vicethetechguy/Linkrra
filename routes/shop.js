import { Router } from 'express';
import { supabase } from '../database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('shop_items')
      .select('*')
      .eq('business_id', req.businessId)
      .order('id', { ascending: false });
      
    if (error) throw error;
    res.json(items || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, price, image_url, description } = req.body;
    
    const { data: item, error } = await supabase
      .from('shop_items')
      .insert({
        user_id: req.userId,
        business_id: req.businessId,
        name: name || 'Product',
        price: Number(price) || 0.0,
        image_url: image_url || '',
        description: description || '',
        is_active: 1
      })
      .select()
      .single();
      
    if (error) throw error;
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, price, image_url, description, is_active } = req.body;
    const id = Number(req.params.id);
    
    const { data: existing, error: existError } = await supabase
      .from('shop_items')
      .select('*')
      .eq('id', id)
      .eq('business_id', req.businessId)
      .maybeSingle();
      
    if (existError) throw existError;
    if (!existing) return res.status(404).json({ error: 'Item not found' });
  
    const { data: updated, error: updateError } = await supabase
      .from('shop_items')
      .update({
        name: name !== undefined ? name : existing.name,
        price: price !== undefined ? Number(price) : existing.price,
        image_url: image_url !== undefined ? image_url : existing.image_url,
        description: description !== undefined ? description : existing.description,
        is_active: is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active
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
      .from('shop_items')
      .select('*')
      .eq('id', id)
      .eq('business_id', req.businessId)
      .maybeSingle();
      
    if (existError) throw existError;
    if (!existing) return res.status(404).json({ error: 'Item not found' });
    
    const { error: deleteError } = await supabase
      .from('shop_items')
      .delete()
      .eq('id', id);
      
    if (deleteError) throw deleteError;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
