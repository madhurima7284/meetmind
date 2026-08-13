import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const FASTAPI_PORT = 8005;
const app = express();

// Spawn Python FastAPI backend process
let fastapiProcess = null;
let restartTimeout = null;

function startFastAPI() {
  const backendDir = path.join(process.cwd(), 'backend');
  console.log('Starting Python FastAPI Backend on port', FASTAPI_PORT, '...');

  fastapiProcess = spawn(
    'python3',
    ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(FASTAPI_PORT)],
    {
      cwd: backendDir,
      env: {
        ...process.env,
        PYTHONPATH: backendDir,
      },
      stdio: 'inherit',
    }
  );

  fastapiProcess.on('error', (err) => {
    console.error('Failed to start FastAPI process:', err);
  });

  fastapiProcess.on('exit', (code, signal) => {
    console.warn(`FastAPI process exited with code ${code} and signal ${signal}. Retrying in 3s...`);
    fastapiProcess = null;
    restartTimeout = setTimeout(() => {
      startFastAPI();
    }, 3000);
  });
}

startFastAPI();

process.on('exit', () => {
  if (restartTimeout) clearTimeout(restartTimeout);
  if (fastapiProcess) fastapiProcess.kill();
});

// Proxy HTTP /api/* requests directly to Python FastAPI backend
app.use('/api', (req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: FASTAPI_PORT,
    path: `/api${req.url}`,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${FASTAPI_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy request error to FastAPI:', err.message);
    if (!res.headersSent) {
      res.status(503).json({ error: 'FastAPI backend unavailable' });
    }
  });

  req.pipe(proxyReq, { end: true });
});

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrades by proxying /ws/* directly to Python FastAPI
server.on('upgrade', (request, socket, head) => {
  try {
    const host = request.headers.host || 'localhost';
    const url = new URL(request.url || '', `http://${host}`);

    if (url.pathname.startsWith('/ws/')) {
      wss.handleUpgrade(request, socket, head, (clientWs) => {
        const targetWsUrl = `ws://127.0.0.1:${FASTAPI_PORT}${url.pathname}${url.search}`;
        const targetWs = new WebSocket(targetWsUrl);

        targetWs.on('open', () => {
          clientWs.on('message', (data, isBinary) => {
            if (targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(data, { binary: isBinary });
            }
          });
        });

        targetWs.on('message', (data, isBinary) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data, { binary: isBinary });
          }
        });

        clientWs.on('close', () => {
          if (targetWs.readyState === WebSocket.OPEN) targetWs.close();
        });

        targetWs.on('close', () => {
          if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
        });

        clientWs.on('error', () => {
          if (targetWs.readyState === WebSocket.OPEN) targetWs.close();
        });

        targetWs.on('error', () => {
          if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
        });
      });
    }
  } catch (err) {
    console.error('Upgrade parsing error:', err);
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Gateway server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
