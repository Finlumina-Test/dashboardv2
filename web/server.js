#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 4000;

console.log('========================================');
console.log('🚀 VOX Dashboard Server Starting');
console.log('========================================');
console.log('Port:', PORT);
console.log('Environment:', process.env.NODE_ENV);
console.log('Node Version:', process.version);
console.log('Working Directory:', process.cwd());
console.log('========================================');

async function startServer() {
  try {
    console.log('📦 Loading server build...');

    // The server is already configured to listen - just import it
    await import('./build/server/index.js');

    console.log('✅ Server module loaded successfully!');
    console.log(`🌐 Server should be listening on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log('🎉 VOX Dashboard is ready!');

  } catch (error) {
    console.error('❌ Server startup failed:');
    console.error(error);
    process.exit(1);
  }
}

startServer();
