/**
 * Axios instance with automatic Bearer token injection.
 * The access token is sourced from react-oidc-context's useAuth() hook.
 *
 * Since hooks can't be called outside React components, this module exports
 * a factory function `createApiClient(token)` called inside components/hooks.
 *
 * @module hooks/useApi
 */

import axios from 'axios';
import { useAuth } from 'react-oidc-context';
import { useMemo } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * React hook that returns an Axios instance with the current Bearer token
 * automatically injected into every request.
 *
 * @returns {import('axios').AxiosInstance}
 *
 * @example
 * const api = useApi();
 * const { data } = await api.get('/api/v2/users/me');
 */
export function useApi() {
    const auth = useAuth();

    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: BASE_URL,
            headers: { 'Content-Type': 'application/json' },
        });

        instance.interceptors.request.use((config) => {
            const token = auth.user?.access_token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        instance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Token expired — trigger silent renew or redirect to login
                    auth.signinSilent().catch(() => auth.signinRedirect());
                }
                return Promise.reject(error);
            }
        );

        return instance;
    }, [auth.user?.access_token]);

    return api;
}

export default useApi;
