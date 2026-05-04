import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// Supabase Connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;
let supabaseAdmin;
let initError = null;

try {
    if (!supabaseUrl || !supabaseKey) {
        console.error('CRITICAL ERROR: SUPABASE_URL and SUPABASE_KEY are missing in environment.');
        initError = 'Missing environment variables';
    } else {
        supabase = createClient(supabaseUrl, supabaseKey);

        // Initialize Admin Client (Service Role)
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (serviceRoleKey) {
            supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
                auth: { errorcode: 'error_description' }
            });
            console.log('Supabase Admin client initialized');
        } else {
            console.warn('SUPABASE_SERVICE_ROLE_KEY missing. Admin functions will be disabled.');
        }

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
        version: '1.2',
        service: 'Supabase-Only Backend (Serverless)',
        timestamp: new Date().toISOString()
    });
});

// Multer Config for Video Uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Video Upload Endpoint (Deprecated - replaced by client-side upload)
// app.post('/api/upload-video', ...);

// Generate Signed Upload URL
app.post('/api/generate-upload-url', async (req, res) => {
    if (!checkDb(res)) return;
    try {
        const { name, type } = req.body;
        if (!name || !type) return res.status(400).json({ error: 'File name and type are required' });

        // Sanitize filename
        const cleanName = name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${Date.now()}_${cleanName}`;

        // Generate Signed URL for Upload
        // 'video' is the bucket name
        const { data, error } = await supabase.storage
            .from('videos')
            .createSignedUploadUrl(fileName);

        if (error) throw error;

        // Verify signedUrl generation
        if (!data || !data.signedUrl) {
            throw new Error('Failed to generate signed URL');
        }

        // Generate Public URL for future access
        const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(fileName);

        res.json({
            signedUrl: data.signedUrl,
            path: data.path, // May trigger 'token' in older versions, but 'signedUrl' is key
            publicUrl: publicUrl,
            fileName: fileName
        });
    } catch (e) {
        console.error('Generate Upload URL Failed:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// --- AUTH MIDDLEWARE ---

const verifyAdmin = async (req, res, next) => {
    if (!checkDb(res)) return;

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Bearer token missing' });
    }

    try {
        // 1. Verify Token with Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        // 2. Fetch user's profile from 'people' table to get their role
        const { data: person, error: personError } = await supabase
            .from('people')
            .select('access_role')
            .eq('auth_id', user.id)
            .single();

        if (personError || !person) {
            console.warn(`User ${user.id} found in auth but no profile in 'people' table.`);
            return res.status(403).json({ error: 'User profile not found or unauthorized' });
        }

        // 3. Check if the user has 'admin' access_role
        if (person.access_role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Not an administrator' });
        }

        // Attach user and person data to the request
        req.user = user;
        req.person = person;

        // Define Super Admin: Admin role + NO department
        req.isSuperAdmin = !person.department_id;
        req.userDepartmentId = person.department_id;

        next();

    } catch (e) {
        console.error('Admin verification failed:', e.message);
        return res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

// --- ADMIN ENDPOINTS ---

app.post('/api/admin/create-user', verifyAdmin, async (req, res) => {
    if (!req.isSuperAdmin) {
        return res.status(403).json({ error: 'Access denied: Only Super Admins can create users' });
    }

    if (!supabaseAdmin) {
        return res.status(503).json({ error: 'Admin service not configured (Missing Key)' });
    }

    const { email, password, name, role, department_id } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields: email, password, name' });
    }

    try {
        // 1. Create User in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        });

        if (authError) throw authError;

        // 2. Create Profile in 'people' table
        const { data: personData, error: personError } = await supabase
            .from('people')
            .insert([{
                auth_id: authData.user.id,
                name,
                role: role || 'user', // legacy or display role
                access_role: role || 'user', // security role
                department_id,
                color: 'blue' // default
            }])
            .select()
            .single();

        if (personError) {
            // Rollback Auth User if profile creation fails? 
            // Ideally yes, but complex. Only delete auth user if immediate fail.
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw personError;
        }

        res.status(201).json({
            message: 'User created successfully',
            user: authData.user,
            person: personData
        });

    } catch (e) {
        console.error('Create User Failed:', e.message);
        res.status(500).json({ error: e.message });
    }
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

// --- GUIDES ENDPOINTS ---

// GET All Guides
app.get('/api/guides', async (req, res) => {
    if (!checkDb(res)) return;
    try {
        const { data: guidesData, error: guidesError } = await supabase
            .from('guides')
            .select(`
                *,
                guide_assignees (
                    person:people (*, department:departments(*))
                )
            `)
            .order('sort_order', { ascending: true, nullsFirst: false })
            .order('id', { ascending: false });

        if (guidesError) throw guidesError;

        const transformedData = guidesData.map(guide => {
            const rawAssignees = guide.guide_assignees || [];
            const mappedAssignees = rawAssignees
                .map(ga => ga.person)
                .filter(p => p !== null && p !== undefined);

            return {
                ...guide,
                assignees: mappedAssignees,
                assignee: mappedAssignees.length > 0 ? mappedAssignees[0] : null
            };
        });

        res.json(transformedData);
    } catch (e) {
        console.error('Supabase Error (GET /guides):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// GET Single Guide
app.get('/api/guides/:id', async (req, res) => {
    if (!checkDb(res)) return;
    const id = parseInt(req.params.id);

    try {
        const { data: guideData, error: fetchError } = await supabase
            .from('guides')
            .select(`
                *,
                guide_assignees (
                    person:people (*, department:departments(*))
                )
            `)
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const rawAssignees = guideData.guide_assignees || [];
        const mappedAssignees = rawAssignees
            .map(ga => ga.person)
            .filter(p => p !== null && p !== undefined);

        const responseData = {
            ...guideData,
            assignees: mappedAssignees,
            assignee: mappedAssignees.length > 0 ? mappedAssignees[0] : null
        };

        res.json(responseData);
    } catch (e) {
        console.error('Supabase Error (GET /guides/:id):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// POST New Guide
app.post('/api/guides', verifyAdmin, async (req, res) => {
    if (!checkDb(res)) return;

    // Department Permission Check
    if (!req.isSuperAdmin) {
        // Force department_id for Dept Admins
        req.body.department_id = req.userDepartmentId;
    } else {
        // Super Admin must provide department_id
        if (!req.body.department_id) {
            return res.status(400).json({ error: 'Department ID is required for Super Admins' });
        }
    }

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
        code: req.body.code,
        title: req.body.title,
        summary: req.body.summary,
        content: req.body.content,
        steps: req.body.steps,
        category: req.body.category,
        image_url: finalImageUrl,
        image_urls: finalImageUrls,
        video_url: req.body.videoUrl,
        department_id: req.body.department_id,
        view_count: 0,
        sort_order: 0
    };

    try {
        // 1. Insert Guide
        const { data: guideData, error: insertError } = await supabase
            .from('guides')
            .insert([payload])
            .select()
            .single();

        if (insertError) throw insertError;

        // 2. Insert Assignees
        if (assigneeIds.length > 0) {
            const assigneeRows = assigneeIds.map(personId => ({
                guide_id: guideData.id,
                person_id: personId
            }));

            const { error: assignError } = await supabase
                .from('guide_assignees')
                .insert(assigneeRows);

            if (assignError) throw assignError;
        }

        // 3. Re-fetch
        const { data: completeGuide, error: fetchError } = await supabase
            .from('guides')
            .select(`
                *,
                guide_assignees (
                    person:people (*, department:departments(*))
                )
            `)
            .eq('id', guideData.id)
            .single();

        if (fetchError) throw fetchError;

        const mappedAssignees = (completeGuide.guide_assignees || []).map(ga => ga.person).filter(p => p);

        res.status(201).json({
            ...completeGuide,
            assignees: mappedAssignees,
            assignee: mappedAssignees[0] || null
        });
    } catch (e) {
        console.error('Supabase Error (POST /guides):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// PUT Update Guide
app.put('/api/guides/:id', verifyAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const id = parseInt(req.params.id);

    // Permission Check: Fetch existing guide to check department
    try {
        const { data: existingGuide, error: checkError } = await supabase
            .from('guides')
            .select('department_id')
            .eq('id', id)
            .single();

        if (checkError) throw checkError;

        if (!req.isSuperAdmin && existingGuide.department_id !== req.userDepartmentId) {
            return res.status(403).json({ error: 'Access denied: You can only edit guides in your department' });
        }
    } catch (e) {
        console.error('Permission Check Failed:', e.message);
        return res.status(500).json({ error: 'Failed to verify permissions' });
    }

    let finalImageUrls = req.body.imageUrls || [];
    let finalImageUrl = req.body.imageUrl;

    if (!finalImageUrl && finalImageUrls.length > 0) finalImageUrl = finalImageUrls[0];
    if (finalImageUrl && (!finalImageUrls || finalImageUrls.length === 0)) finalImageUrls = [finalImageUrl];

    const assigneeIds = req.body.assignee_ids || [];

    // Construct payload explicitly
    const payload = {
        code: req.body.code,
        title: req.body.title,
        summary: req.body.summary,
        content: req.body.content,
        steps: req.body.steps,
        category: req.body.category,
        image_url: finalImageUrl,
        image_urls: finalImageUrls,
        image_urls: finalImageUrls,
        video_url: req.body.videoUrl,
        department_id: req.body.department_id
    };

    try {
        const { data, error } = await supabase
            .from('guides')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (data) {
            // Update assignees
            if (Array.isArray(assigneeIds)) {
                await supabase.from('guide_assignees').delete().eq('guide_id', id);
                if (assigneeIds.length > 0) {
                    const assigneeRows = assigneeIds.map(pid => ({ guide_id: id, person_id: pid }));
                    await supabase.from('guide_assignees').insert(assigneeRows);
                }
            }

            // Re-fetch
            const { data: completeGuide, error: fetchError } = await supabase
                .from('guides')
                .select(`
                    *,
                guide_assignees (
                    person:people (*, department:departments(*))
                )
                `)
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            const mappedAssignees = (completeGuide.guide_assignees || []).map(ga => ga.person).filter(p => p);

            res.json({
                ...completeGuide,
                assignees: mappedAssignees,
                assignee: mappedAssignees[0] || null
            });
        } else {
            res.status(404).json({ error: 'Guide not found' });
        }
    } catch (e) {
        console.error('Supabase Error (PUT /guides):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// DELETE Guide
app.delete('/api/guides/:id', verifyAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const id = parseInt(req.params.id);

    // Permission Check
    try {
        const { data: existingGuide, error: checkError } = await supabase
            .from('guides')
            .select('department_id')
            .eq('id', id)
            .single();

        if (checkError) throw checkError;

        if (!req.isSuperAdmin && existingGuide.department_id !== req.userDepartmentId) {
            return res.status(403).json({ error: 'Access denied: You can only delete guides in your department' });
        }
    } catch (e) {
        console.error('Permission Check Failed:', e.message);
        return res.status(500).json({ error: 'Failed to verify permissions' });
    }

    try {
        await supabase.from('guide_assignees').delete().eq('guide_id', id);
        const { error } = await supabase.from('guides').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        console.error('Supabase Error (DELETE /guides):', e.message);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/guides/:id/view', async (req, res) => {
    if (!checkDb(res)) return;
    const id = parseInt(req.params.id);

    try {
        const { data: current, error: fetchError } = await supabase
            .from('guides')
            .select('view_count')
            .eq('id', id);

        if (fetchError) throw fetchError;
        
        if (!current || current.length === 0) {
            return res.status(404).json({ error: 'Guide record not found' });
        }

        const newCount = (current[0].view_count || 0) + 1;

        const { data, error: updateError } = await (supabaseAdmin || supabase)
            .from('guides')
            .update({ view_count: newCount })
            .eq('id', id)
            .select();

        if (updateError) throw updateError;
        res.json(Array.isArray(data) ? data[0] : data);
    } catch (e) {
        console.error('Supabase Error (POST guide view):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Reset Guide View Count
app.post('/api/guides/:id/reset-view', async (req, res) => {
    if (!checkDb(res)) return;
    const id = parseInt(req.params.id);

    try {
        const { data, error } = await (supabaseAdmin || supabase)
            .from('guides')
            .update({ view_count: 0 })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (POST guide reset-view):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Reorder Guides
app.post('/api/guides/reorder', async (req, res) => {
    if (!checkDb(res)) return;
    const { orderedIds } = req.body;

    if (!orderedIds || !Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        // Create an array of update promises
        // Note: Supabase JS client doesn't support bulk update with different values easily in one query without RPC.
        // Doing loop is acceptable for small number of items (guides ~50-100).
        const updates = orderedIds.map((id, index) =>
            supabase
                .from('guides')
                .update({ sort_order: index })
                .eq('id', id)
        );

        await Promise.all(updates);

        res.json({ success: true });
    } catch (e) {
        console.error('Supabase Error (Reorder Guides):', e.message);
        res.status(500).json({ error: e.message });
    }
});

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
                    person:people (*, department:departments(*))
                )
            `)
            // Sort by sort_order first (if exists/populated), then by ID desc
            .order('sort_order', { ascending: true, nullsFirst: false })
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
        // Fallback: If sorting by sort_order failed (column missing), try standard sort
        if (e.message.includes('sort_order')) {
            console.warn('Retrying fetch without sort_order (column likely missing).');
            try {
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('errors')
                    .select(`
                        *,
                        error_assignees (
                            person:people (*)
                        )
                    `)
                    .order('id', { ascending: false });

                if (fallbackError) throw fallbackError;

                const transformedFallback = fallbackData.map(error => {
                    const rawAssignees = error.error_assignees || [];
                    const mappedAssignees = rawAssignees.map(ea => ea.person).filter(p => p);
                    return {
                        ...error,
                        assignees: mappedAssignees,
                        assignee: mappedAssignees.length > 0 ? mappedAssignees[0] : null
                    };
                });
                return res.json(transformedFallback);
            } catch (retryErr) {
                console.error('Retry failed:', retryErr.message);
            }
        }

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

// ... (GET Single Error remains same) ...
// ... (GET/POST/PUT/DELETE Categories/Departments/People/Errors remain same) ...

// [EXISTING CODE ENDS AT LINE 677 for reset-view]
// [Start of NEW Reorder Endpoint]

// Reorder Errors
app.post('/api/errors/reorder', async (req, res) => {
    if (!checkDb(res)) return;
    const { orderedIds } = req.body; // Array of IDs in new order

    if (!orderedIds || !Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'orderedIds array is required' });
    }

    try {
        // Prepare updates: [{ id: 1, sort_order: 0 }, { id: 5, sort_order: 1 }, ...]
        const updates = orderedIds.map((id, index) => ({
            id: parseInt(id),
            sort_order: index
        }));

        // Perform Bulk Update (Upsert)
        // Note: For upsert to work effectively for updates, usage of 'id' as conflict key is correct.
        // We only send id and sort_order, preventing overwrite of other fields if not specified? 
        // Supabase upsert updates columns present in the payload.
        const { data, error } = await supabase
            .from('errors')
            .upsert(updates, { onConflict: 'id' })
            .select('id, sort_order');

        if (error) throw error;

        res.json({ success: true, count: updates.length });
    } catch (e) {
        console.error('Supabase Error (POST reorder):', e.message);
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
                    person:people (*, department:departments(*))
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
    const { name, color, icon, type } = req.body;
    const id = req.body.id || name.toLowerCase().replace(/[^a-z0-9]/g, '');

    const newCategory = {
        id,
        name,
        color,
        icon: icon || 'settings',
        type: type || 'errors' // Default to 'errors' if not provided
    };

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
    const { name, color, icon, type } = req.body;

    try {
        const { data, error } = await supabase
            .from('categories')
            .update({ name, color, icon, type })
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
app.post('/api/errors', verifyAdmin, async (req, res) => {
    if (!checkDb(res)) return;

    // Department Permission Check
    if (!req.isSuperAdmin) {
        req.body.department_id = req.userDepartmentId;
    } else {
        if (!req.body.department_id) {
            return res.status(400).json({ error: 'Department ID is required for Super Admins' });
        }
    }
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
        title: req.body.title,
        code: req.body.code,
        summary: req.body.summary,
        solution: req.body.solution,
        solutionType: req.body.solutionType,
        solutionSteps: req.body.solutionSteps,
        category: req.body.category,
        imageUrl: finalImageUrl,
        imageUrls: finalImageUrls,
        videoUrl: req.body.videoUrl,
        department_id: req.body.department_id,
        date: dateStr, // specific to creation
        viewCount: 0
    };


    // Remove non-column fields
    delete payload.id;
    delete payload.assignee_ids;
    delete payload.assignee_id; // Clean up legacy if sent
    delete payload.assignee; // Clean up legacy object if sent
    delete payload.assignee; // Clean up legacy object if sent
    delete payload.severity; // Remove if column doesn't exist yet
    delete payload.videoUrl;

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
app.put('/api/errors/:id', verifyAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const id = parseInt(req.params.id);

    // Permission Check
    try {
        const { data: existingError, error: checkError } = await supabase
            .from('errors')
            .select('department_id')
            .eq('id', id)
            .single();

        if (checkError) throw checkError;

        if (!req.isSuperAdmin && existingError.department_id !== req.userDepartmentId) {
            return res.status(403).json({ error: 'Access denied: You can only edit errors in your department' });
        }
    } catch (e) {
        console.error('Permission Check Failed:', e.message);
        return res.status(500).json({ error: 'Failed to verify permissions' });
    }

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
        title: req.body.title,
        code: req.body.code,
        summary: req.body.summary,
        solution: req.body.solution,
        solutionType: req.body.solutionType,
        solutionSteps: req.body.solutionSteps,
        category: req.body.category,
        imageUrl: finalImageUrl,
        imageUrls: finalImageUrls,
        videoUrl: req.body.videoUrl,
        date: req.body.date,
        // Do not include created_at, id, or viewCount
    };

    // Clean up non-column fields handled above or not needed
    // delete payload.assignee_ids; // Not in payload object anyway
    // delete payload.content; // Not in payload object anyway

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
app.delete('/api/errors/:id', verifyAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const id = parseInt(req.params.id);

    // Permission Check
    try {
        const { data: existingError, error: checkError } = await supabase
            .from('errors')
            .select('department_id')
            .eq('id', id)
            .single();

        if (checkError) throw checkError;

        if (!req.isSuperAdmin && existingError.department_id !== req.userDepartmentId) {
            return res.status(403).json({ error: 'Access denied: You can only delete errors in your department' });
        }
    } catch (e) {
        console.error('Permission Check Failed:', e.message);
        return res.status(500).json({ error: 'Failed to verify permissions' });
    }

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

app.post('/api/errors/:id/view', async (req, res) => {
    if (!checkDb(res)) return;
    const id = parseInt(req.params.id);

    try {
        // 1. First check if the error exists and get current count
        const { data: current, error: fetchError } = await supabase
            .from('errors')
            .select('viewCount')
            .eq('id', id);

        if (fetchError) throw fetchError;

        if (!current || current.length === 0) {
            return res.status(404).json({ error: 'Error record not found' });
        }

        const newCount = (current[0].viewCount || 0) + 1;

        // 2. Perform update
        const { data, error: updateError } = await (supabaseAdmin || supabase)
            .from('errors')
            .update({ viewCount: newCount })
            .eq('id', id)
            .select();

        if (updateError) throw updateError;
        
        // Return first element if array returned, otherwise return data
        res.json(Array.isArray(data) ? data[0] : data);
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
        const { data, error } = await (supabaseAdmin || supabase)
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

    try {
        // 1. Check errors table
        const { data: errorSample, error: sampleError } = await supabase
            .from('errors')
            .select('*')
            .limit(1);

        // 2. Check guides table
        const { data: guideSample, error: guideError } = await supabase
            .from('guides')
            .select('*')
            .limit(1);

        res.json({
            status: 'success',
            database: 'connected',
            errors_schema: {
                columns: errorSample && errorSample.length > 0 ? Object.keys(errorSample[0]) : [],
                error: sampleError ? sampleError.message : null
            },
            guides_schema: {
                columns: guideSample && guideSample.length > 0 ? Object.keys(guideSample[0]) : [],
                error: guideError ? guideError.message : null
            },
            env: {
                has_url: !!process.env.SUPABASE_URL,
                has_key: !!process.env.SUPABASE_KEY,
                has_admin_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
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
