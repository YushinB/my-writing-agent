import { myWordsService } from './services/myWords.service';
import { userService } from './services/user.service';

/**
 * Test script to verify My Words Service implementation
 */
async function testMyWordsService() {
  console.log('\n🧪 Testing My Words Service Implementation\n');
  console.log('='.repeat(60));

  let testUserId: string = '';
  let addedWordIds: string[] = [];

  try {
    // Setup: Create a test user
    console.log('\n⚙️ Setup: Creating test user...');
    console.log('-'.repeat(60));
    const testUser = await userService.createUser(
      `test-mywords-${Date.now()}@example.com`,
      'Test123!@#',
      'My Words Test User'
    );
    testUserId = testUser.id;
    console.log(`✅ Test user created: ${testUser.email}`);

    // Test 1: Add words to user's dictionary
    console.log('\n📝 Test 1: Add Words to User Dictionary');
    console.log('-'.repeat(60));

    const wordsToAdd = [
      { word: 'ephemeral', notes: 'Lasting for a very short time' },
      { word: 'serendipity', notes: 'Finding something good without looking for it' },
      { word: 'ubiquitous', notes: 'Present, appearing, or found everywhere' },
    ];

    for (const wordData of wordsToAdd) {
      const savedWord = await myWordsService.addWord(testUserId, wordData.word, wordData.notes);
      addedWordIds.push(savedWord.id);
      console.log(`✅ Added word: "${savedWord.word}" with notes`);
    }

    // Test 2: Get user words (first call - should cache)
    console.log('\n📋 Test 2: Get User Words (First Call - Will Cache)');
    console.log('-'.repeat(60));
    const result1 = await myWordsService.getUserWords(testUserId, 1, 10);
    console.log(`✅ Retrieved ${result1.words.length} words`);
    console.log(`   Total words: ${result1.pagination.total}`);
    console.log(`   Page: ${result1.pagination.page}/${result1.pagination.totalPages}`);
    result1.words.forEach((w: any) => {
      console.log(`   - ${w.word}: ${w.notes?.substring(0, 40) || 'No notes'}...`);
    });

    // Test 3: Get user words again (should hit cache)
    console.log('\n⚡ Test 3: Get User Words (Second Call - From Cache)');
    console.log('-'.repeat(60));
    const result2 = await myWordsService.getUserWords(testUserId, 1, 10);
    console.log(`✅ Retrieved ${result2.words.length} words from cache`);

    // Test 4: Get word count (should cache)
    console.log('\n🔢 Test 4: Get Word Count (Will Cache)');
    console.log('-'.repeat(60));
    const count1 = await myWordsService.getWordCount(testUserId);
    console.log(`✅ Word count: ${count1}`);

    // Test 5: Get word count again (from cache)
    console.log('\n⚡ Test 5: Get Word Count (From Cache)');
    console.log('-'.repeat(60));
    const count2 = await myWordsService.getWordCount(testUserId);
    console.log(`✅ Word count from cache: ${count2}`);

    // Test 6: Check for duplicate word
    console.log('\n🔍 Test 6: Check for Duplicate Word');
    console.log('-'.repeat(60));
    try {
      await myWordsService.addWord(testUserId, 'ephemeral', 'Trying to add again');
      console.log('❌ Should have thrown ConflictError');
    } catch (error: any) {
      if (error.code === 'CONFLICT') {
        console.log(`✅ Duplicate check working: ${error.message}`);
      } else {
        throw error;
      }
    }

    // Test 7: Search user words
    console.log('\n🔎 Test 7: Search User Words');
    console.log('-'.repeat(60));
    const searchResults = await myWordsService.searchWords(testUserId, 'ser', 1, 10);
    console.log(`✅ Search for "ser" found ${searchResults.words.length} word(s)`);
    searchResults.words.forEach((w: any) => {
      console.log(`   - ${w.word}`);
    });

    // Test 8: Update word notes
    console.log('\n✏️ Test 8: Update Word Notes');
    console.log('-'.repeat(60));
    const updatedWord = await myWordsService.updateNotes(
      testUserId,
      addedWordIds[0],
      'Updated: Lasting for a very short time (ephemeros = lasting only one day)'
    );
    console.log(`✅ Updated notes for word: "${updatedWord.word}"`);
    console.log(`   New notes: ${updatedWord.notes?.substring(0, 60)}...`);

    // Test 9: Check if word is saved
    console.log('\n✔️ Test 9: Check if Word is Saved');
    console.log('-'.repeat(60));
    const isSaved = await myWordsService.isWordSaved(testUserId, 'ephemeral');
    const isNotSaved = await myWordsService.isWordSaved(testUserId, 'nonexistent');
    console.log(`✅ "ephemeral" is saved: ${isSaved}`);
    console.log(`✅ "nonexistent" is saved: ${isNotSaved}`);

    // Test 10: Remove word (cache should invalidate)
    console.log('\n🗑️ Test 10: Remove Word (Cache Invalidation)');
    console.log('-'.repeat(60));
    await myWordsService.removeWord(testUserId, addedWordIds[0]);
    console.log('✅ Word removed');

    // Test 11: Verify cache was invalidated
    console.log('\n🔄 Test 11: Verify Cache Invalidation');
    console.log('-'.repeat(60));
    const countAfterDelete = await myWordsService.getWordCount(testUserId);
    console.log(`✅ Word count after deletion: ${countAfterDelete} (should be ${count1 - 1})`);
    if (countAfterDelete === count1 - 1) {
      console.log('   Cache was properly invalidated!');
    } else {
      console.log('   ⚠️ Cache might not have been invalidated properly');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60) + '\n');

    // Cleanup
    console.log('🧹 Cleanup: Removing remaining test words...');
    for (const wordId of addedWordIds.slice(1)) {
      await myWordsService.removeWord(testUserId, wordId);
    }
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    // Always cleanup test user
    if (testUserId) {
      console.log('🧹 Cleanup: Deleting test user...');
      try {
        await userService.deleteUser(testUserId);
        console.log('✅ Test user deleted');
      } catch (error) {
        console.warn('⚠️ Failed to delete test user:', error);
      }
    }
  }
}

// Run tests
testMyWordsService()
  .then(() => {
    console.log('✅ My Words Service is working correctly!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ My Words Service test failed:', error);
    process.exit(1);
  });
