import { Router } from 'express';
import { supabase } from '../database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('business_id', req.businessId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(posts || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .eq('business_id', req.businessId)
      .maybeSingle();
      
    if (error) throw error;
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, excerpt, image_url, is_published } = req.body;
    
    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert({
        user_id: req.userId,
        business_id: req.businessId,
        title: title || '',
        content: content || '',
        excerpt: excerpt || '',
        image_url: image_url || '',
        is_published: is_published ? 1 : 0
      })
      .select()
      .single();
      
    if (error) throw error;
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, content, excerpt, image_url, is_published } = req.body;
    
    const { data: existing, error: existError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .eq('business_id', req.businessId)
      .maybeSingle();
      
    if (existError) throw existError;
    if (!existing) return res.status(404).json({ error: 'Post not found' });

    const { data: post, error: updateError } = await supabase
      .from('blog_posts')
      .update({
        title: title !== undefined ? title : existing.title,
        content: content !== undefined ? content : existing.content,
        excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
        image_url: image_url !== undefined ? image_url : existing.image_url,
        is_published: is_published !== undefined ? (is_published ? 1 : 0) : existing.is_published,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (updateError) throw updateError;
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    const { data: existing, error: existError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .eq('business_id', req.businessId)
      .maybeSingle();
      
    if (existError) throw existError;
    if (!existing) return res.status(404).json({ error: 'Post not found' });
    
    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);
      
    if (deleteError) throw deleteError;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
