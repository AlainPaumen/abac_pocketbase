import { 
  createRootRoute, 
  createRoute, 
  createRouter,
  Outlet,
  redirect
} from '@tanstack/react-router';
import { PocketBaseProvider } from './contexts/PocketBaseContext';
import { Toaster } from './components/ui/toaster';

// Import pages
import Dashboard from './pages/Dashboard';
import ResourcesPage from './pages/ResourcesPage';
import ActionsPage from './pages/ActionsPage';
import RolesPage from './pages/RolesPage';
import PermissionsPage from './pages/PermissionsPage';
import PermissionTestPage from './pages/PermissionTestPage';
import LoginPage from './pages/LoginPage';

// Root layout component
const RootLayout = () => {
  return (
    <PocketBaseProvider>
      <Outlet />
      <Toaster />
    </PocketBaseProvider>
  );
};

// Define routes
const rootRoute = createRootRoute({
  component: RootLayout,
});

// Login route (public)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Protected route loader
const protectedLoader = () => {
  // Get the PocketBase instance from localStorage
  const authStoreData = localStorage.getItem('pocketbase_auth');
  
  // Check if the user is authenticated
  if (!authStoreData || !JSON.parse(authStoreData).token) {
    throw redirect({
      to: '/login',
    });
  }
  
  return {};
};

// Dashboard route (protected)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
  beforeLoad: protectedLoader,
});

const resourcesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/resources',
  component: ResourcesPage,
  beforeLoad: protectedLoader,
});

const actionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/actions',
  component: ActionsPage,
  beforeLoad: protectedLoader,
});

const rolesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/roles',
  component: RolesPage,
  beforeLoad: protectedLoader,
});

const permissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/permissions',
  component: PermissionsPage,
  beforeLoad: protectedLoader,
});

const permissionTestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/test',
  component: PermissionTestPage,
  beforeLoad: protectedLoader,
});

// Create and export the router
const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  resourcesRoute,
  actionsRoute,
  rolesRoute,
  permissionsRoute,
  permissionTestRoute,
]);

export const router = createRouter({ routeTree });

// Register the router for maximum type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
