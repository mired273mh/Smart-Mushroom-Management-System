import { readConfig } from './config.js';
import { createPool } from './db.js';
import { createApp } from './app.js';
const config = readConfig();
const pool = createPool(config.DATABASE_URL);
const server = createApp({ pool, config }).listen(config.PORT, () => console.log(`Smart Mushroom API listening on port ${config.PORT}`));
const stop = () => server.close(async () => { await pool.end(); process.exit(0); });
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
