import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';

const API_BASENAME = '/api';
const api = new Hono();

// Get current directory
const __dirname = join(fileURLToPath(new URL('.', import.meta.url)), '../src/app/api');
if (globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

// Recursively find all route.js files
async function findRouteFiles(dir: string): Promise<string[]> {
  try {
    const files = await readdir(dir);
    let routes: string[] = [];

    for (const file of files) {
      try {
        const filePath = join(dir, file);
        const statResult = await stat(filePath);

        if (statResult.isDirectory()) {
          routes = routes.concat(await findRouteFiles(filePath));
        } else if (file === 'route.js') {
          // Handle root route.js specially
          if (filePath === join(__dirname, 'route.js')) {
            routes.unshift(filePath); // Add to beginning of array
          } else {
            routes.push(filePath);
          }
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }

    return routes;
  } catch (error) {
    // Directory doesn't exist in production build - return empty array
    console.log('API routes directory not found, skipping API route registration');
    return [];
  }
}

// Helper function to transform file path to Hono route path
function getHonoPath(routeFile: string): { name: string; pattern: string }[] {
  const relativePath = routeFile.replace(__dirname, '');
  const parts = relativePath.split('/').filter(Boolean);
  const routeParts = parts.slice(0, -1); // Remove 'route.js'
  if (routeParts.length === 0) {
    return [{ name: 'root', pattern: '' }];
  }
  const transformedParts = routeParts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (match) {
      const [_, dots, param] = match;
      return dots === '...'
        ? { name: param, pattern: `:${param}{.+}` }
        : { name: param, pattern: `:${param}` };
    }
    return { name: segment, pattern: segment };
  });
  return transformedParts;
}

// Helper function to register a route with Hono
function registerRoute(route: any, path: string, method: string) {
  const handler: Handler = async (c) => {
    const params = c.req.param();
    return await route[method](c.req.raw, { params });
  };
  const methodLowercase = method.toLowerCase();
  switch (methodLowercase) {
    case 'get':
      api.get(path, handler);
      console.log(`✅ Registered GET ${path}`);
      break;
    case 'post':
      api.post(path, handler);
      console.log(`✅ Registered POST ${path}`);
      break;
    case 'put':
      api.put(path, handler);
      console.log(`✅ Registered PUT ${path}`);
      break;
    case 'delete':
      api.delete(path, handler);
      console.log(`✅ Registered DELETE ${path}`);
      break;
    case 'patch':
      api.patch(path, handler);
      console.log(`✅ Registered PATCH ${path}`);
      break;
    default:
      console.warn(`Unsupported method: ${method}`);
      break;
  }
}

// Import and register all routes
async function registerRoutes() {
  // Clear existing routes
  api.routes = [];

  // In production, explicitly import routes since filesystem scanning won't work
  if (!import.meta.env.DEV) {
    console.log('🔧 Registering API routes (production mode)...');

    try {
      // Import all API routes explicitly
      const callsSave = await import('../src/app/api/calls/save/route.js');
      const callsList = await import('../src/app/api/calls/list/route.js');
      const callsDetails = await import('../src/app/api/calls/details/[id]/route.js');
      const upload = await import('../src/app/api/upload/route.js');
      const authToken = await import('../src/app/api/auth/token/route.js');
      const authExpoSuccess = await import('../src/app/api/auth/expo-web-success/route.js');
      const validateSession = await import('../src/app/api/validate-session/[sessionId]/route.js');
      const ssrTest = await import('../src/app/api/__create/ssr-test/route.js');

      // Register each route with its path and methods
      const routes = [
        { module: callsSave, path: '/calls/save', methods: ['POST'] },
        { module: callsList, path: '/calls/list', methods: ['GET'] },
        { module: callsDetails, path: '/calls/details/:id', methods: ['GET'] },
        { module: upload, path: '/upload', methods: ['POST'] },
        { module: authToken, path: '/auth/token', methods: ['GET', 'POST'] },
        { module: authExpoSuccess, path: '/auth/expo-web-success', methods: ['GET'] },
        { module: validateSession, path: '/validate-session/:sessionId', methods: ['GET'] },
        { module: ssrTest, path: '/__create/ssr-test', methods: ['GET', 'POST'] },
      ];

      for (const { module, path, methods } of routes) {
        for (const method of methods) {
          if (module[method]) {
            registerRoute(module, path, method);
          }
        }
      }

      console.log('✅ All API routes registered successfully');
    } catch (error) {
      console.error('❌ Error registering production routes:', error);
    }
    return;
  }

  // In development, use filesystem scanning
  console.log('🔧 Scanning for API routes (development mode)...');
  const routeFiles = (
    await findRouteFiles(__dirname).catch((error) => {
      console.error('Error finding route files:', error);
      return [];
    })
  )
    .slice()
    .sort((a, b) => {
      return b.length - a.length;
    });

  for (const routeFile of routeFiles) {
    try {
      const route = await import(/* @vite-ignore */ `${routeFile}?update=${Date.now()}`);

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      for (const method of methods) {
        try {
          if (route[method]) {
            const parts = getHonoPath(routeFile);
            const honoPath = `/${parts.map(({ pattern }) => pattern).join('/')}`;
            const handler: Handler = async (c) => {
              const params = c.req.param();
              const updatedRoute = await import(
                /* @vite-ignore */ `${routeFile}?update=${Date.now()}`
              );
              return await updatedRoute[method](c.req.raw, { params });
            };
            const methodLowercase = method.toLowerCase();
            switch (methodLowercase) {
              case 'get':
                api.get(honoPath, handler);
                break;
              case 'post':
                api.post(honoPath, handler);
                break;
              case 'put':
                api.put(honoPath, handler);
                break;
              case 'delete':
                api.delete(honoPath, handler);
                break;
              case 'patch':
                api.patch(honoPath, handler);
                break;
              default:
                console.warn(`Unsupported method: ${method}`);
                break;
            }
          }
        } catch (error) {
          console.error(`Error registering route ${routeFile} for method ${method}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error importing route file ${routeFile}:`, error);
    }
  }
}

// Initial route registration
await registerRoutes();

// Hot reload routes in development
if (import.meta.env.DEV) {
  import.meta.glob('../src/app/api/**/route.js', {
    eager: true,
  });
  if (import.meta.hot) {
    import.meta.hot.accept((newSelf) => {
      registerRoutes().catch((err) => {
        console.error('Error reloading routes:', err);
      });
    });
  }
}

export { api, API_BASENAME };
