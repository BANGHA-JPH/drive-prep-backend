require('dotenv').config();
const logger = require('./src/utils/logger');
const supabase = require('./src/config/database');

async function testLogging() {
  console.log('🧪 Testing Backend Logging System...\n');

  try {
    // Test basic logging
    logger.info('Test started', { test: 'logging' });
    logger.debug('Debug message', { data: 'test' });
    logger.warn('Warning message', { warning: 'test' });
    logger.error('Error message', { error: 'test' });

    // Test database logging
    logger.logDatabase('select', 'users', { test: true });
    
    // Test auth logging
    logger.logAuth('test_login', 'test@example.com', { userId: 'test123' });

    // Test with a real database operation
    console.log('📊 Testing database connection with logging...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      logger.error('Database test failed', { error: error.message });
    } else {
      logger.info('Database test successful', { count: data[0]?.count || 0 });
    }

    // Test error logging with stack trace
    try {
      throw new Error('Test error for logging');
    } catch (error) {
      logger.error('Caught test error', { 
        message: error.message,
        stack: error.stack,
        context: 'test_logging'
      });
    }

    console.log('✅ Logging test completed!');
    console.log('📁 Check the backend/logs directory for log files:');
    console.log('   - info.log');
    console.log('   - warn.log'); 
    console.log('   - error.log');
    console.log('   - debug.log');

  } catch (error) {
    logger.error('Test logging failed', { error: error.message });
  }
}

testLogging();
