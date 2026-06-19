import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { RouteErrorFallback } from './components/error/ErrorFallback';
import { ReviewPage } from './pages/ReviewPage';
import { SubmittedPage } from './pages/SubmittedPage';
import { UploadPage } from './pages/UploadPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      errorElement: <RouteErrorFallback />,
      children: [
        { index: true, element: <ReviewPage /> },
        { path: 'submitted', element: <SubmittedPage /> },
        { path: 'upload', element: <UploadPage /> },
        { path: 'processing', element: <ProcessingPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
