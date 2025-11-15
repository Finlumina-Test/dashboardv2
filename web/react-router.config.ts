import type { Config } from '@react-router/dev/config';

export default {
	appDirectory: './src/app',
	ssr: true,
	// Disable prerendering - the not-found route loader uses fast-glob
	// which tries to scan src/ directory that doesn't exist in production
	// prerender: ['/*?'],
} satisfies Config;
