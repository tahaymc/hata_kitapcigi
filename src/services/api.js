import { supabase } from '../utils/supabaseClient';

const API_URL = '/api';

let authToken = null;

export const setAuthToken = (token) => {
    authToken = token;
};

const getFreshToken = async () => {
    try {
        let { data } = await supabase.auth.getSession();
        let session = data?.session;

        // Uzun süren işlemlerde (ör. büyük video yükleme) access token süresi
        // dolmuş ve otomatik yenileme tetiklenmemiş olabilir. Bu durumda
        // token boş dönüp "Authorization header missing" 401'ine yol açar.
        // Token yoksa açıkça yenilemeyi dene.
        if (!session?.access_token) {
            const { data: refreshed } = await supabase.auth.refreshSession();
            session = refreshed?.session;
        }

        const token = session?.access_token || null;
        if (token) authToken = token;
        return token || authToken;
    } catch {
        return authToken;
    }
};

const customFetch = async (url, options = {}) => {
    const headers = {
        ...options.headers,
    };

    const token = await getFreshToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    return response;
};

export const createUser = async (userData) => {
    const response = await customFetch(`${API_URL}/admin/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'User creation failed');
    }
    return await response.json();
};

export const getDepartments = async () => {
    try {
        const response = await customFetch(`${API_URL}/departments`);
        if (!response.ok) throw new Error('Failed to fetch departments');
        return await response.json();
    } catch (e) {
        console.error('API Error:', e);
        return [];
    }
};

export const getPeople = async () => {
    try {
        const response = await customFetch(`${API_URL}/people`);
        if (!response.ok) throw new Error('Failed to fetch people');
        return await response.json();
    } catch (e) {
        console.error('API Error:', e);
        return [];
    }
};





// Read Functions
export const getCategories = async () => {
    try {
        const response = await customFetch(`${API_URL}/categories`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (e) {
        console.warn('API connection failed', e);
        return [];
    }
};

export const getAllErrors = async () => {
    try {
        const response = await customFetch(`${API_URL}/errors`);
        if (!response.ok) throw new Error('Failed to customFetch errors');
        return await response.json();
    } catch (e) {
        console.error('API Error:', e);
        return [];
    }
};

export const searchErrors = async (query, categoryId, date) => {
    try {
        // Fetch all and filter client side for simplicity
        const allErrors = await getAllErrors();
        let filtered = allErrors;

        if (categoryId) {
            filtered = filtered.filter(e => e.category === categoryId);
        }

        if (date) {
            filtered = filtered.filter(e => e.date === date);
        }

        if (query) {
            const q = query.toLowerCase();
            filtered = filtered.filter(e =>
                e.title.toLowerCase().includes(q) ||
                (e.summary && e.summary.toLowerCase().includes(q)) ||
                (e.code && e.code.toLowerCase().includes(q))
            );
        }

        return filtered;
    } catch (e) {
        console.error("Search failed:", e);
        return [];
    }
};

export const getErrorById = async (id) => {
    try {
        const response = await customFetch(`${API_URL}/errors/${id}`);
        if (!response.ok) throw new Error('Failed to customFetch error');
        return await response.json();
    } catch (e) {
        console.error('API Error:', e);
        return null;
    }
};


// Write Functions
export const uploadVideo = async (file) => {
    try {
        // 1. Get Signed URL
        const genResponse = await customFetch(`${API_URL}/generate-upload-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: file.name,
                type: file.type
            })
        });

        if (!genResponse.ok) {
            const errData = await genResponse.json();
            throw new Error(errData.error || 'Upload URL oluşturulamadı');
        }

        const { signedUrl, publicUrl } = await genResponse.json();

        // 2. Upload directly to storage via Signed URL
        // NOT: İmzalı URL kendi yetkilendirme token'ını query string'de taşır.
        // customFetch kullanıp kullanıcının JWT'sini Authorization header'ı
        // olarak eklemek hatalıdır; bu yüzden düz fetch kullanıyoruz.
        const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type
            },
            body: file
        });

        if (!uploadResponse.ok) {
            throw new Error('Dosya yükleme başarısız oldu (Storage)');
        }

        return publicUrl;
    } catch (e) {
        console.error('Video Upload Error:', e);
        throw e;
    }
};

export const addError = async (newError) => {
    // Sanitize payload to remove non-DB columns
    const payload = { ...newError };
    delete payload.assignee;
    delete payload.assignees;
    delete payload.error_assignees;
    delete payload.id; // ensure ID is not sent for creation

    const response = await customFetch(`${API_URL}/errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Veri eklenirken sunucu hatası oluştu');
    }

    return data;
};

export const updateError = async (id, updatedData) => {
    // Sanitize payload
    const payload = { ...updatedData };
    delete payload.assignee;
    delete payload.assignees;
    delete payload.error_assignees;
    // assignee_ids should be kept as it's processed by backend for relation

    const response = await customFetch(`${API_URL}/errors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Güncelleme yapılırken sunucu hatası oluştu');
    }

    return await response.json();
};

export const deleteError = async (id) => {
    const response = await customFetch(`${API_URL}/errors/${id}`, {
        method: 'DELETE'
    });
    return response.ok;
};

export const incrementViewCount = async (id) => {
    try {
        const response = await customFetch(`${API_URL}/errors/${id}/view`, {
            method: 'POST'
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (e) {
        console.error("Failed to increment view count", e);
    }
    return null;
};

export const resetViewCount = async (id) => {
    try {
        const response = await customFetch(`${API_URL}/errors/${id}/reset-view`, {
            method: 'POST'
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (e) {
        console.error("Failed to reset view count", e);
    }
    return null;
};

export const reorderErrors = async (orderedIds) => {
    try {
        const response = await customFetch(`${API_URL}/errors/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderedIds })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Reorder failed');
        }
        return await response.json();
    } catch (e) {
        console.error('Failed to reorder errors', e);
        throw e;
    }
};

// --- Guides ---

export const getAllGuides = async () => {
    try {
        const response = await customFetch(`${API_URL}/guides`);
        if (!response.ok) throw new Error('Failed to customFetch guides');
        return await response.json();
    } catch (e) {
        console.error('API Error:', e);
        return [];
    }
};

export const getGuideById = async (id) => {
    try {
        const response = await customFetch(`${API_URL}/guides/${id}`);
        if (!response.ok) throw new Error('Failed to customFetch guide');
        return await response.json();
    } catch (e) {
        console.error('API Error:', e);
        return null;
    }
};

export const addGuide = async (newGuide) => {
    const payload = { ...newGuide };
    delete payload.assignee;
    delete payload.assignees;
    delete payload.guide_assignees;
    delete payload.id;

    const response = await customFetch(`${API_URL}/guides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Guide creation failed');
    }
    return data;
};

export const updateGuide = async (id, updatedData) => {
    const payload = { ...updatedData };
    delete payload.assignee;
    delete payload.assignees;
    delete payload.guide_assignees;

    const response = await customFetch(`${API_URL}/guides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Guide update failed');
    }
    return await response.json();
};

export const deleteGuide = async (id) => {
    const response = await customFetch(`${API_URL}/guides/${id}`, {
        method: 'DELETE'
    });
    return response.ok;
};

export const incrementGuideViewCount = async (id) => {
    try {
        const response = await customFetch(`${API_URL}/guides/${id}/view`, {
            method: 'POST'
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (e) {
        console.error("Failed to increment guide view count", e);
    }
    return null;
};

export const resetGuideViewCount = async (id) => {
    try {
        const response = await customFetch(`${API_URL}/guides/${id}/reset-view`, {
            method: 'POST'
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (e) {
        console.error("Failed to reset guide view count", e);
    }
    return null;
};

export const reorderGuides = async (orderedIds) => {
    try {
        const response = await customFetch(`${API_URL}/guides/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderedIds })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Reorder failed');
        }
        return await response.json();
    } catch (e) {
        console.error('Failed to reorder guides', e);
        throw e;
    }
};

// --- Categories ---

export const addCategory = async (newCategory) => {
    const response = await customFetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Category creation failed');
    }
    return await response.json();
};

export const updateCategory = async (id, updatedData) => {
    const response = await customFetch(`${API_URL}/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Category update failed');
    }
    return await response.json();
};

export const deleteCategory = async (id) => {
    const response = await customFetch(`${API_URL}/categories/${id}`, {
        method: 'DELETE'
    });
    return response.ok;
};

// --- Bot ---

const handleBotResponse = async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || `Bot API error (${response.status})`);
    }
    return data;
};

export const getBotSettings = async () => {
    const r = await customFetch(`${API_URL}/bot/settings`);
    return handleBotResponse(r);
};

export const updateBotSettings = async (payload) => {
    const r = await customFetch(`${API_URL}/bot/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return handleBotResponse(r);
};

export const getBotStatus = async () => {
    const r = await customFetch(`${API_URL}/bot/status`);
    return handleBotResponse(r);
};

export const getBotQr = async () => {
    const r = await customFetch(`${API_URL}/bot/qr`);
    if (r.status === 404) return null;
    return handleBotResponse(r);
};

export const getBotLogs = async (limit = 200) => {
    const r = await customFetch(`${API_URL}/bot/logs?limit=${limit}`);
    return handleBotResponse(r);
};

export const restartBot = async () => {
    const r = await customFetch(`${API_URL}/bot/restart`, { method: 'POST' });
    return handleBotResponse(r);
};

export const logoutBot = async () => {
    const r = await customFetch(`${API_URL}/bot/logout`, { method: 'POST' });
    return handleBotResponse(r);
};
