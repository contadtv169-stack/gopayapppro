import { supabase } from './config/supabase';
import fs from 'fs';
import path from 'path';

// NOTE: If supabase.rpc('exec_sql') doesn't exist, run the SQL manually
// in the Supabase dashboard SQL editor. The exec_sql function must be
// created in the database first (check migrations/create_exec_sql.sql).

async function runMigrations() {
  console.log('Running GoPay database migrations...');
  
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();
  
  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.error(`Migration ${file} failed:`, error.message);
    } else {
      console.log(`Migration ${file} completed`);
    }
  }
  
  console.log('Migrations finished.');
}

runMigrations().catch(console.error);
