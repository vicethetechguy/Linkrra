import { Router } from 'express';
import { supabase } from '../database.js';

const router = Router();

// Get analytics overview for a business
router.get('/overview', async (req, res) => {
  try {
    const businessId = req.businessId;
    
    // Fetch all analytics for the business
    const { data: events, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('business_id', businessId);
      
    if (error) throw error;
    
    const allEvents = events || [];
    
    // 1. Total views and clicks
    let totalViews = 0;
    let totalClicks = 0;
    allEvents.forEach(e => {
      if (e.event_type === 'view') totalViews++;
      else if (e.event_type === 'click') totalClicks++;
    });
    
    // 2. Daily views for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const dailyMap = {};
    allEvents.forEach(e => {
      if (e.event_type === 'view' && e.created_at) {
        const date = new Date(e.created_at);
        if (date >= sevenDaysAgo) {
          const dayStr = date.toISOString().slice(0, 10);
          dailyMap[dayStr] = (dailyMap[dayStr] || 0) + 1;
        }
      }
    });
    
    const dailyData = Object.keys(dailyMap)
      .sort()
      .map(day => ({
        day,
        count: dailyMap[day]
      }));
      
    // 3. Top links (clicks with element_id)
    const linksMap = {};
    allEvents.forEach(e => {
      if (e.event_type === 'click' && e.element_id) {
        linksMap[e.element_id] = (linksMap[e.element_id] || 0) + 1;
      }
    });
    
    const topLinks = Object.keys(linksMap)
      .map(linkId => ({
        link_id: linkId,
        clicks: linksMap[linkId]
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    res.json({
      summary: { total_views: totalViews, total_clicks: totalClicks },
      daily: dailyData,
      topLinks: topLinks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Track an event (Public)
router.post('/track', async (req, res) => {
  try {
    const { businessId, type, elementId, device, country, referrer } = req.body;
    
    if (!businessId || !type) {
      return res.status(400).json({ error: 'BusinessId and Type required' });
    }

    const { error } = await supabase
      .from('analytics')
      .insert({
        business_id: businessId,
        event_type: type,
        element_id: elementId || null,
        device: device || null,
        country: country || null,
        referrer: referrer || null
      });

    if (error) throw error;
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
