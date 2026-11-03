import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const mod = await server.ssrLoadModule('/tests/gameVerification.ts');
  await mod.runAllVerifications();
} finally {
  await server.close();
}
process.exit(0);
