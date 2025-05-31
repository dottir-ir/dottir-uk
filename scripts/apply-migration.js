const { execSync } = require('child_process');
const path = require('path');

// Get the migration file path
const migrationFile = path.join(__dirname, '../supabase/migrations/20240320000000_update_schema.sql');

try {
  // Check if Supabase CLI is installed
  execSync('supabase --version', { stdio: 'ignore' });
  
  // Apply the migration
  console.log('Applying database migration...');
  execSync(`supabase db push`, { stdio: 'inherit' });
  
  console.log('Migration applied successfully!');
} catch (error) {
  if (error.message.includes('command not found')) {
    console.error('Error: Supabase CLI is not installed. Please install it first:');
    console.error('npm install -g supabase');
  } else {
    console.error('Error applying migration:', error.message);
  }
  process.exit(1);
} 