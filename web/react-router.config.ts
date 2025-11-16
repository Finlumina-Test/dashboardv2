import type { Config } from '@react-router/dev/config';
import { route } from '@react-router/dev/routes';

export default {
	appDirectory: './src/app',
	ssr: true,
	// Disable prerendering - the not-found route loader uses fast-glob
	// which tries to scan src/ directory that doesn't exist in production
	// prerender: ['/*?'],
	async routes() {
		// Import the default routes from routes.ts
		const defaultRoutes = (await import('./src/app/routes')).default;

		// Add API routes manually
		const apiRoutes = [
			route('/api/calls/save', './src/app/api/calls/save/route.js'),
			route('/api/calls/list', './src/app/api/calls/list/route.js'),
			route('/api/calls/details/:id', './src/app/api/calls/details/[id]/route.js'),
			route('/api/upload', './src/app/api/upload/route.js'),
			route('/api/auth/token', './src/app/api/auth/token/route.js'),
			route('/api/auth/expo-web-success', './src/app/api/auth/expo-web-success/route.js'),
			route('/api/validate-session/:sessionId', './src/app/api/validate-session/[sessionId]/route.js'),
			route('/api/__create/ssr-test', './src/app/api/__create/ssr-test/route.js'),
		];

		return [...apiRoutes, ...defaultRoutes];
	},
} satisfies Config;
