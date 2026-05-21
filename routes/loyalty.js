import { Router } from 'express';
import { supabase } from '../database.js';

const router = Router();

// Get loyalty settings for a business
router.get('/settings', async (req, res) => {
  try {
    const businessId = req.businessId;
    
    let { data: settings, error } = await supabase
      .from('loyalty_settings')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();
      
    if (error) throw error;
    
    if (!settings) {
      // Insert default settings
      const { data: newSettings, error: insertError } = await supabase
        .from('loyalty_settings')
        .insert({ business_id: businessId })
        .select()
        .single();
        
      if (insertError) throw insertError;
      settings = newSettings;
    }
    
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update loyalty settings
router.put('/settings', async (req, res) => {
  try {
    const businessId = req.businessId;
    const { is_enabled, points_per_naira, min_redeem_points, reward_description } = req.body;
    
    const { error } = await supabase
      .from('loyalty_settings')
      .update({
        is_enabled: is_enabled ? 1 : 0,
        points_per_naira: points_per_naira !== undefined ? Number(points_per_naira) : undefined,
        min_redeem_points: min_redeem_points !== undefined ? Number(min_redeem_points) : undefined,
        reward_description: reward_description !== undefined ? reward_description : undefined
      })
      .eq('business_id', businessId);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get customers for a business
router.get('/customers', async (req, res) => {
  try {
    const businessId = req.businessId;
    const { data: customers, error } = await supabase
      .from('loyalty_customers')
      .select('*')
      .eq('business_id', businessId)
      .order('points_balance', { ascending: false });
      
    if (error) throw error;
    res.json(customers || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add points to a customer
router.post('/add-points', async (req, res) => {
  try {
    const businessId = req.businessId;
    const { email, amountSpent } = req.body;
    
    if (!email || amountSpent === undefined) {
      return res.status(400).json({ error: 'Email and amountSpent are required' });
    }

    const { data: settings, error: settingsError } = await supabase
      .from('loyalty_settings')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();
      
    if (settingsError) throw settingsError;
    if (!settings || !settings.is_enabled) {
      return res.status(400).json({ error: 'Loyalty points system is disabled' });
    }

    const pointsToAdd = Math.floor(amountSpent * settings.points_per_naira);
    
    // Check if customer exists
    const { data: customer, error: customerError } = await supabase
      .from('loyalty_customers')
      .select('id, points_balance')
      .eq('business_id', businessId)
      .eq('customer_email', email)
      .maybeSingle();
      
    if (customerError) throw customerError;
    
    if (customer) {
      const { error: updateError } = await supabase
        .from('loyalty_customers')
        .update({
          points_balance: customer.points_balance + pointsToAdd,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id);
        
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('loyalty_customers')
        .insert({
          business_id: businessId,
          customer_email: email,
          points_balance: pointsToAdd
        });
        
      if (insertError) throw insertError;
    }

    res.json({ success: true, pointsAdded: pointsToAdd });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
