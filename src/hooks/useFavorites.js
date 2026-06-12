import { useState, useEffect, useCallback } from 'react';

/**
 * useFavorites — Tarayıcı localStorage tabanlı favori yönetimi
 * --------------------------------------------------------------------------
 * Giriş gerektirmez; favoriler kullanıcının tarayıcısında (cihaz bazlı) saklanır.
 *
 * kind: 'errors' | 'guides'  → her tür kendi listesini tutar.
 *
 * Dönen değerler:
 *   favoriteIds  : string[]  (favori kayıt id'leri, eklenme sırasıyla)
 *   isFavorite(id): boolean
 *   toggle(id)   : favoriye ekler/çıkarır
 *   count        : number
 *
 * Notlar:
 *   - Aynı sekmedeki diğer bileşenler `enplus-favorites-changed` custom event'i ile,
 *     farklı sekmeler ise native `storage` event'i ile senkronlanır.
 *   - id'ler string'e normalize edilir (sayısal/uuid karışık olabilir).
 */

const keyFor = (kind) => `enplus-fav-${kind === 'guides' ? 'guides' : 'errors'}`;

const readStore = (kind) => {
    try {
        const raw = localStorage.getItem(keyFor(kind));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
};

const writeStore = (kind, ids) => {
    try {
        localStorage.setItem(keyFor(kind), JSON.stringify(ids));
        // Aynı sekmedeki diğer useFavorites örneklerini haberdar et
        window.dispatchEvent(new CustomEvent('enplus-favorites-changed', { detail: { kind } }));
    } catch {
        /* localStorage kapalı/dolu olabilir — sessizce geç */
    }
};

export default function useFavorites(kind = 'errors') {
    const [favoriteIds, setFavoriteIds] = useState(() => readStore(kind));

    // Tür değişince yeniden oku
    useEffect(() => {
        setFavoriteIds(readStore(kind));
    }, [kind]);

    // Senkron: aynı sekme (custom event) + farklı sekme (storage event)
    useEffect(() => {
        const refresh = (e) => {
            // custom event ise yalnız ilgili kind'de güncelle
            if (e?.detail?.kind && e.detail.kind !== kind) return;
            setFavoriteIds(readStore(kind));
        };
        const onStorage = (e) => {
            if (e.key === keyFor(kind)) setFavoriteIds(readStore(kind));
        };
        window.addEventListener('enplus-favorites-changed', refresh);
        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener('enplus-favorites-changed', refresh);
            window.removeEventListener('storage', onStorage);
        };
    }, [kind]);

    const isFavorite = useCallback(
        (id) => favoriteIds.includes(String(id)),
        [favoriteIds]
    );

    const toggle = useCallback((id) => {
        const sid = String(id);
        setFavoriteIds(prev => {
            const next = prev.includes(sid)
                ? prev.filter(x => x !== sid)
                : [...prev, sid];
            writeStore(kind, next);
            return next;
        });
    }, [kind]);

    // Tüm favori sırasını yeniden yaz (sürükle-bırak sonrası).
    // newIds: favorilerin YENİ tam sırası (string'e normalize edilir).
    const reorder = useCallback((newIds) => {
        const next = (Array.isArray(newIds) ? newIds : []).map(String);
        setFavoriteIds(next);
        writeStore(kind, next);
    }, [kind]);

    return {
        favoriteIds,
        isFavorite,
        toggle,
        reorder,
        count: favoriteIds.length,
    };
}
