const API_URL = '/api';

// Read Functions
export const getCategories = async () => {
    try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (e) {
        console.warn('API connection failed', e);
        return [];
    }
};

export const getAllErrors = async () => {
    try {
        const response = await fetch(`${API_URL}/errors`);
        if (!response.ok) throw new Error('Failed to fetch errors');
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
        const response = await fetch(`${API_URL}/errors/${id}`);
        if (!response.ok) throw new Error('Failed to fetch error');
        return await response.json();
    } catch (e) {
        console.error('API Error:', e);
        return null;
    }
};


// Write Functions
export const uploadVideo = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload-video`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Video yüklenirken hata oluştu');
    }

    const data = await response.json();
    return data.url;
};

export const addError = async (newError) => {
    // Sanitize payload to remove non-DB columns
    const payload = { ...newError };
    delete payload.assignee;
    delete payload.assignees;
    delete payload.error_assignees;
    delete payload.id; // ensure ID is not sent for creation

    const response = await fetch(`${API_URL}/errors`, {
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

    const response = await fetch(`${API_URL}/errors/${id}`, {
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
    const response = await fetch(`${API_URL}/errors/${id}`, {
        method: 'DELETE'
    });
    return response.ok;
};

export const incrementViewCount = async (id) => {
    try {
        const response = await fetch(`${API_URL}/errors/${id}/view`, {
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
        const response = await fetch(`${API_URL}/errors/${id}/reset-view`, {
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
        const response = await fetch(`${API_URL}/errors/reorder`, {
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
        const response = await fetch(`${API_URL}/guides`);
        if (!response.ok) throw new Error('Failed to fetch guides');
        return await response.json();
    } catch (e) {
        console.error('API Error:', e);
        return [];
    }
};

export const getGuideById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/guides/${id}`);
        if (!response.ok) throw new Error('Failed to fetch guide');
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

    const response = await fetch(`${API_URL}/guides`, {
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

    const response = await fetch(`${API_URL}/guides/${id}`, {
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
    const response = await fetch(`${API_URL}/guides/${id}`, {
        method: 'DELETE'
    });
    return response.ok;
};

export const incrementGuideViewCount = async (id) => {
    try {
        const response = await fetch(`${API_URL}/guides/${id}/view`, {
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

// --- Categories ---

export const addCategory = async (newCategory) => {
    const response = await fetch(`${API_URL}/categories`, {
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
    const response = await fetch(`${API_URL}/categories/${id}`, {
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
    const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'DELETE'
    });
    return response.ok;
};
