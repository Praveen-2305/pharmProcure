import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { LandingPage } from './pages/Landing/LandingPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { SubmitRequestPage } from './pages/SubmitRequest/SubmitRequestPage';
import { VendorReviewPage } from './pages/VendorReview/VendorReviewPage';
import { ApprovalQueuePage } from './pages/ApprovalQueue/ApprovalQueuePage';
import { PriceCheckPage } from './features/price-check/PriceCheckPage';
import { ImpactDashboardPage } from './features/impact/ImpactDashboardPage';
import { VendorComparisonPage } from './features/compare/VendorComparisonPage';
import { ContractAnalyzerPage } from './features/contract-analyzer/ContractAnalyzerPage';
import { VendorDirectoryPage } from './features/vendors/VendorDirectoryPage';
import { Vendor360Page } from './features/vendors/Vendor360Page';
import { AlertsCenterPage } from './features/alerts/AlertsCenterPage';
import { AuditTrailPage } from './pages/AuditTrail/AuditTrailPage';
import { BatchAuditPage } from './features/batch-audit/BatchAuditPage';

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
        path: 'audit',
        element: <AuditTrailPage />,
      },
      {
        path: 'batch-audit',
        element: <BatchAuditPage />,
      },
      {
        path: 'impact',
        element: <ImpactDashboardPage />,
      },
      {
        path: 'price-check',
        element: <PriceCheckPage />,
      },
      {
        path: 'compare',
        element: <VendorComparisonPage />,
      },
      {
        path: 'contract-analyzer',
        element: <ContractAnalyzerPage />,
      },
      {
        path: 'vendors',
        element: <VendorDirectoryPage />,
      },
      {
        path: 'vendors/:id',
        element: <Vendor360Page />,
      },
      {
        path: 'alerts',
        element: <AlertsCenterPage />,
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
