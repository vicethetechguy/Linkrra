import { Router } from 'express';
import { supabase } from '../database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data: design, error } = await supabase
      .from('design_settings')
      .select('*')
      .eq('business_id', req.businessId)
      .maybeSingle();
      
    if (error) throw error;
    if (!design) return res.status(404).json({ error: 'Design settings not found' });
    
    // Maintain frontend string interface for settings_json if they expect string
    let settings = { ...design };
    if (settings.settings_json && typeof settings.settings_json === 'object') {
      settings.settings_json = JSON.stringify(settings.settings_json);
    }
    
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { theme, wallpaper, button_style, color_primary, color_bg, font, settings_json } = req.body;
    
    const { data: existing, error: existError } = await supabase
      .from('design_settings')
      .select('*')
      .eq('business_id', req.businessId)
      .maybeSingle();
      
    if (existError) throw existError;
    if (!existing) return res.status(404).json({ error: 'Design settings not found' });

    let parsedJson = settings_json;
    if (settings_json !== undefined) {
      if (typeof settings_json === 'string') {
        try {
          parsedJson = JSON.parse(settings_json);
        } catch (e) {
          parsedJson = {};
        }
      }
    } else {
      parsedJson = existing.settings_json;
    }
  
    const { data: updated, error: updateError } = await supabase
      .from('design_settings')
      .update({
        theme: theme !== undefined ? theme : existing.theme,
        wallpaper: wallpaper !== undefined ? wallpaper : existing.wallpaper,
        button_style: button_style !== undefined ? button_style : existing.button_style,
        color_primary: color_primary !== undefined ? color_primary : existing.color_primary,
        color_bg: color_bg !== undefined ? color_bg : existing.color_bg,
        font: font !== undefined ? font : existing.font,
        settings_json: parsedJson
      })
      .eq('business_id', req.businessId)
      .select()
      .single();
  
    if (updateError) throw updateError;
    
    // Output stringified for frontend consistency if needed
    let output = { ...updated };
    if (output.settings_json && typeof output.settings_json === 'object') {
      output.settings_json = JSON.stringify(output.settings_json);
    }
    
    res.json(output);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
