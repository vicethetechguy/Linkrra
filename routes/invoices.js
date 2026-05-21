import { Router } from 'express';
import { supabase } from '../database.js';

const router = Router();

// Helper to safely parse JSONB or string values
function parseJsonField(field, defaultValue) {
  if (!field) return defaultValue;
  if (typeof field === 'object') return field;
  try {
    return JSON.parse(field);
  } catch (e) {
    return defaultValue;
  }
}

// Get all invoices for business
router.get('/', async (req, res) => {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('business_id', req.businessId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    const parsed = (invoices || []).map(inv => ({
      ...inv,
      business: parseJsonField(inv.business_data, {}),
      client: parseJsonField(inv.client_data, {}),
      items: parseJsonField(inv.items_data, [])
    }));
    
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single invoice
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('business_id', req.businessId)
      .maybeSingle();
      
    if (error) throw error;
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    res.json({
      ...invoice,
      business: parseJsonField(invoice.business_data, {}),
      client: parseJsonField(invoice.client_data, {}),
      items: parseJsonField(invoice.items_data, [])
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create invoice
router.post('/', async (req, res) => {
  try {
    const { invoice_number, invoice_date, due_date, business, client, items, total, notes, template } = req.body;
    
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        user_id: req.userId,
        business_id: req.businessId,
        invoice_number: invoice_number || '',
        invoice_date: invoice_date || '',
        due_date: due_date || '',
        business_data: business || {},
        client_data: client || {},
        items_data: items || [],
        total: Number(total) || 0.0,
        notes: notes || '',
        template: template || 'classic',
        status: 'draft'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    res.status(201).json({
      ...invoice,
      business: business || {},
      client: client || {},
      items: items || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data: invoice, error: existError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('business_id', req.businessId)
      .maybeSingle();
      
    if (existError) throw existError;
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    const { invoice_number, invoice_date, due_date, business, client, items, total, notes, template } = req.body;
    
    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update({
        invoice_number: invoice_number !== undefined ? invoice_number : invoice.invoice_number,
        invoice_date: invoice_date !== undefined ? invoice_date : invoice.invoice_date,
        due_date: due_date !== undefined ? due_date : invoice.due_date,
        business_data: business !== undefined ? business : invoice.business_data,
        client_data: client !== undefined ? client : invoice.client_data,
        items_data: items !== undefined ? items : invoice.items_data,
        total: total !== undefined ? Number(total) : invoice.total,
        notes: notes !== undefined ? notes : invoice.notes,
        template: template !== undefined ? template : invoice.template,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (updateError) throw updateError;
    
    res.json({
      ...updated,
      business: parseJsonField(updated.business_data, {}),
      client: parseJsonField(updated.client_data, {}),
      items: parseJsonField(updated.items_data, [])
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data: invoice, error: existError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('business_id', req.businessId)
      .maybeSingle();
      
    if (existError) throw existError;
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
      
    if (deleteError) throw deleteError;
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
