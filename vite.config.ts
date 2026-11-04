import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plugin to automatically create _redirects in the root of the publish directory for Netlify SPA routing
function netlifyRedirectsPlugin(): Plugin {
  return {
    name: 'netlify-redirects',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '_redirects',
        source: '/*    /index.html   200\n',
      });
    },
    closeBundle() {
      try {
        const outDir = path.resolve(__dirname, 'dist');
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }
        fs.writeFileSync(path.resolve(outDir, '_redirects'), '/*    /index.html   200\n');
      } catch (err) {
        console.error('Error writing _redirects in closeBundle:', err);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), netlifyRedirectsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          login: path.resolve(__dirname, 'login.html'),
          dashboard: path.resolve(__dirname, 'dashboard.html'),
          schedule: path.resolve(__dirname, 'schedule.html'),
          lobbies: path.resolve(__dirname, 'lobbies.html'),
          tournamentDetail: path.resolve(__dirname, 'tournament-detail.html'),
          analyze: path.resolve(__dirname, 'analyze.html'),
          tournaments: path.resolve(__dirname, 'tournaments.html'),
          history: path.resolve(__dirname, 'history.html'),
          profitLoss: path.resolve(__dirname, 'profit-loss.html'),
          profile: path.resolve(__dirname, 'profile.html'),
          notifications: path.resolve(__dirname, 'notifications.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
