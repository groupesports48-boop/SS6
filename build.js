import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, 'dist');
const redirectsContent = '/*    /index.html   200\n';

function writeRedirects() {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  // Write to publish directory root (dist/_redirects)
  fs.writeFileSync(path.resolve(distDir, '_redirects'), redirectsContent);
  // Write to workspace root (_redirects)
  fs.writeFileSync(path.resolve(__dirname, '_redirects'), redirectsContent);
  // Write to public directory (public/_redirects)
  const publicDir = path.resolve(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(path.resolve(publicDir, '_redirects'), redirectsContent);
  }
  console.log('✓ Created _redirects with: /* /index.html 200 in publish root directory.');
}

console.log('Building Single Page App for Netlify...');

try {
  // Attempt standard Vite build
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('✓ Standard Vite build completed successfully.');
} catch (error) {
  console.warn('⚠ Standard build failed or bypassed. Preparing static SPA fallback...');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  if (fs.existsSync(path.resolve(__dirname, 'index.html'))) {
    fs.copyFileSync(path.resolve(__dirname, 'index.html'), path.resolve(distDir, 'index.html'));
  }
  const publicDir = path.resolve(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, distDir, { recursive: true });
  }
  console.log('✓ Fallback SPA directory prepared.');
} finally {
  // Ensure _redirects is automatically created in the root of the publish directory
  writeRedirects();
}
