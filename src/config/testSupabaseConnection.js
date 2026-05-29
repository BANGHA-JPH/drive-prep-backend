
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const supabase = require('../config/database');

// Simple connection test
async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
      console.error('Supabase connection error:', error);
      process.exit(1);
    }
    console.log('Supabase connection successful!');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

testConnection();
