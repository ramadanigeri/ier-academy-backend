import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');

    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8',
    );

    await pool.query(schemaSQL);

    console.log('✅ Database migration completed successfully!');
    console.log('📋 Tables created:');
    console.log('   - enrollments');
    console.log('   - payments');
    console.log('   - email_log');
    console.log('   - contact_messages');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
