import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { oidcConfig } from './oidc-config';
import { queryClient } from './lib/queryClient';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider {...oidcConfig}>
            <QueryClientProvider client={queryClient}>
                <App />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1A2540',
                            color: '#F5F5F0',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            fontSize: '14px',
                        },
                        success: { iconTheme: { primary: '#10B981', secondary: '#1A2540' } },
                        error: { iconTheme: { primary: '#EF4444', secondary: '#1A2540' } },
                    }}
                />
            </QueryClientProvider>
        </AuthProvider>
    </React.StrictMode>
);
