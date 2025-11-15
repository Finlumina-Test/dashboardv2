import 'react-router';
module 'virtual:load-fonts.jsx' {
	export function LoadFonts(): null;
}
declare module 'react-router' {
	interface AppLoadContext {
		// add context properties here
	}
}
declare module 'npm:stripe' {
	import Stripe from 'stripe';
	export default Stripe;
}
declare module '@auth/create/react' {
	import { SessionProvider } from '@auth/react';
	export { SessionProvider };
}

// Allow importing .jsx files
declare module '*.jsx' {
	const content: any;
	export default content;
}

// Allow importing .js files
declare module '*.js' {
	const content: any;
	export default content;
}
