import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllErrors } from '../services/api';

const useErrors = () => {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({
        query: '',
        category: null,
        date: null
    });

    // Fetch errors using React Query
    const { data: allErrors = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['errors'],
        queryFn: getAllErrors,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const refreshErrors = () => {
        refetch();
    };

    // Filter Logic
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

    // Helpers to update local cache (optimistic updates or simple cache updates)
    const addLocalError = (newError) => {
        queryClient.setQueryData(['errors'], (oldData) => {
            return oldData ? [newError, ...oldData] : [newError];
        });
    };

    const updateLocalError = (updatedError) => {
        queryClient.setQueryData(['errors'], (oldData) => {
            return oldData ? oldData.map(e => e.id === updatedError.id ? updatedError : e) : [];
        });
    };

    const removeLocalError = (id) => {
        queryClient.setQueryData(['errors'], (oldData) => {
            return oldData ? oldData.filter(e => e.id !== id) : [];
        });
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
