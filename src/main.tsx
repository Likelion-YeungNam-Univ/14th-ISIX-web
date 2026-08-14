import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import '@/styles/global.css';

// 상담 테스트 하네스 — 마운트 협의가 끝나면 VoiceLab 과 함께 지웁니다.
const VoiceLab = import.meta.env.DEV ? React.lazy(() => import('@/dev/VoiceLab')) : null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        {VoiceLab && (
          <React.Suspense fallback={null}>
            <VoiceLab />
          </React.Suspense>
        )}
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
