require('dotenv').config();
const supabase = require('./src/config/database');

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...');
    
    // Get all tables using a simpler approach
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');
    
    if (tablesError) {
      console.log('❌ Error checking tables:', tablesError.message);
      
      // Try alternative approach - check specific table
      const { data: refreshCheck, error: refreshError } = await supabase
        .from('refresh_tokens')
        .select('*')
        .limit(1);
      
      if (refreshError) {
        console.log('❌ refresh_tokens table not accessible:', refreshError.message);
      } else {
        console.log('✅ refresh_tokens table exists and is accessible');
        console.log('📝 Sample data:', refreshCheck);
      }
      return;
    }
    
    console.log('📋 Available tables:');
    tables.forEach(table => {
      console.log(`   - ${table}`);
    });
    
    // Check specifically for refresh token table
    const hasRefreshTokens = tables.includes('refresh_tokens');
    
    if (hasRefreshTokens) {
      console.log('\n✅ Found refresh_tokens table!');
      
      // Get some data to see structure
      const { data: sampleData, error: dataError } = await supabase
        .from('refresh_tokens')
        .select('*')
        .limit(1);
      
      if (!dataError && sampleData.length > 0) {
        console.log('\n📝 Table structure (from sample data):');
        Object.keys(sampleData[0]).forEach(key => {
          console.log(`   - ${key}: ${typeof sampleData[0][key]}`);
        });
      }
    } else {
      console.log('\n❌ No refresh_tokens table found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables();
