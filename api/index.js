import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Supabase Connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;
let initError = null;

try {
    if (!supabaseUrl || !supabaseKey) {
        console.error('CRITICAL ERROR: SUPABASE_URL and SUPABASE_KEY are missing in environment.');
        initError = 'Missing environment variables';
    } else {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('Supabase client initialized');
    }
} catch (e) {
    console.error('Supabase Initialization Failed:', e.message);
    initError = e.message;
    supabase = null;
}

// Endpoint to debug environment variables (Safe: shows only presence)
app.get('/api/debug-env', (req, res) => {
    res.json({
        hasUrl: !!process.env.SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_KEY,
        nodeEnv: process.env.NODE_ENV,
        initError: initError,
        urlPreview: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 10) + '...' : 'N/A',
        keyPreview: process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY.substring(0, 5) + '...' : 'N/A',
        urlLength: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.length : 0
    });
});

// --- ROUTES ---

// Status Endpoint
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        version: '1.1',
        service: 'Supabase-Only Backend (Serverless)',
        timestamp: new Date().toISOString()
    });
});

// Helper to check DB connection
const checkDb = (res) => {
    if (!supabase) {
        res.status(500).json({
            error: 'Database connection failed',
            details: 'Supabase credentials missing in environment variables.'
        });
        return false;
    }
    return true;
};

// GET All Errors
app.get('/api/errors', async (req, res) => {
    if (!checkDb(res)) return;
    try {
        const { data, error } = await supabase
            .from('errors')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (GET /errors):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// GET All Categories
app.get('/api/categories', async (req, res) => {
    if (!checkDb(res)) return;
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*');

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (GET /categories):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// POST New Category
app.post('/api/categories', async (req, res) => {
    if (!checkDb(res)) return;
    const { name, color, icon } = req.body;
    const id = req.body.id || name.toLowerCase().replace(/[^a-z0-9]/g, '');

    const newCategory = { id, name, color, icon: icon || 'settings' };

    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([newCategory])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (e) {
        console.error('Supabase Error (POST /categories):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// PUT Update Category
app.put('/api/categories/:id', async (req, res) => {
    if (!checkDb(res)) return;
    const { id } = req.params;
    const { name, color, icon } = req.body;

    try {
        const { data, error } = await supabase
            .from('categories')
            .update({ name, color, icon })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (data) {
            res.json(data);
        } else {
            res.status(404).json({ error: 'Category not found' });
        }
    } catch (e) {
        console.error('Supabase Error (PUT /categories):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// DELETE Category
app.delete('/api/categories/:id', async (req, res) => {
    if (!checkDb(res)) return;
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        console.error('Supabase Error (DELETE /categories):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// POST New Error
app.post('/api/errors', async (req, res) => {
    if (!checkDb(res)) return;
    // Process images
    let finalImageUrls = req.body.imageUrls || [];
    let finalImageUrl = req.body.imageUrl;

    if (!finalImageUrl && finalImageUrls.length > 0) {
        finalImageUrl = finalImageUrls[0];
    }
    if (finalImageUrl && (!finalImageUrls || finalImageUrls.length === 0)) {
        finalImageUrls = [finalImageUrl];
    }

    const payload = {
        ...req.body,
        imageUrl: finalImageUrl,
        imageUrls: finalImageUrls,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format for PostgreSQL
        viewCount: 0
    };

    delete payload.id;

    try {
        const { data, error } = await supabase
            .from('errors')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (e) {
        console.error('Supabase Error (POST /errors):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// PUT Update Error
app.put('/api/errors/:id', async (req, res) => {
    if (!checkDb(res)) return;
    const id = parseInt(req.params.id);

    let finalImageUrls = req.body.imageUrls || [];
    let finalImageUrl = req.body.imageUrl;

    if (!finalImageUrl && finalImageUrls.length > 0) {
        finalImageUrl = finalImageUrls[0];
    }
    if (finalImageUrl && (!finalImageUrls || finalImageUrls.length === 0)) {
        finalImageUrls = [finalImageUrl];
    }

    const payload = {
        ...req.body,
        imageUrl: finalImageUrl,
        imageUrls: finalImageUrls
    };

    try {
        const { data, error } = await supabase
            .from('errors')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (data) {
            res.json(data);
        } else {
            res.status(404).json({ error: 'Error not found' });
        }
    } catch (e) {
        console.error('Supabase Error (PUT /errors):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// DELETE Error
app.delete('/api/errors/:id', async (req, res) => {
    if (!checkDb(res)) return;
    const id = parseInt(req.params.id);

    try {
        const { error } = await supabase
            .from('errors')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        console.error('Supabase Error (DELETE /errors):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Increment View Count
app.post('/api/errors/:id/view', async (req, res) => {
    if (!checkDb(res)) return;
    const id = parseInt(req.params.id);

    try {
        const { data: current, error: fetchError } = await supabase
            .from('errors')
            .select('viewCount')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const newCount = (current.viewCount || 0) + 1;

        const { data, error } = await supabase
            .from('errors')
            .update({ viewCount: newCount })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (POST view):', e.message);
        res.status(500).json({ error: e.message });
    }
});


// Diagnostic Endpoint to check DB schema and permissions
app.get('/api/diagnose-db', async (req, res) => {
    if (!checkDb(res)) return;

    const results = {
        connection: 'ok',
        schema: {},
        permissions: {}
    };

    try {
        // 1. Check if columns exist by selecting them
        const { data: selectData, error: selectError } = await supabase
            .from('errors')
            .select('id, title, solutionSteps, imageUrls, videoUrl, viewCount')
            .limit(1);

        if (selectError) {
            results.schema.status = 'error';
            results.schema.message = selectError.message;
        } else {
            results.schema.status = 'ok';
            results.schema.columns_present = true;
        }

        // 2. Check Write Permissions (Insert Dummy)
        const dummy = {
            title: 'Test Write',
            summary: 'Temp',
            // We intentionally don't send ID to see if auto-increment works
        };

        const { data: insertData, error: insertError } = await supabase
            .from('errors')
            .insert([dummy])
            .select()
            .single();

        if (insertError) {
            results.permissions.write = 'failed';
            results.permissions.message = insertError.message;
        } else {
            results.permissions.write = 'ok';
            // Cleanup
            await supabase.from('errors').delete().eq('id', insertData.id);
        }

        res.json(results);

    } catch (e) {
        res.status(500).json({
            error: 'Diagnostic Crash',
            message: e.message
        });
    }
});
const PORT = 3001;

// Conditional Listen for Local Development
if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
}

// Export app for Vercel Serverless
export default app;
