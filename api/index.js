import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Vercel/proxy arkasında gerçek istemci IP'sini X-Forwarded-For'dan oku
// (rate limit'in IP başına doğru saymasi için gerekli).
app.set('trust proxy', 1);

// --- Güvenlik başlıkları ---
app.use(helmet());

// --- CORS ---
// origin: true (her köken) yerine env'den okunan izin listesi. ALLOWED_ORIGINS
// virgülle ayrılmış köken listesidir (örn. "https://site.com,https://www.site.com").
// Liste boşsa geliştirme için localhost'a izin verilir. Köken içermeyen istekler
// (server-to-server, curl, mobil uygulama, aynı köken) engellenmez.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const corsOptions = {
    credentials: true,
    origin: (origin, callback) => {
        // Köken yoksa (Postman, server-to-server, same-origin) izin ver
        if (!origin) return callback(null, true);

        if (allowedOrigins.length > 0) {
            return allowedOrigins.includes(origin)
                ? callback(null, true)
                : callback(new Error(`CORS: origin not allowed (${origin})`));
        }

        // Liste tanımlı değilse yalnızca localhost'a (geliştirme) izin ver
        if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS: origin not allowed (${origin})`));
    }
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '2mb' }));

// --- Rate limiting ---
// Genel API: 15 dakikada IP başına 300 istek.
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.' }
});

// Hassas uçlar (kullanıcı oluşturma/yönetimi): 15 dakikada IP başına 20 istek.
const sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Çok fazla deneme yapıldı, lütfen daha sonra tekrar deneyin.' }
});

// Public görüntülenme sayacı (kimlik doğrulamasız): 15 dakikada IP başına 60 istek.
const viewLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.' }
});

// Genel limiter tüm /api uçlarına uygulanır (daha sıkı limiter'lar uç bazında ek olarak).
app.use('/api', generalLimiter);

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
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY;
        if (serviceRoleKey) {
            supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
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

// Yazma işlemleri (insert/update/delete) için tercihen service-role client.
// Bu uçlar zaten verifyAdmin/verifySuperAdmin ile yetkilendirilir; service-role kullanmak,
// guides/errors tablolarındaki RLS politikalarını (ör. olmayan bir auth_id
// kolonuna atıf yapan bozuk politika) baypas eder. Service key yoksa anon'a düşer.
const writeDb = () => supabaseAdmin || supabase;

// Endpoint to debug environment variables (Safe: shows only presence)
// Üretimde tamamen devre dışı: bilgi sızıntısını önlemek için 404 dön.
app.get('/api/debug-env', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).end();
    }
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

// Bucket adından signed upload URL üreten ortak yardımcı.
const generateSignedUploadFor = async (bucket, name, type) => {
    if (!name || !type) return { error: 'File name and type are required' };
    const cleanName = name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${Date.now()}_${cleanName}`;

    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(fileName);
    if (error) return { error: error.message };
    if (!data || !data.signedUrl) return { error: 'Failed to generate signed URL' };

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

    return {
        signedUrl: data.signedUrl,
        path: data.path,
        publicUrl,
        fileName
    };
};

// Generate Signed Upload URL (videos bucket — top-level kapak videoları için)
app.post('/api/generate-upload-url', async (req, res) => {
    if (!checkDb(res)) return;
    try {
        const { name, type } = req.body;
        const out = await generateSignedUploadFor('videos', name, type);
        if (out.error) return res.status(400).json({ error: out.error });
        res.json(out);
    } catch (e) {
        console.error('Generate Upload URL Failed:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// NOT: Step foto yükleme ucu (generate-image-upload-url) verifyAdmin
// middleware'ine bağlı olduğundan, aşağıdaki middleware tanımlarından SONRA
// kaydedilir (const TDZ — tanımdan önce kullanılamaz).

// --- AUTH MIDDLEWARE ---
//
// İki seviyeli yetki:
//  - verifyAdmin: role ∈ {'admin', 'super_admin'} — içerik (hata/kılavuz/
//    kategori/kişi) CRUD için. req.isSuperAdmin true ise departman kısıtı
//    uygulanmaz; admin için req.userDepartmentId üzerinden kısıtlama yapılır.
//  - verifySuperAdmin: role === 'super_admin' — Yönetici Paneli, Bot Yönetimi
//    ve kullanıcı/departman yönetimi için.

const authenticateRequest = async (req, res) => {
    if (!checkDb(res)) return null;

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'Authorization header missing' });
        return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Bearer token missing' });
        return null;
    }

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            res.status(403).json({ error: 'Invalid token' });
            return null;
        }

        // admins tablosunda department_id kolonu yok; '*' ile çekiyoruz ki
        // yapı değişirse middleware'i tekrar elle güncellemek gerekmesin.
        const { data: person, error: personError } = await supabase
            .from('admins')
            .select('*')
            .eq('auth_id', user.id)
            .single();

        if (personError || !person) {
            console.warn('authenticateRequest: admins row not found', {
                auth_id: user.id,
                error: personError?.message
            });
            res.status(403).json({ error: 'User profile not found or unauthorized' });
            return null;
        }

        const role = person.access_role || person.role || null;
        return { user, person, role };
    } catch (e) {
        console.error('Authentication failed:', e.message);
        res.status(500).json({ error: 'Internal server error during authentication' });
        return null;
    }
};

const verifyAdmin = async (req, res, next) => {
    const ctx = await authenticateRequest(req, res);
    if (!ctx) return;

    if (ctx.role !== 'admin' && ctx.role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied: admin or super_admin required' });
    }

    req.user = ctx.user;
    req.person = ctx.person;
    req.role = ctx.role;
    req.isSuperAdmin = ctx.role === 'super_admin';
    // admins tablosunda department_id kolonu yoksa null kalır; varsa kullanılır.
    req.userDepartmentId = ctx.person.department_id ?? null;
    next();
};

const verifySuperAdmin = async (req, res, next) => {
    const ctx = await authenticateRequest(req, res);
    if (!ctx) return;

    if (ctx.role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied: super_admin required' });
    }

    req.user = ctx.user;
    req.person = ctx.person;
    req.role = ctx.role;
    req.isSuperAdmin = true;
    // admins tablosunda department_id kolonu yoksa null kalır; varsa kullanılır.
    req.userDepartmentId = ctx.person.department_id ?? null;
    next();
};

// Step foto yüklemeleri — 'step-photos' bucket. Yalnız admin yetkili.
// (Bucket'ın Supabase'de public read ile oluşturulmuş olması gerekir.)
// verifyAdmin yukarıda tanımlandıktan sonra kaydedilir.
app.post('/api/generate-image-upload-url', verifyAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    try {
        const { name, type } = req.body;
        if (type && !String(type).startsWith('image/')) {
            return res.status(400).json({ error: 'Only image uploads are allowed for this endpoint' });
        }
        const out = await generateSignedUploadFor('step-photos', name, type);
        if (out.error) return res.status(400).json({ error: out.error });
        res.json(out);
    } catch (e) {
        console.error('Generate Image Upload URL Failed:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// --- ADMIN ENDPOINTS ---

app.post('/api/admin/create-user', sensitiveLimiter, verifySuperAdmin, async (req, res) => {
    if (!req.isSuperAdmin) {
        return res.status(403).json({ error: 'Access denied: Only Super Admins can create users' });
    }

    if (!supabaseAdmin) {
        return res.status(503).json({ error: 'Admin service not configured (Missing Key)' });
    }

    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields: email, password, name' });
    }

    // Yalnızca 'admin' veya 'super_admin' rolüne izin ver (varsayılan: admin)
    const safeRole = role === 'super_admin' ? 'super_admin' : 'admin';

    try {
        // 1. Create User in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        });

        if (authError) throw authError;

        // 2. Create Profile in 'admins' table (service-role; RLS'i baypas eder)
        const { data: personData, error: personError } = await writeDb()
            .from('admins')
            .insert([{
                auth_id: authData.user.id,
                name,
                email,
                role: safeRole,
                access_role: safeRole
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

// List all login users (admins table) — yalnızca yöneticiler
app.get('/api/admin/users', verifySuperAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    try {
        const { data, error } = await writeDb()
            .from('admins')
            .select('id, auth_id, name, email, role, access_role, created_at')
            .order('created_at', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (GET /admin/users):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Update a user's role — yalnızca yöneticiler
app.put('/api/admin/users/:id', sensitiveLimiter, verifySuperAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const { id } = req.params;
    const role = req.body.role === 'super_admin' ? 'super_admin' : 'admin';

    try {
        const { data: target, error: findErr } = await writeDb()
            .from('admins')
            .select('auth_id')
            .eq('id', id)
            .single();
        if (findErr || !target) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

        // Kendi rolünü değiştirmeyi engelle (kilitlenmeyi önler)
        if (target.auth_id === req.user.id) {
            return res.status(400).json({ error: 'Kendi rolünüzü değiştiremezsiniz' });
        }

        const { data, error } = await writeDb()
            .from('admins')
            .update({ role, access_role: role })
            .eq('id', id)
            .select('id, auth_id, name, email, role, access_role')
            .single();
        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (PUT /admin/users):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Delete a user (admins satırı + Supabase Auth kullanıcısı) — yalnızca yöneticiler
app.delete('/api/admin/users/:id', sensitiveLimiter, verifySuperAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    if (!supabaseAdmin) {
        return res.status(503).json({ error: 'Admin service not configured (Missing Key)' });
    }
    const { id } = req.params;

    try {
        const { data: target, error: findErr } = await writeDb()
            .from('admins')
            .select('auth_id')
            .eq('id', id)
            .single();
        if (findErr || !target) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

        if (target.auth_id === req.user.id) {
            return res.status(400).json({ error: 'Kendinizi silemezsiniz' });
        }

        const { error: delErr } = await writeDb().from('admins').delete().eq('id', id);
        if (delErr) throw delErr;

        // Supabase Auth kullanıcısını da sil
        if (target.auth_id) {
            await supabaseAdmin.auth.admin.deleteUser(target.auth_id);
        }

        res.json({ success: true });
    } catch (e) {
        console.error('Supabase Error (DELETE /admin/users):', e.message);
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
        const { data: guideData, error: insertError } = await writeDb()
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

            const { error: assignError } = await writeDb()
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
        const { data, error } = await writeDb()
            .from('guides')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (data) {
            // Update assignees
            if (Array.isArray(assigneeIds)) {
                await writeDb().from('guide_assignees').delete().eq('guide_id', id);
                if (assigneeIds.length > 0) {
                    const assigneeRows = assigneeIds.map(pid => ({ guide_id: id, person_id: pid }));
                    await writeDb().from('guide_assignees').insert(assigneeRows);
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
        await writeDb().from('guide_assignees').delete().eq('guide_id', id);
        const { error } = await writeDb().from('guides').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        console.error('Supabase Error (DELETE /guides):', e.message);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/guides/:id/view', viewLimiter, async (req, res) => {
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
app.post('/api/guides/:id/reset-view', verifyAdmin, async (req, res) => {
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
app.post('/api/guides/reorder', verifyAdmin, async (req, res) => {
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
            writeDb()
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
app.post('/api/errors/reorder', verifyAdmin, async (req, res) => {
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
        const { data, error } = await writeDb()
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
        let query = supabase
            .from('categories')
            .select('*');

        // İsteğe bağlı: yalnızca belirli bir departmanın alt kategorileri.
        if (req.query.department_id) {
            query = query.eq('department_id', req.query.department_id);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (GET /categories):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// POST New Category
app.post('/api/categories', verifyAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const { name, color, icon, type, department_id } = req.body;
    const id = req.body.id || name.toLowerCase().replace(/[^a-z0-9]/g, '');

    const newCategory = {
        id,
        name,
        color, // geriye dönük uyum; UI'da artık departman rengi esas
        icon: icon || 'settings',
        type: type || 'errors', // Default to 'errors' if not provided
        department_id: department_id ?? null
    };

    try {
        const { data, error } = await writeDb()
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
app.put('/api/categories/:id', verifyAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const { id } = req.params;
    const { name, color, icon, type, department_id } = req.body;

    // Yalnızca gönderilen alanları güncelle.
    const patch = {};
    if (name !== undefined) patch.name = name;
    if (color !== undefined) patch.color = color;
    if (icon !== undefined) patch.icon = icon;
    if (type !== undefined) patch.type = type;
    if (department_id !== undefined) patch.department_id = department_id;

    try {
        const { data, error } = await writeDb()
            .from('categories')
            .update(patch)
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
app.delete('/api/categories/:id', verifyAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const { id } = req.params;

    try {
        const { error } = await writeDb()
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

// --- ANNOUNCEMENTS (Duyurular) ENDPOINTS ---
// Yetki: verifyAdmin (admin + super_admin). Okuma herkese açık.
// Sıralama: acil olanlar üstte, sonra en yeni.

app.get('/api/announcements', async (req, res) => {
    if (!checkDb(res)) return;
    try {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('is_urgent', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (GET /announcements):', e.message);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/announcements', verifyAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const { title, body, is_urgent, department_id } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Başlık zorunludur' });

    try {
        const { data, error } = await writeDb()
            .from('announcements')
            .insert([{
                title: title.trim(),
                body: body || '',
                is_urgent: !!is_urgent,
                department_id: department_id ? Number(department_id) : null
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (e) {
        console.error('Supabase Error (POST /announcements):', e.message);
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/announcements/:id', verifyAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const { id } = req.params;
    const { title, body, is_urgent, department_id } = req.body;

    const patch = {};
    if (title !== undefined) patch.title = title;
    if (body !== undefined) patch.body = body;
    if (is_urgent !== undefined) patch.is_urgent = !!is_urgent;
    if (department_id !== undefined) patch.department_id = department_id ? Number(department_id) : null;

    try {
        const { data, error } = await writeDb()
            .from('announcements')
            .update(patch)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (PUT /announcements):', e.message);
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/announcements/:id', verifyAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const { id } = req.params;

    try {
        const { error } = await writeDb()
            .from('announcements')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        console.error('Supabase Error (DELETE /announcements):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// --- DEPARTMENTS ENDPOINTS ---

// GET All Departments — ana katman; sort_order, sonra ad sırasıyla.
app.get('/api/departments', async (req, res) => {
    if (!checkDb(res)) return;
    try {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .order('sort_order', { ascending: true, nullsFirst: false })
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Supabase Error (GET /departments):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// POST New Department — yalnızca yönetici (RLS ile uyumlu)
app.post('/api/departments', verifySuperAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const { name, color, icon, sort_order } = req.body;

    try {
        const { data, error } = await writeDb()
            .from('departments')
            .insert([{ name, color, icon, sort_order: sort_order ?? 0 }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (e) {
        console.error('Supabase Error (POST /departments):', e.message);
        res.status(500).json({ error: e.message });
    }
});

// PUT Update Department — yalnızca yönetici
app.put('/api/departments/:id', verifySuperAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const id = req.params.id;
    const { name, color, icon, sort_order } = req.body;

    // Yalnızca gönderilen alanları güncelle (sort_order tek başına gelebilir).
    const patch = {};
    if (name !== undefined) patch.name = name;
    if (color !== undefined) patch.color = color;
    if (icon !== undefined) patch.icon = icon;
    if (sort_order !== undefined) patch.sort_order = sort_order;

    try {
        const { data, error } = await writeDb()
            .from('departments')
            .update(patch)
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

// DELETE Department — yalnızca yönetici
app.delete('/api/departments/:id', verifySuperAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const id = req.params.id;

    try {
        const { error } = await writeDb()
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

// POST Reorder Departments — yalnızca yönetici
app.post('/api/departments/reorder', verifySuperAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    const { orderedIds } = req.body;

    if (!orderedIds || !Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        const updates = orderedIds.map((id, index) =>
            writeDb()
                .from('departments')
                .update({ sort_order: index })
                .eq('id', id)
        );

        await Promise.all(updates);
        res.json({ success: true });
    } catch (e) {
        console.error('Supabase Error (Reorder Departments):', e.message);
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
app.post('/api/people', verifyAdmin, async (req, res) => {
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
app.put('/api/people/:id', verifyAdmin, async (req, res) => {
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
app.delete('/api/people/:id', verifyAdmin, async (req, res) => {
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
        const { data: errorData, error: insertError } = await writeDb()
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

            const { error: assignError } = await writeDb()
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
        const { data, error } = await writeDb()
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
                await writeDb().from('error_assignees').delete().eq('error_id', id);

                // Insert new
                if (assigneeIds.length > 0) {
                    const assigneeRows = assigneeIds.map(personId => ({
                        error_id: id,
                        person_id: personId
                    }));
                    await writeDb().from('error_assignees').insert(assigneeRows);
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
        await writeDb().from('error_assignees').delete().eq('error_id', id);

        const { error } = await writeDb()
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

app.post('/api/errors/:id/view', viewLimiter, async (req, res) => {
    if (!checkDb(res)) return;
    const id = parseInt(req.params.id);

    try {
        const { data: current, error: fetchError } = await supabase
            .from('errors')
            .select('viewCount')
            .eq('id', id);

        if (fetchError) {
            console.error('Fetch Error:', fetchError);
            throw fetchError;
        }

        if (!current || current.length === 0) {
            return res.status(404).json({ error: 'Error record not found' });
        }

        const newCount = (current[0].viewCount || 0) + 1;

        const updateClient = supabaseAdmin || supabase;
        const { data, error: updateError } = await updateClient
            .from('errors')
            .update({ viewCount: newCount })
            .eq('id', id)
            .select();

        if (updateError) {
            console.error('Update Error:', updateError);
            return res.status(500).json({ 
                error: updateError.message,
                details: updateError.details,
                hint: updateError.hint 
            });
        }
        
        if (!data || data.length === 0) {
            const keyToUse = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY;
            return res.status(403).json({ 
                error: 'No rows updated. Possible RLS issue.',
                admin_key_exists: !!keyToUse,
                admin_key_prefix: keyToUse ? keyToUse.substring(0, 5) : 'none',
                key_name_used: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : (process.env.SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : (process.env.SUPABASE_ADMIN_KEY ? 'SUPABASE_ADMIN_KEY' : 'none'))
            });
        }

        res.json(data[0]);
    } catch (e) {
        console.error('General Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Reset View Count
app.post('/api/errors/:id/reset-view', verifyAdmin, async (req, res) => {
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

// =====================================================================
// BOT ENDPOINTS
// =====================================================================
//
// /api/bot/* endpoint'leri WhatsApp botuyla konuşur.
// - Settings ve heartbeat: Supabase'de bot_settings / bot_status tabloları
// - Status / restart / logout / qr / logs: bot'un kendi HTTP sunucusuna proxy
//
// Bot bağlantı bilgileri için iki env değişkeni gerekli:
//   BOT_INTERNAL_URL  -> bot'un admin HTTP'si (örn. http://bot-host:3002)
//   BOT_SHARED_TOKEN  -> bot ile paylaşılan token
// =====================================================================

const BOT_INTERNAL_URL = (process.env.BOT_INTERNAL_URL || '').replace(/\/$/, '');
const BOT_SHARED_TOKEN = process.env.BOT_SHARED_TOKEN || '';

const requireBotConfig = (res) => {
    if (!BOT_INTERNAL_URL || !BOT_SHARED_TOKEN) {
        res.status(503).json({
            error: 'Bot is not configured on the server (missing BOT_INTERNAL_URL or BOT_SHARED_TOKEN).'
        });
        return false;
    }
    return true;
};

const requireBotAuth = (req, res, next) => {
    const provided = req.header('x-bot-token') || (req.header('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!BOT_SHARED_TOKEN || provided !== BOT_SHARED_TOKEN) {
        return res.status(401).json({ error: 'Invalid bot token' });
    }
    next();
};

const proxyToBot = async (path, { method = 'GET', body } = {}) => {
    const url = `${BOT_INTERNAL_URL}${path}`;
    const init = {
        method,
        headers: {
            'x-bot-token': BOT_SHARED_TOKEN,
            ...(body ? { 'Content-Type': 'application/json' } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
    };
    const response = await fetch(url, init);
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    return { ok: response.ok, status: response.status, data };
};

// --- Bot Settings (CRUD) ---

// Bot kendi ayarlarını çekerken token doğrulaması yapıyor; admin paneli ise
// verifySuperAdmin kullanıyor (bot ayarları yalnızca süper admin'e açık).
// Yardımcı: ayarları her iki kaynaktan da okuyabilen handler
const fetchBotSettings = async () => {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
        .from('bot_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

    if (error) throw error;

    // Tablo henüz oluşturulmadıysa, frontend için boş şablon dön
    if (!data) {
        return {
            id: 1,
            enabled: true,
            listen_groups: false,
            ocr_languages: 'eng+tur',
            confidence_threshold: 40,
            match_score_threshold: 30,
            reply_with_steps: true,
            reply_with_images: true,
            reply_with_video: true,
            fallback_message: '❓ Gönderdiğiniz ekran görüntüsündeki hatayı veritabanımda bulamadım.\n\nDaha net bir fotoğraf göndermeyi deneyin veya ilgili departmana başvurun.',
            error_message: '⚠️ Görselinizi işlerken teknik bir sorun oluştu. Lütfen daha sonra tekrar deneyin.',
            disabled_message: '🤖 Bot şu anda devre dışı.',
            allowlist: [],
            blocklist: [],
            _missing: true
        };
    }
    return data;
};

// Bot kendi token'ı ile ayar çekiyor
app.get('/api/bot/settings', async (req, res) => {
    const provided = req.header('x-bot-token') || (req.header('authorization') || '').replace(/^Bearer\s+/i, '');
    const isBot = BOT_SHARED_TOKEN && provided === BOT_SHARED_TOKEN;

    // Bot değilse, süper admin doğrulamasından geçmeli
    if (!isBot) {
        return verifySuperAdmin(req, res, async () => {
            try {
                const settings = await fetchBotSettings();
                res.json(settings);
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });
    }

    try {
        if (!checkDb(res)) return;
        const settings = await fetchBotSettings();
        res.json(settings);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/bot/settings', verifySuperAdmin, async (req, res) => {
    if (!checkDb(res)) return;
    if (!req.isSuperAdmin) {
        return res.status(403).json({ error: 'Only Super Admins can change bot settings' });
    }

    const allowedKeys = [
        'enabled', 'listen_groups', 'ocr_languages',
        'confidence_threshold', 'match_score_threshold',
        'reply_with_steps', 'reply_with_images', 'reply_with_video',
        'fallback_message', 'error_message', 'disabled_message',
        'allowlist', 'blocklist'
    ];

    const payload = { id: 1, updated_at: new Date().toISOString() };
    for (const key of allowedKeys) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
            payload[key] = req.body[key];
        }
    }

    try {
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
            .from('bot_settings')
            .upsert(payload, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;

        // Bot'a "ayarları yeniden yükle" sinyali gönder (best effort)
        if (BOT_INTERNAL_URL && BOT_SHARED_TOKEN) {
            proxyToBot('/settings/reload', { method: 'POST' }).catch(() => {});
        }

        res.json(data);
    } catch (e) {
        console.error('PUT /api/bot/settings:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// --- Bot heartbeat (bot -> site) ---
app.post('/api/bot/heartbeat', requireBotAuth, async (req, res) => {
    if (!checkDb(res)) return;

    const { status, startedAt, connectedAt, jid, disconnectReason, lastError, stats } = req.body || {};
    const payload = {
        id: 1,
        status: status || 'unknown',
        started_at: startedAt || null,
        connected_at: connectedAt || null,
        jid: jid || null,
        disconnect_reason: typeof disconnectReason === 'number' ? disconnectReason : null,
        last_error: lastError || null,
        stats: stats || {},
        last_heartbeat_at: new Date().toISOString()
    };

    try {
        const client = supabaseAdmin || supabase;
        const { error } = await client
            .from('bot_status')
            .upsert(payload, { onConflict: 'id' });
        if (error) throw error;
        res.json({ ok: true });
    } catch (e) {
        // Tablo yoksa silently OK döneriz (kayıt tutulmuyor ama bot çalışmaya devam etsin)
        if (e.message && e.message.includes('bot_status')) {
            return res.json({ ok: true, warning: 'bot_status table missing' });
        }
        res.status(500).json({ error: e.message });
    }
});

// --- Bot Status (admin panel okuyor: önce DB, sonra canlı bot) ---
app.get('/api/bot/status', verifySuperAdmin, async (req, res) => {
    if (!checkDb(res)) return;

    let stored = null;
    try {
        const client = supabaseAdmin || supabase;
        const { data } = await client.from('bot_status').select('*').eq('id', 1).maybeSingle();
        stored = data || null;
    } catch { /* ignore */ }

    let live = null;
    let liveError = null;
    if (BOT_INTERNAL_URL && BOT_SHARED_TOKEN) {
        try {
            const r = await proxyToBot('/status');
            if (r.ok) live = r.data;
            else liveError = `bot returned ${r.status}`;
        } catch (e) {
            liveError = e.message;
        }
    } else {
        liveError = 'BOT_INTERNAL_URL not configured';
    }

    res.json({ stored, live, liveError });
});

// --- Bot QR ---
app.get('/api/bot/qr', verifySuperAdmin, async (_req, res) => {
    if (!requireBotConfig(res)) return;
    // Bota ulaşılamasa bile 200 dön (polling sırasında konsolu 502 ile doldurmamak için);
    // frontend dataUrl yoksa "QR yok / çevrimdışı" gösterir.
    try {
        const r = await proxyToBot('/qr');
        res.json(r.ok ? r.data : { dataUrl: null, unreachable: true, status: r.status });
    } catch (e) {
        res.json({ dataUrl: null, unreachable: true, error: e.message });
    }
});

// --- Bot Logs ---
app.get('/api/bot/logs', verifySuperAdmin, async (req, res) => {
    if (!requireBotConfig(res)) return;
    const limit = parseInt(req.query.limit || '200', 10);
    // Bota ulaşılamasa bile 200 + boş log dön (polling sırasında 502 konsol selini önler).
    try {
        const r = await proxyToBot(`/logs?limit=${limit}`);
        res.json(r.ok ? r.data : { logs: [], unreachable: true, status: r.status });
    } catch (e) {
        res.json({ logs: [], unreachable: true, error: e.message });
    }
});

// --- Bot Restart ---
app.post('/api/bot/restart', verifySuperAdmin, async (req, res) => {
    if (!req.isSuperAdmin) return res.status(403).json({ error: 'Super admin required' });
    if (!requireBotConfig(res)) return;
    try {
        const r = await proxyToBot('/restart', { method: 'POST' });
        res.status(r.status).json(r.data);
    } catch (e) {
        res.status(502).json({ error: e.message });
    }
});

// --- Bot Logout (yeni QR için oturum sıfırlama) ---
app.post('/api/bot/logout', verifySuperAdmin, async (req, res) => {
    if (!req.isSuperAdmin) return res.status(403).json({ error: 'Super admin required' });
    if (!requireBotConfig(res)) return;
    try {
        const r = await proxyToBot('/logout', { method: 'POST' });
        res.status(r.status).json(r.data);
    } catch (e) {
        res.status(502).json({ error: e.message });
    }
});

// =====================================================================
// Sosyal medya link önizlemeleri (WhatsApp, Facebook, Telegram...) için
// Open Graph meta etiketleri.
//
// /error/:id linki paylaşıldığında crawler'lar sayfanın <head> meta
// etiketlerini okuyup önizleme kartı üretir. SPA statik bir kabuk olduğu
// için hataya özel başlık/görsel yoktu; bu uç, crawler isteklerinde hatanın
// HTML'den temizlenmiş başlığını/özetini/görselini içeren küçük bir HTML
// döner. Gerçek kullanıcılar (tarayıcı) Vercel rewrite'ı sayesinde buraya
// hiç uğramaz; yine de güvenlik için crawler değilse SPA'ya düşeriz (next).
// =====================================================================

const CRAWLER_UA = /facebookexternalhit|WhatsApp|Twitterbot|Slackbot|TelegramBot|Discordbot|LinkedInBot|Googlebot|bingbot|redditbot|Embedly|Pinterest|vkShare|SkypeUriPreview/i;

// HTML etiketlerini ve sık kullanılan entity'leri düz metne çevirir.
const ogStripHtml = (input) => {
    if (input === null || input === undefined) return '';
    return String(input)
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();
};

// Temizlenmiş metni HTML attribute/içeriğine güvenle gömmek için kaçışlar.
const ogEscape = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

app.get('/error/:id', async (req, res, next) => {
    const ua = req.headers['user-agent'] || '';
    // Yalnızca crawler istekleri meta HTML alır; tarayıcılar normal SPA'ya gider.
    if (!CRAWLER_UA.test(ua)) return next();

    const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const host = req.headers['x-forwarded-host'] || req.headers.host || '';
    const base = (process.env.SITE_PUBLIC_URL || `${proto}://${host}`).replace(/\/$/, '');
    const pageUrl = `${base}/error/${req.params.id}`;

    // Hata bulunamasa bile geçerli bir kart dönsün diye varsayılanlar.
    let title = 'ENPLUS | Çözüm Kitapçığı';
    let description = 'Hata çözüm kitapçığı';
    let image = '';

    try {
        if (supabase) {
            const id = parseInt(req.params.id);
            const { data } = await supabase
                .from('errors')
                .select('title, summary, code, imageUrl, imageUrls')
                .eq('id', id)
                .single();

            if (data) {
                title = ogStripHtml(data.title) || data.code || 'Hata';
                description = ogStripHtml(data.summary) || (data.code ? `Kod: ${data.code}` : 'Çözüm adımları için bağlantıya tıklayın.');
                if (typeof data.imageUrl === 'string' && data.imageUrl.startsWith('http')) {
                    image = data.imageUrl;
                } else if (Array.isArray(data.imageUrls)) {
                    image = data.imageUrls.find((u) => typeof u === 'string' && u.startsWith('http')) || '';
                }
            }
        }
    } catch (e) {
        console.warn('OG meta fetch failed:', e.message);
    }

    if (description.length > 200) description = description.slice(0, 197) + '...';

    const t = ogEscape(title);
    const d = ogEscape(description);
    const u = ogEscape(pageUrl);
    const img = image ? ogEscape(image) : '';

    const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${t}</title>
<meta name="description" content="${d}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="ENPLUS Çözüm Kitapçığı" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:url" content="${u}" />
${img ? `<meta property="og:image" content="${img}" />` : ''}
<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
${img ? `<meta name="twitter:image" content="${img}" />` : ''}
</head>
<body>
<h1>${t}</h1>
<p>${d}</p>
<p><a href="${u}">Detaylı çözüm için tıklayın</a></p>
</body>
</html>`;

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    return res.send(html);
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
