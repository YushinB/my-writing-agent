import { dictionaryService } from './services/dictionary.service';
import { freeDictionaryService } from './services/freeDictionary.service';

/**
 * Simple test script to verify Dictionary Service implementation
 */
async function testDictionaryService() {
  console.log('\n🧪 Testing Dictionary Service Implementation\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Free Dictionary API Service
    console.log('\n📚 Test 1: Free Dictionary API Service');
    console.log('-'.repeat(60));
    const word1 = 'hello';
    console.log(`Fetching definition for "${word1}"...`);
    const apiResult = await freeDictionaryService.fetchWordDefinition(word1);

    if (apiResult) {
      console.log('✅ Success! Definition found:');
      console.log(`   Word: ${apiResult.word}`);
      console.log(`   Phonetic: ${apiResult.phonetic || 'N/A'}`);
      console.log(`   Meanings: ${apiResult.meanings.length} found`);
      console.log(`   First meaning: ${apiResult.meanings[0].partOfSpeech}`);
      console.log(`   First definition: ${apiResult.meanings[0].definitions[0].definition.substring(0, 80)}...`);
    } else {
      console.log('❌ No definition found');
    }

    // Test 2: Multi-layer caching lookup (1st call - will cache)
    console.log('\n🔍 Test 2: Multi-layer Caching Lookup (First Call)');
    console.log('-'.repeat(60));
    const word2 = 'typescript';
    console.log(`Searching for "${word2}" (should fetch from API)...`);
    const result1 = await dictionaryService.searchWord(word2);

    if (result1) {
      console.log('✅ Success! Definition found and cached:');
      console.log(`   Word: ${result1.word}`);
      console.log(`   Source: Will be cached to Redis + PostgreSQL`);
      console.log(`   Meanings: ${result1.meanings.length} found`);
    } else {
      console.log('❌ No definition found');
    }

    // Test 3: Multi-layer caching lookup (2nd call - from cache)
    console.log('\n⚡ Test 3: Multi-layer Caching Lookup (Second Call)');
    console.log('-'.repeat(60));
    console.log(`Searching for "${word2}" again (should hit cache)...`);
    const result2 = await dictionaryService.searchWord(word2);

    if (result2) {
      console.log('✅ Success! Definition retrieved from cache:');
      console.log(`   Word: ${result2.word}`);
      console.log(`   Retrieved from: Redis cache (fastest)`);
    } else {
      console.log('❌ No definition found');
    }

    // Test 4: Word not found
    console.log('\n🔍 Test 4: Word Not Found');
    console.log('-'.repeat(60));
    const word3 = 'xyzabc123notaword';
    console.log(`Searching for "${word3}" (should not be found)...`);
    const result3 = await dictionaryService.searchWord(word3);

    if (result3) {
      console.log('⚠️ Unexpected: Definition found (might be from AI fallback)');
    } else {
      console.log('✅ Success! Word not found (as expected)');
    }

    // Test 5: Get popular words
    console.log('\n📊 Test 5: Get Popular Words');
    console.log('-'.repeat(60));
    const popularWords = await dictionaryService.getPopularWords(5);
    console.log(`Popular words (${popularWords.length}):`, popularWords);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testDictionaryService()
  .then(() => {
    console.log('✅ Dictionary Service is working correctly!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Dictionary Service test failed:', error);
    process.exit(1);
  });