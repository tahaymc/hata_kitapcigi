import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { setAuthToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                handleUser(session.user, session.access_token);
            } else {
                setAuthToken(null);
                setLoading(false);
            }
        });

        // Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                handleUser(session.user, session.access_token);
            } else {
                setUser(null);
                setProfile(null);
                setAuthToken(null);
                setLoading(false);
            }
        });

        return () => subscription?.unsubscribe();
    }, []);

    const handleUser = async (user, token) => {
        setUser(user);
        setAuthToken(token); // IMPORTANT: set token immediately for API calls

        // Fetch Profile
        try {
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .eq('auth_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching profile", error);
            }

            if (data) {
                setProfile(data);
            } else {
                // Determine if we should treat as guest or just user without profile
                setProfile(null);
            }
        } catch (e) {
            console.error("Error fetching profile exception", e);
        }
        setLoading(false);
    };

    const signIn = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/'; // Force redirect to home/login
    };

    const value = {
        user,
        profile,
        loading,
        signIn,
        signOut,
        isAdmin: (profile?.role === 'admin' || profile?.access_role === 'admin'),
        isSuperAdmin: (profile?.role === 'admin' || profile?.access_role === 'admin'),
        userDepartmentId: null
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
