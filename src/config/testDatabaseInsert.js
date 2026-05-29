require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const supabase = require('./database');

async function testDatabase() {
  console.log('Testing Supabase Connection & Operations...');
  
  const testEmail = `test_${Date.now()}@example.com`;
  
  try {
    // 1. Insert Data
    console.log(`\n1. Attempting to insert test user with email: ${testEmail}`);
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([
        { 
          name: 'Test Database User', 
          email: testEmail, 
          password_hash: 'test_dummy_hash' 
        }
      ])
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', insertError.message || insertError);
      return;
    }
    console.log('✅ Insert successful!', insertData);

    const newUserId = insertData[0].id;
    
    // 2. Select Data
    console.log(`\n2. Attempting to read back the test user with ID: ${newUserId}`);
    const { data: selectData, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', newUserId);

    if (selectError) {
      console.error('❌ Select failed:', selectError.message || selectError);
      return;
    }
    console.log('✅ Select successful!', selectData);

    // 3. Delete Data
    console.log(`\n3. Attempting to delete the test user with ID: ${newUserId}`);
    const { data: deleteData, error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', newUserId)
      .select();

    if (deleteError) {
      console.error('❌ Delete failed:', deleteError.message || deleteError);
      return;
    }
    console.log('✅ Clean up (Delete) successful!', deleteData);
    
    console.log('\n🎉 All database connection & operations completed successfully!');
  } catch (err) {
    console.error('Unexpected error during database test:', err);
  }
}

testDatabase();
