import { Router } from 'express';
import { supabase } from '../database.js';

const router = Router();

// Get all businesses for the user
router.get('/', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', req.userId);
      
    if (error) throw error;
    res.json(businesses || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new business
router.post('/', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Business name required' });

  try {
    // Insert business
    const { data: newBusiness, error: bizError } = await supabase
      .from('businesses')
      .insert({ user_id: req.userId, name })
      .select()
      .single();

    if (bizError) throw bizError;
    const businessId = newBusiness.id;

    // Create default profile for this business
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ user_id: req.userId, business_id: businessId, title: name });

    if (profileError) throw profileError;

    // Create default design settings for this business
    const { error: designError } = await supabase
      .from('design_settings')
      .insert({ user_id: req.userId, business_id: businessId });

    if (designError) throw designError;

    res.status(201).json(newBusiness);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a business name
router.put('/:id', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Business name required' });
  
  const id = parseInt(req.params.id);
  
  try {
    const { data: business, error: findError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (findError) throw findError;
    if (!business) return res.status(404).json({ error: 'Business not found' });
    
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ name })
      .eq('id', id);

    if (updateError) throw updateError;
    
    res.json({ success: true, id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
