export async function register() {
  // Import the Sentry module based on the runtime environment. (Node.js)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  // Import the Sentry module based on the runtime environment. (Edge)
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
