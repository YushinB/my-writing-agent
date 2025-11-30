import { env, displayEnvInfo, getCorsOrigins } from '../config/env';
import { testGeminiConnection } from '../config/gemini';
import logger from '../utils/logger';

async function testConfiguration() {
  try {
    logger.info('Starting configuration validation test...\n');

    // Test 1: Environment Validation
    logger.info('📍 Test 1: Environment Variables Validation');
    logger.info('   ✅ All environment variables validated successfully');
    displayEnvInfo();

    // Test 2: Check required secrets
    logger.info('📍 Test 2: Security Configuration');
    const hasValidJwtSecrets =
      env.JWT_ACCESS_SECRET.length >= 32 && env.JWT_REFRESH_SECRET.length >= 32;
    logger.info(
      `   JWT Secrets: ${hasValidJwtSecrets ? '✅ Valid' : '⚠️  Should be changed in production'}`
    );
    logger.info(`   Access Token Expiry: ${env.JWT_ACCESS_EXPIRY}`);
    logger.info(`   Refresh Token Expiry: ${env.JWT_REFRESH_EXPIRY}`);

    // Test 3: CORS Configuration
    logger.info('\n📍 Test 3: CORS Configuration');
    const corsOrigins = getCorsOrigins();
    logger.info(`   Allowed Origins: ${corsOrigins.join(', ')}`);

    // Test 4: Cache TTL Configuration
    logger.info('\n📍 Test 4: Cache TTL Configuration');
    logger.info(
      `   Dictionary Cache: ${env.CACHE_TTL_DICTIONARY}s (${env.CACHE_TTL_DICTIONARY / 86400} days)`
    );
    logger.info(`   User Cache: ${env.CACHE_TTL_USER}s (${env.CACHE_TTL_USER / 3600} hours)`);
    logger.info(`   LLM Cache: ${env.CACHE_TTL_LLM}s (${env.CACHE_TTL_LLM / 86400} days)`);

    // Test 5: Rate Limiting Configuration
    logger.info('\n📍 Test 5: Rate Limiting Configuration');
    logger.info(
      `   Window: ${env.RATE_LIMIT_WINDOW_MS}ms (${env.RATE_LIMIT_WINDOW_MS / 60000} minutes)`
    );
    logger.info(`   General Max Requests: ${env.RATE_LIMIT_MAX_REQUESTS}`);
    logger.info(`   Auth Max Requests: ${env.RATE_LIMIT_AUTH_MAX}`);
    logger.info(`   LLM Max Requests: ${env.RATE_LIMIT_LLM_MAX}`);

    // Test 6: Database Configuration
    logger.info('\n📍 Test 6: Database Configuration');
    const dbUrl = env.DATABASE_URL;
    const dbUrlDisplay = dbUrl.replace(/:[^:@]+@/, ':****@'); // Hide password
    logger.info(`   Database URL: ${dbUrlDisplay}`);

    // Test 7: Redis Configuration
    logger.info('\n📍 Test 7: Redis Configuration');
    logger.info(`   Host: ${env.REDIS_HOST}`);
    logger.info(`   Port: ${env.REDIS_PORT}`);
    logger.info(`   DB: ${env.REDIS_DB}`);
    logger.info(`   Password: ${env.REDIS_PASSWORD ? '****' : 'Not set'}`);

    // Test 8: Gemini AI Configuration
    logger.info('\n📍 Test 8: Gemini AI Configuration');
    const apiKeyDisplay = env.GEMINI_API_KEY
      ? `${env.GEMINI_API_KEY.substring(0, 10)}...${env.GEMINI_API_KEY.substring(env.GEMINI_API_KEY.length - 4)}`
      : 'Not set';
    logger.info(`   API Key: ${apiKeyDisplay}`);
    logger.info(`   Model: ${env.GEMINI_MODEL}`);

    // Test 9: Gemini Connection Test
    logger.info('\n📍 Test 9: Gemini AI Connection Test');
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'your-gemini-api-key-here') {
      logger.info('   Testing connection to Gemini AI...');
      const isConnected = await testGeminiConnection();
      logger.info(`   Connection: ${isConnected ? '✅ Success' : '❌ Failed'}`);
    } else {
      logger.warn('   ⚠️  Skipping test - Please set a valid GEMINI_API_KEY in .env');
    }

    // Test 10: External APIs
    logger.info('\n📍 Test 10: External API Configuration');
    logger.info(`   Free Dictionary API: ${env.FREE_DICTIONARY_API_URL}`);

    logger.info('\n✅ All configuration tests completed!\n');
    process.exit(0);
  } catch (error) {
    logger.error('\n❌ Configuration test failed:', error);
    process.exit(1);
  }
}

// Run the test
testConfiguration();
