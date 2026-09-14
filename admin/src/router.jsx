import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, GuestRoute } from './components/guards/RouteGuards';
import { RouteError } from './components/common/RouteError';
import {
  ChallanListPageSkeleton, ClientDetailSkeleton, ClientsPageSkeleton, CreateChallanSkeleton, DashboardSkeleton,
  DescriptionsPageSkeleton, LoginSkeleton, SettingsPageSkeleton, SimplePageSkeleton,
} from './components/common/Skeletons';

// Route-level code splitting: each page ships in its own chunk.
const pages = {
  login: () => import('./pages/auth/LoginPage'),
  dashboard: () => import('./pages/dashboard/DashboardPage'),
  dashboardChart: () => import('./pages/dashboard/CashBarChart'),
  challans: () => import('./pages/challans/ChallansPage'),
  createChallan: () => import('./pages/challans/CreateChallanPage'),
  clients: () => import('./pages/clients/ClientsPage'),
  clientDetail: () => import('./pages/clients/ClientDetailPage'),
  descriptions: () => import('./pages/descriptions/DescriptionsPage'),
  settings: () => import('./pages/settings/SettingsPage'),
  notFound: () => import('./pages/NotFoundPage'),
};

const LoginPage = lazy(pages.login);
const DashboardPage = lazy(pages.dashboard);
const ChallansPage = lazy(pages.challans);
const CreateChallanPage = lazy(pages.createChallan);
const ClientsPage = lazy(pages.clients);
const ClientDetailPage = lazy(pages.clientDetail);
const DescriptionsPage = lazy(pages.descriptions);
const SettingsPage = lazy(pages.settings);
const NotFoundPage = lazy(pages.notFound);

const PRELOADS = [
  [/^\/login\/?$/, [pages.login]],
  [/^\/$/, [pages.dashboard, pages.dashboardChart]],
  [/^\/challans\/new\/?$/, [pages.createChallan]],
  [/^\/challans\/?$/, [pages.challans]],
  [/^\/clients\/?$/, [pages.clients]],
  [/^\/clients\/[^/]+\/?$/, [pages.clientDetail]],
  [/^\/descriptions\/?$/, [pages.descriptions]],
  [/^\/settings\/?$/, [pages.settings]],
];

/** Preloads page chunks for the opened URL in parallel with the session refresh. */
function preloadRoute(pathname) {
  const match = PRELOADS.find(([pattern]) => pattern.test(pathname));
  // Errors are ignored; React.lazy retries and reports them on render.
  match?.[1].forEach((load) => load().catch(() => {}));
}

preloadRoute(window.location.pathname);

// Each route falls back to a skeleton shaped like the page it is loading.
const withSuspense = (element, Fallback) => <Suspense fallback={<Fallback />}>{element}</Suspense>;

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    errorElement: <RouteError />,
    children: [{ path: '/login', element: withSuspense(<LoginPage />, LoginSkeleton) }],
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            // Pathless error boundary keeps the sidebar and top bar usable.
            errorElement: <RouteError inline />,
            children: [
              { index: true, element: withSuspense(<DashboardPage />, DashboardSkeleton) },
              { path: 'challans', element: withSuspense(<ChallansPage />, ChallanListPageSkeleton) },
              { path: 'challans/new', element: withSuspense(<CreateChallanPage />, CreateChallanSkeleton) },
              { path: 'clients', element: withSuspense(<ClientsPage />, ClientsPageSkeleton) },
              { path: 'clients/:id', element: withSuspense(<ClientDetailPage />, ClientDetailSkeleton) },
              { path: 'descriptions', element: withSuspense(<DescriptionsPage />, DescriptionsPageSkeleton) },
              { path: 'settings', element: withSuspense(<SettingsPage />, SettingsPageSkeleton) },
              { path: '*', element: withSuspense(<NotFoundPage />, SimplePageSkeleton) },
            ],
          },
        ],
      },
    ],
  },
]);
