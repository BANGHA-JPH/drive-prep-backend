require('dotenv').config();
const supabase = require('./src/config/database');

async function sendTestData() {
  try {
    console.log('🚀 Sending test data to your database...');
    
    const testData = {
      name: 'Test User ' + Date.now(),
      email: `test_${Date.now()}@example.com`,
      password_hash: '$2a$10$test.hashed.password.for.testing.only'
    };

    const { data, error } = await supabase
      .from('users')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log('✅ Test data sent successfully!');
    console.log('📋 User Details:');
    console.log(`   ID: ${data[0].id}`);
    console.log(`   Name: ${data[0].name}`);
    console.log(`   Email: ${data[0].email}`);
    console.log(`   Created at: ${data[0].created_at}`);
    console.log('\n🔍 You can now check your Supabase dashboard to see this record!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendTestData();
