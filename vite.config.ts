
import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';
  import fs from 'fs';
  
  // Load environment variables prioritizing .env.local, then .env


  function devOpenRouterProxy() {
    return {
      name: 'dev-openrouter-proxy',
      apply: 'serve',
  configureServer(server: any) {
        function loadOpenRouterKey(): string | undefined {
          if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
          const candidates = ['.env.local', '.env'];
          for (const file of candidates) {
            const p = path.resolve(process.cwd(), file);
            if (fs.existsSync(p)) {
              try {
                const content = fs.readFileSync(p, 'utf8');
                const lines = content.split(/\r?\n/);
                for (const line of lines) {
                  const m = line.match(/^\s*OPENROUTER_API_KEY\s*=\s*(.+)\s*$/);
                  if (m && m[1]) {
                    const val = m[1].trim();
                    process.env.OPENROUTER_API_KEY = val;
                    return val;
                  }
                }
              } catch {}
            }
          }
          return undefined;
        }
        const hasKey = !!loadOpenRouterKey();
        console.log('[dev-openrouter-proxy] OPENROUTER_API_KEY loaded:', hasKey ? 'YES' : 'NO');
        server.middlewares.use('/api/openrouter', async (req: any, res: any) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          const apiKey = loadOpenRouterKey();
          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing OPENROUTER_API_KEY on server' }));
            return;
          }

          try {
            let body = '';
            await new Promise<void>((resolve) => {
              req.on('data', (chunk: any) => (body += chunk));
              req.on('end', () => resolve());
            });

            const payload = body ? JSON.parse(body) : {};

            const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost',
                'X-Title': 'Bilingual Fitness Web App',
              },
              body: JSON.stringify(payload),
            });

            const text = await resp.text();
            res.statusCode = resp.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(text);
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e?.message || 'Unknown error' }));
          }
        });
      },
    };
  }

  export default defineConfig({
    plugins: [react(), devOpenRouterProxy() as any],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'vaul@1.1.2': 'vaul',
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'next-themes@0.4.6': 'next-themes',
        'lucide-react@0.487.0': 'lucide-react',
        'input-otp@1.4.2': 'input-otp',
        'figma:asset/e00f96261082f40f8d69adf5e05492b6d03e8701.png': path.resolve(__dirname, './src/assets/e00f96261082f40f8d69adf5e05492b6d03e8701.png'),
        'figma:asset/d9a22abaa6aca5180a3e260ec3ab59159c365d04.png': path.resolve(__dirname, './src/assets/d9a22abaa6aca5180a3e260ec3ab59159c365d04.png'),
        'figma:asset/ab6585f40e89667e4a31d49a5f7ae33cecadeccc.png': path.resolve(__dirname, './src/assets/ab6585f40e89667e4a31d49a5f7ae33cecadeccc.png'),
        'figma:asset/0075204d4b614abbb08d0f16d481617e9e3e9c78.png': path.resolve(__dirname, './src/assets/0075204d4b614abbb08d0f16d481617e9e3e9c78.png'),
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'cmdk@1.1.1': 'cmdk',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
        '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
        '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
        '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
        '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
        '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
        '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
        '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
        '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
        '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
        '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
        '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
        '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
        '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
        '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
        '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
        '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
        '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
        '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
        '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
    },
  });