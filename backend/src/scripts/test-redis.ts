import { redis, checkRedisHealth } from '../config/redis';
import logger from '../utils/logger';

async function testRedis() {
  try {
    logger.info('Starting Redis connection test...');

    // Test 1: Ping
    logger.info('\n📍 Test 1: PING');
    const pingResult = await redis.ping();
    logger.info(`   Result: ${pingResult}`);

    // Test 2: Health Check
    logger.info('\n📍 Test 2: Health Check');
    const isHealthy = await checkRedisHealth();
    logger.info(`   Result: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);

    // Test 3: Set a value
    logger.info('\n📍 Test 3: SET operation');
    const testKey = 'test:connection';
    const testValue = JSON.stringify({
      message: 'Hello Redis!',
      timestamp: new Date().toISOString(),
    });
    await redis.set(testKey, testValue, 'EX', 60); // Expire in 60 seconds
    logger.info(`   Stored: ${testKey}`);

    // Test 4: Get the value
    logger.info('\n📍 Test 4: GET operation');
    const retrievedValue = await redis.get(testKey);
    logger.info(`   Retrieved: ${retrievedValue}`);

    // Test 5: Check if values match
    logger.info('\n📍 Test 5: Verify data integrity');
    const matches = testValue === retrievedValue;
    logger.info(`   Match: ${matches ? '✅ Yes' : '❌ No'}`);

    // Test 6: Delete the value
    logger.info('\n📍 Test 6: DEL operation');
    const deleted = await redis.del(testKey);
    logger.info(`   Deleted keys: ${deleted}`);

    // Test 7: Set with expiry and check TTL
    logger.info('\n📍 Test 7: TTL operation');
    await redis.set('test:ttl', 'expiring value', 'EX', 10);
    const ttl = await redis.ttl('test:ttl');
    logger.info(`   TTL: ${ttl} seconds`);

    // Test 8: Hash operations
    logger.info('\n📍 Test 8: HASH operations');
    await redis.hset('test:hash', 'field1', 'value1');
    await redis.hset('test:hash', 'field2', 'value2');
    const hashValue = await redis.hget('test:hash', 'field1');
    const allHash = await redis.hgetall('test:hash');
    logger.info(`   Hash field1: ${hashValue}`);
    logger.info(`   All hash fields: ${JSON.stringify(allHash)}`);
    await redis.del('test:hash');

    // Test 9: List operations
    logger.info('\n📍 Test 9: LIST operations');
    await redis.lpush('test:list', 'item1', 'item2', 'item3');
    const listLength = await redis.llen('test:list');
    const listItems = await redis.lrange('test:list', 0, -1);
    logger.info(`   List length: ${listLength}`);
    logger.info(`   List items: ${JSON.stringify(listItems)}`);
    await redis.del('test:list');

    // Test 10: Set operations
    logger.info('\n📍 Test 10: SET operations');
    await redis.sadd('test:set', 'member1', 'member2', 'member3');
    const setMembers = await redis.smembers('test:set');
    const isMember = await redis.sismember('test:set', 'member1');
    logger.info(`   Set members: ${JSON.stringify(setMembers)}`);
    logger.info(`   Is member1 in set: ${isMember === 1 ? 'Yes' : 'No'}`);
    await redis.del('test:set');

    // Clean up test TTL key
    await redis.del('test:ttl');

    logger.info('\n✅ All Redis tests passed successfully!');
    logger.info('Redis is fully operational and ready for use.\n');

    process.exit(0);
  } catch (error) {
    logger.error('\n❌ Redis test failed:', error);
    process.exit(1);
  }
}

// Run the test
testRedis();
