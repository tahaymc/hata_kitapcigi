import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllGuides } from '../services/api';

const useGuides = () => {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({
        query: '',
        category: null,
    });

    // Fetch guides
    const { data: allGuides = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['guides'],
        queryFn: getAllGuides,
        staleTime: 1000 * 60 * 5,
    });

    const refreshGuides = () => {
        refetch();
    };

    // Filter Logic
    const guides = useMemo(() => {
        let filtered = allGuides;

        if (filters.category) {
            filtered = filtered.filter(g => g.category === filters.category);
        }

        if (filters.query) {
            const q = filters.query.toLowerCase();
            filtered = filtered.filter(g =>
                g.title.toLowerCase().includes(q) ||
                (g.summary && g.summary.toLowerCase().includes(q))
            );
        }

        return filtered;
    }, [allGuides, filters]);

    // Helpers to update local cache
    const addLocalGuide = (newGuide) => {
        queryClient.setQueryData(['guides'], (oldData) => {
            return oldData ? [newGuide, ...oldData] : [newGuide];
        });
    };

    const updateLocalGuide = (updatedGuide) => {
        queryClient.setQueryData(['guides'], (oldData) => {
            return oldData ? oldData.map(g => g.id === updatedGuide.id ? updatedGuide : g) : [];
        });
    };

    const removeLocalGuide = (id) => {
        queryClient.setQueryData(['guides'], (oldData) => {
            return oldData ? oldData.filter(g => g.id !== id) : [];
        });
    };

    return {
        guides,
        loading,
        filters,
        setFilters,
        refreshGuides,
        addLocalGuide,
        updateLocalGuide,
        removeLocalGuide
    };
};

export default useGuides;
