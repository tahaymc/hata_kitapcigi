import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

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
        // Fetch errors with their related assignee IDs
        const { data: errorsData, error: errorsError } = await supabase
            .from('errors')
            .select(`
                *,
                error_assignees (
                    person:people (*)
                )
            `)
            .order('id', { ascending: false });

        if (errorsError) throw errorsError;

        // Transform data to include assignees array
        const transformedData = errorsData.map(error => {
            // Safe access to joined data
            const rawAssignees = error.error_assignees || [];
            const mappedAssignees = rawAssignees
                .map(ea => ea.person)
                .filter(p => p !== null && p !== undefined); // Filter out any nulls

            return {
                ...error,
                assignees: mappedAssignees,
                // Legacy support: logic to get the first assignee or null
                assignee: mappedAssignees.length > 0 ? mappedAssignees[0] : null
            };
        });

        res.json(transformedData);
    } catch (e) {
        console.error('Supabase Error (GET /errors):', e.message);
        // Fallback: If the relationship query failed (e.g. table missing), 
        // try fetching just errors to keep the app working.
        if (e.message.includes('error_assignees')) {
            console.warn('Retrying fetch without assignees relationship due to schema error.');
            const { data: simpleErrors, error: simpleError } = await supabase
                .from('errors')
                .select('*')
                .order('id', { ascending: false });

            if (!simpleError) {
                return res.json(simpleErrors.map(e => ({ ...e, assignees: [], assignee: null })));
            }
        }
        res.status(500).json({ error: e.message });
    }
});

// GET Single Error by ID
app.get('/api/errors/:id', async (req, res) => {
    if (!checkDb(res)) return;
    const id = parseInt(req.params.id);

    try {
        const { data: errorData, error: fetchError } = await supabase
            .from('errors')
            .select(`
                *,
                error_assignees (
                    person:people (*)
                )
            `)
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Transform data
        const rawAssignees = errorData.error_assignees || [];
        const mappedAssignees = rawAssignees
            .map(ea => ea.person)
            .filter(p => p !== null && p !== undefined);

        const responseData = {
            ...errorData,
            assignees: mappedAssignees,
            assignee: mappedAssignees.length > 0 ? mappedAssignees[0] : null
        };

        res.json(responseData);
    } catch (e) {
        console.error('Supabase Error (GET /errors/:id):', e.message);
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

// --- DEPARTMENTS ENDPOINTS ---

// GET All Departments
app.get('/api/departments', async (req, res) => {
    if (!checkDb(res)) return;
    try {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (GET /departments):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// POST New Department
app.post('/api/departments', async (req, res) => {
    if (!checkDb(res)) return;
    const { name, color, icon } = req.body;

    try {
        const { data, error } = await supabase
            .from('departments')
            .insert([{ name, color, icon }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (e) {
        console.error('Supabase Error (POST /departments):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// PUT Update Department
app.put('/api/departments/:id', async (req, res) => {
    if (!checkDb(res)) return;
    const id = req.params.id;
    const { name, color, icon } = req.body;

    try {
        const { data, error } = await supabase
            .from('departments')
            .update({ name, color, icon })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (PUT /departments):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// DELETE Department
app.delete('/api/departments/:id', async (req, res) => {
    if (!checkDb(res)) return;
    const id = req.params.id;

    try {
        const { error } = await supabase
            .from('departments')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        console.error('Supabase Error (DELETE /departments):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// --- PEOPLE ENDPOINTS ---

// GET All People
app.get('/api/people', async (req, res) => {
    if (!checkDb(res)) return;
    try {
        const { data, error } = await supabase
            .from('people')
            .select('*, department:departments(*)')
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (GET /people):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// POST New Person
app.post('/api/people', async (req, res) => {
    if (!checkDb(res)) return;
    const { name, role, department_id, color, avatar_url } = req.body;

    try {
        const { data, error } = await supabase
            .from('people')
            .insert([{ name, role, department_id, color, avatar_url }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (e) {
        console.error('Supabase Error (POST /people):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// PUT Update Person
app.put('/api/people/:id', async (req, res) => {
    if (!checkDb(res)) return;
    const id = req.params.id;
    const { name, role, department_id, color, avatar_url } = req.body;

    try {
        const { data, error } = await supabase
            .from('people')
            .update({ name, role, department_id, color, avatar_url })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (PUT /people):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// DELETE Person
app.delete('/api/people/:id', async (req, res) => {
    if (!checkDb(res)) return;
    const id = req.params.id;

    try {
        const { error } = await supabase
            .from('people')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        console.error('Supabase Error (DELETE /people):', e.message);
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

    // Date Handling
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Istanbul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const dateStr = formatter.format(now);

    const assigneeIds = req.body.assignee_ids || [];

    const payload = {
        ...req.body,
        imageUrl: finalImageUrl,
        imageUrls: finalImageUrls,
        date: dateStr,
        viewCount: 0
    };

    // Remove non-column fields
    delete payload.id;
    delete payload.assignee_ids;
    delete payload.assignee_id; // Clean up legacy if sent
    delete payload.assignee; // Clean up legacy object if sent
    delete payload.severity; // Remove if column doesn't exist yet

    try {
        // 1. Insert Error
        const { data: errorData, error: insertError } = await supabase
            .from('errors')
            .insert([payload])
            .select()
            .single();

        if (insertError) throw insertError;

        // 2. Insert Assignees
        if (assigneeIds.length > 0) {
            const assigneeRows = assigneeIds.map(personId => ({
                error_id: errorData.id,
                person_id: personId
            }));

            const { error: assignError } = await supabase
                .from('error_assignees')
                .insert(assigneeRows);

            if (assignError) throw assignError;
        }

        // 3. Re-fetch the complete error with assignees for the Frontend
        const { data: completeError, error: fetchError } = await supabase
            .from('errors')
            .select(`
                *,
                error_assignees (
                    person:people (*)
                )
            `)
            .eq('id', errorData.id)
            .single();

        if (fetchError) throw fetchError;

        // Transform (sanitize assignees)
        const rawAssignees = completeError.error_assignees || [];

        const mappedAssignees = rawAssignees
            .map(ea => ea.person)
            .filter(p => p !== null && p !== undefined);


        const responseData = {
            ...completeError,
            assignees: mappedAssignees,
            assignee: mappedAssignees.length > 0 ? mappedAssignees[0] : null
        };


        res.status(201).json(responseData);
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

    const assigneeIds = req.body.assignee_ids || [];

    const payload = {
        ...req.body,
        imageUrl: finalImageUrl,
        imageUrls: finalImageUrls
    };

    // Clean up non-column fields
    delete payload.assignee_ids;
    delete payload.assignee_id;
    delete payload.assignees; // if present from GET
    delete payload.assignee; // if present from GET
    delete payload.severity; // Remove if column doesn't exist yet

    try {
        // 1. Update Error
        const { data, error } = await supabase
            .from('errors')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (data) {
            // 2. Sync Assignees
            // Verify assigneeIds is an array
            if (Array.isArray(assigneeIds)) {
                // Delete existing
                await supabase.from('error_assignees').delete().eq('error_id', id);

                // Insert new
                if (assigneeIds.length > 0) {
                    const assigneeRows = assigneeIds.map(personId => ({
                        error_id: id,
                        person_id: personId
                    }));
                    await supabase.from('error_assignees').insert(assigneeRows);
                }
            }

            // 3. Re-fetch the complete error with assignees
            const { data: completeError, error: fetchError } = await supabase
                .from('errors')
                .select(`
                    *,
                    error_assignees (
                        person:people (*)
                    )
                `)
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            // Transform
            const rawAssignees = completeError.error_assignees || [];
            const mappedAssignees = rawAssignees
                .map(ea => ea.person)
                .filter(p => p !== null && p !== undefined);

            const responseData = {
                ...completeError,
                assignees: mappedAssignees,
                assignee: mappedAssignees.length > 0 ? mappedAssignees[0] : null
            };

            res.json(responseData);
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
        // Delete assignees first (cascade might handle this, but explicit is safer)
        await supabase.from('error_assignees').delete().eq('error_id', id);

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

// Reset View Count
app.post('/api/errors/:id/reset-view', async (req, res) => {
    if (!checkDb(res)) return;
    const id = parseInt(req.params.id);

    try {
        const { data, error } = await supabase
            .from('errors')
            .update({ viewCount: 0 })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (POST reset-view):', e.message);
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

// Serve Static Files (Frontend)
app.use(express.static(path.join(__dirname, '../dist')));

// SPA Fallback: Redirect all non-API requests to index.html
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../dist', 'index.html'));
    } else {
        next();
    }
});

// Conditional Listen for Local Development
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log('VERCEL ENV:', process.env.VERCEL); // Debug log
});

// Export app for Vercel Serverless
export default app;
