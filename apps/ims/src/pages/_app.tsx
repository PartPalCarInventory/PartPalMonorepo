import { useState } from 'react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { analytics } from '@partpal/shared-utils';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useRouter } from 'next/router';
import '../styles/globals.css';

// Routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/'];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
      },
    },
  }));

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(router.pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isPublicRoute ? (
          <Component {...pageProps} />
        ) : (
          <ProtectedRoute>
            <Component {...pageProps} />
          </ProtectedRoute>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default MyApp;