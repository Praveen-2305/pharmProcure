import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { LandingPage } from './pages/Landing/LandingPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { SubmitRequestPage } from './pages/SubmitRequest/SubmitRequestPage';
import { VendorReviewPage } from './pages/VendorReview/VendorReviewPage';
import { ApprovalQueuePage } from './pages/ApprovalQueue/ApprovalQueuePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/landing',
    element: <LandingPage />,
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'submit',
        element: <SubmitRequestPage />,
      },
      {
        path: 'review/:id',
        element: <VendorReviewPage />,
      },
      {
        path: 'queue',
        element: <ApprovalQueuePage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
