import { Router } from 'express';
import { supabase } from '../database.js';

const router = Router();

// Get recent notifications for a business
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const businessId = req.businessId;
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (error) throw error;
    res.json(notifications || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read
router.put('/mark-read', async (req, res) => {
  try {
    const userId = req.userId;
    const businessId = req.businessId;
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: 1 })
      .eq('user_id', userId)
      .eq('business_id', businessId);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a notification
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const businessId = req.businessId;
    const { title, message, type } = req.body;
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        business_id: businessId,
        title,
        message,
        type: type || 'info',
        is_read: 0
      });
      
    if (error) throw error;
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
