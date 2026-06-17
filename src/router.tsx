import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ReviewPage } from './pages/ReviewPage';
import { SubmittedPage } from './pages/SubmittedPage';
import { UploadPage } from './pages/UploadPage';
import { ProcessingPage } from './pages/ProcessingPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <ReviewPage /> },
      { path: 'submitted', element: <SubmittedPage /> },
      { path: 'upload', element: <UploadPage /> },
      { path: 'processing', element: <ProcessingPage /> },
    ],
  },
]);
