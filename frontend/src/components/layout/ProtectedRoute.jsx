/**
 * ProtectedRoute — guards routes behind Keycloak authentication.
 * Checks PostgreSQL for true Role-Based Access Control (RBAC).
 * @module components/layout/ProtectedRoute
 */

import { useState, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../ui/Spinner';

export function ProtectedRoute({ children, allowedRoles }) {
    const auth = useAuth();
    const [dbRole, setDbRole] = useState(null);
    const [checkingRole, setCheckingRole] = useState(!!allowedRoles);
    const [authFailed, setAuthFailed] = useState(false);

    useEffect(() => {
        // If we don't need to check roles, or the user isn't logged in, skip the DB check
        if (!allowedRoles || !auth.isAuthenticated || !auth.user?.access_token) {
            setCheckingRole(false);
            return;
        }

        const checkDatabaseRole = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/users/me`, {
                    headers: {
                        Authorization: `Bearer ${auth.user.access_token}`
                    }
                });
                setDbRole(response.data.role);
            } catch (error) {
                console.error("Failed to verify role in database", error);
                setAuthFailed(true);
            } finally {
                setCheckingRole(false);
            }
        };

        checkDatabaseRole();
    }, [auth.isAuthenticated, auth.user?.access_token, allowedRoles]);

    // 1. Wait for Keycloak
    if (auth.isLoading) {
        return <div className="min-h-screen bg-[#0F1729] flex items-center justify-center"><Spinner size="lg" /></div>;
    }

    // 2. Redirect to login if not authenticated
    if (!auth.isAuthenticated) {
        auth.signinRedirect();
        return null;
    }

    // 3. Wait for PostgreSQL role check
    if (checkingRole) {
        return <div className="min-h-screen bg-[#0F1729] flex items-center justify-center"><Spinner size="lg" /></div>;
    }

    // 4. RBAC Check
    if (allowedRoles) {
        if (authFailed || !allowedRoles.includes(dbRole)) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children;
}

export default ProtectedRoute;