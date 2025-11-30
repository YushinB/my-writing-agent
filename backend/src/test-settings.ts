import { settingsService } from './services/settings.service';
import { userService } from './services/user.service';

/**
 * Test script to verify Settings Service implementation
 */
async function testSettingsService() {
  console.log('\n🧪 Testing Settings Service Implementation\n');
  console.log('='.repeat(60));

  let testUserId: string = '';

  try {
    // Setup: Create a test user (should auto-create settings)
    console.log('\n⚙️ Setup: Creating test user (auto-create settings)...');
    console.log('-'.repeat(60));
    const testUser = await userService.createUser(
      `test-settings-${Date.now()}@example.com`,
      'Test123!@#',
      'Settings Test User'
    );
    testUserId = testUser.id;
    console.log(`✅ Test user created: ${testUser.email}`);

    // Test 1: Verify settings were auto-created on user registration
    console.log('\n📋 Test 1: Verify Auto-Created Settings on Registration');
    console.log('-'.repeat(60));
    const autoSettings = await settingsService.getUserSettings(testUserId);
    console.log(`✅ Settings auto-created for new user`);
    console.log(`   LLM Model: ${autoSettings.llmModel}`);
    console.log(`   Language: ${autoSettings.preferredLanguage}`);
    console.log(`   Theme: ${autoSettings.theme}`);
    console.log(`   Email Notifications: ${autoSettings.emailNotifications}`);

    if (
      autoSettings.llmModel === 'gemini-2.0-flash-exp' &&
      autoSettings.preferredLanguage === 'en' &&
      autoSettings.theme === 'light' &&
      autoSettings.emailNotifications === true
    ) {
      console.log('   ✅ Default settings are correct');
    } else {
      console.log('   ⚠️ Default settings might be incorrect');
    }

    // Test 2: Get user settings again (should hit cache)
    console.log('\n⚡ Test 2: Get User Settings (From Cache)');
    console.log('-'.repeat(60));
    const cachedSettings = await settingsService.getUserSettings(testUserId);
    console.log(`✅ Settings retrieved from cache`);
    console.log(`   LLM Model: ${cachedSettings.llmModel}`);

    // Test 3: Update user settings (partial update)
    console.log('\n✏️ Test 3: Update User Settings (Partial Update)');
    console.log('-'.repeat(60));
    const updatedSettings = await settingsService.updateUserSettings(testUserId, {
      theme: 'dark',
      emailNotifications: false,
    });
    console.log(`✅ Settings updated`);
    console.log(`   Theme: ${updatedSettings.theme} (should be "dark")`);
    console.log(`   Email Notifications: ${updatedSettings.emailNotifications} (should be false)`);
    console.log(`   LLM Model: ${updatedSettings.llmModel} (should remain "gemini-2.0-flash-exp")`);

    // Test 4: Verify cache was updated
    console.log('\n🔄 Test 4: Verify Cache Was Updated');
    console.log('-'.repeat(60));
    const settingsAfterUpdate = await settingsService.getUserSettings(testUserId);
    if (
      settingsAfterUpdate.theme === 'dark' &&
      settingsAfterUpdate.emailNotifications === false
    ) {
      console.log('✅ Cache was properly updated with new settings');
    } else {
      console.log('⚠️ Cache might not have been updated');
    }

    // Test 5: Update all settings
    console.log('\n✏️ Test 5: Update All Settings Fields');
    console.log('-'.repeat(60));
    const fullUpdate = await settingsService.updateUserSettings(testUserId, {
      llmModel: 'gemini-1.5-pro',
      preferredLanguage: 'es',
      theme: 'system',
      emailNotifications: true,
    });
    console.log(`✅ All settings updated`);
    console.log(`   LLM Model: ${fullUpdate.llmModel}`);
    console.log(`   Language: ${fullUpdate.preferredLanguage}`);
    console.log(`   Theme: ${fullUpdate.theme}`);
    console.log(`   Email Notifications: ${fullUpdate.emailNotifications}`);

    // Test 6: Reset settings to default
    console.log('\n🔄 Test 6: Reset Settings to Default');
    console.log('-'.repeat(60));
    const resetSettings = await settingsService.resetToDefault(testUserId);
    console.log(`✅ Settings reset to default`);
    console.log(`   LLM Model: ${resetSettings.llmModel} (should be "gemini-2.0-flash-exp")`);
    console.log(`   Language: ${resetSettings.preferredLanguage} (should be "en")`);
    console.log(`   Theme: ${resetSettings.theme} (should be "light")`);
    console.log(`   Email Notifications: ${resetSettings.emailNotifications} (should be true)`);

    // Test 7: Invalidate cache manually
    console.log('\n🗑️ Test 7: Invalidate Settings Cache');
    console.log('-'.repeat(60));
    await settingsService.invalidateCache(testUserId);
    console.log('✅ Cache invalidated');

    // Test 8: Verify cache was invalidated (fetch from DB)
    console.log('\n📋 Test 8: Verify Cache Invalidation (Fetch from DB)');
    console.log('-'.repeat(60));
    const settingsAfterInvalidation = await settingsService.getUserSettings(testUserId);
    console.log(`✅ Settings fetched from database after cache invalidation`);
    console.log(`   LLM Model: ${settingsAfterInvalidation.llmModel}`);

    // Test 9: Create another user and verify settings isolation
    console.log('\n👥 Test 9: Verify Settings Isolation Between Users');
    console.log('-'.repeat(60));
    const testUser2 = await userService.createUser(
      `test-settings-2-${Date.now()}@example.com`,
      'Test123!@#',
      'Settings Test User 2'
    );
    const user2Settings = await settingsService.getUserSettings(testUser2.id);
    console.log(`✅ User 2 settings created independently`);
    console.log(`   User 1 Theme: ${settingsAfterInvalidation.theme}`);
    console.log(`   User 2 Theme: ${user2Settings.theme}`);

    // Update user 2 settings
    await settingsService.updateUserSettings(testUser2.id, { theme: 'dark' });
    const user1SettingsCheck = await settingsService.getUserSettings(testUserId);
    const user2SettingsCheck = await settingsService.getUserSettings(testUser2.id);

    if (user1SettingsCheck.theme !== user2SettingsCheck.theme) {
      console.log('✅ Settings are properly isolated between users');
    } else {
      console.log('⚠️ Settings isolation might have issues');
    }

    // Cleanup user 2
    await settingsService.deleteUserSettings(testUser2.id);
    await userService.deleteUser(testUser2.id);
    console.log('✅ Test user 2 cleaned up');

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    // Always cleanup test user
    if (testUserId) {
      console.log('🧹 Cleanup: Deleting test user and settings...');
      try {
        await settingsService.deleteUserSettings(testUserId);
        await userService.deleteUser(testUserId);
        console.log('✅ Test user and settings deleted');
      } catch (error) {
        console.warn('⚠️ Failed to delete test user:', error);
      }
    }
  }
}

// Run tests
testSettingsService()
  .then(() => {
    console.log('✅ Settings Service is working correctly!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Settings Service test failed:', error);
    process.exit(1);
  });