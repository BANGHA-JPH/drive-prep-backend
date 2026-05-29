require('dotenv').config();
const supabase = require('./src/config/database');

async function diagnose() {
  const email = 'che55@gmail.com'; // User's test email
  console.log(`Diagnosing for: ${email}`);
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, reset_code, reset_code_expires_at')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return;
  }

  console.log('--- Database Record ---');
  console.log('Reset Code:', user.reset_code);
  console.log('Expires At (Raw):', user.reset_code_expires_at);
  console.log('Expires At (Parsed):', new Date(user.reset_code_expires_at).toISOString());
  console.log('Current Time (Server):', new Date().toISOString());
  
  const diff = new Date(user.reset_code_expires_at).getTime() - new Date().getTime();
  console.log(`Diff (ms): ${diff}`);
  console.log(`Expired: ${diff < 0}`);
}

diagnose();
