'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import Dashboard from '@/components/Dashboard/Dashboard';

const queryClient = new QueryClient();

export default function App() {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    </SessionProvider>
  );
}