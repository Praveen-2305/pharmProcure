import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { SubmitRequestPage } from './pages/SubmitRequest/SubmitRequestPage';
import { VendorReviewPage } from './pages/VendorReview/VendorReviewPage';
import { ApprovalQueuePage } from './pages/ApprovalQueue/ApprovalQueuePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
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
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
