import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { app } from './app.js';
import { registerListeners } from './events/listeners.js';

registerListeners();

// Connect to the database first, so we never accept requests we can't serve.
try {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
} catch (err) {
  console.error('Could not start:', err.message);
  process.exit(1);
}
