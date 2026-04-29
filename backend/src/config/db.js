import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join }  from 'path';
import { config }         from 'dotenv';

// Explicitly load .env from backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
config({ path: join(__dirname, '../../.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL connected');
    client.release();
  })
  .catch(err => console.error('❌ PostgreSQL connection error:', err.message));

export default pool;