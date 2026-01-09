import { useState, useEffect, useMemo } from 'react';
import { getAllErrors } from '../services/api';

const useErrors = () => {
    const [allErrors, setAllErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        query: '',
        category: null,
        date: null
    });

    const refreshErrors = async () => {
        setLoading(true);
        try {
            const data = await getAllErrors();
            setAllErrors(data);
        } catch (error) {
            console.error("Failed to fetch errors:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        refreshErrors();
    }, []);

    const errors = useMemo(() => {
        let filtered = allErrors;

        if (filters.category) {
            filtered = filtered.filter(e => e.category === filters.category);
        }

        if (filters.date) {
            filtered = filtered.filter(e => e.date === filters.date);
        }

        if (filters.query) {
            const q = filters.query.toLowerCase();
            filtered = filtered.filter(e =>
                e.title.toLowerCase().includes(q) ||
                (e.summary && e.summary.toLowerCase().includes(q)) ||
                (e.code && e.code.toLowerCase().includes(q))
            );
        }

        return filtered;
    }, [allErrors, filters]);

    // Helpers to update local state without full refetch (optimistic updates)
    const addLocalError = (newError) => {
        setAllErrors(prev => [newError, ...prev]);
    };

    const updateLocalError = (updatedError) => {
        setAllErrors(prev => prev.map(e => e.id === updatedError.id ? updatedError : e));
    };

    const removeLocalError = (id) => {
        setAllErrors(prev => prev.filter(e => e.id !== id));
    };


    return {
        errors,
        loading,
        filters,
        setFilters,
        refreshErrors,
        addLocalError,
        updateLocalError,
        removeLocalError
    };
};

export default useErrors;
