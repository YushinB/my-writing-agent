import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Common English words with definitions
const commonWords = [
  {
    word: 'serendipity',
    phonetic: '/ˌserənˈdipədē/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'noun',
          definition: 'The occurrence and development of events by chance in a happy or beneficial way.',
          example: 'A fortunate stroke of serendipity brought the two old friends together.',
          synonyms: ['chance', 'luck', 'fortune', 'providence'],
        },
      ],
    },
    origin: 'Coined by Horace Walpole in 1754, from the Persian fairy tale The Three Princes of Serendip.',
    source: 'seed_data',
  },
  {
    word: 'ephemeral',
    phonetic: '/əˈfem(ə)rəl/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'adjective',
          definition: 'Lasting for a very short time.',
          example: 'Fashions are ephemeral.',
          synonyms: ['transitory', 'transient', 'fleeting', 'passing', 'short-lived'],
        },
      ],
    },
    origin: 'From Greek ephēmeros, meaning lasting only a day.',
    source: 'seed_data',
  },
  {
    word: 'eloquent',
    phonetic: '/ˈeləkwənt/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'adjective',
          definition: 'Fluent or persuasive in speaking or writing.',
          example: 'An eloquent speech about poverty.',
          synonyms: ['articulate', 'fluent', 'expressive', 'persuasive'],
        },
      ],
    },
    origin: 'From Latin eloquent-, meaning speaking out.',
    source: 'seed_data',
  },
  {
    word: 'ubiquitous',
    phonetic: '/yo͞oˈbikwədəs/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'adjective',
          definition: 'Present, appearing, or found everywhere.',
          example: 'His ubiquitous influence was felt throughout the city.',
          synonyms: ['omnipresent', 'pervasive', 'universal', 'everywhere'],
        },
      ],
    },
    origin: 'From Latin ubique, meaning everywhere.',
    source: 'seed_data',
  },
  {
    word: 'paradigm',
    phonetic: '/ˈperəˌdīm/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'noun',
          definition: 'A typical example or pattern of something; a model.',
          example: 'Society\'s paradigm of the perfect woman.',
          synonyms: ['model', 'pattern', 'example', 'standard', 'prototype'],
        },
      ],
    },
    origin: 'From Greek paradeigma, meaning pattern.',
    source: 'seed_data',
  },
  {
    word: 'resilient',
    phonetic: '/rəˈzilyənt/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'adjective',
          definition: 'Able to withstand or recover quickly from difficult conditions.',
          example: 'Babies are remarkably resilient.',
          synonyms: ['strong', 'tough', 'hardy', 'flexible', 'adaptable'],
        },
      ],
    },
    origin: 'From Latin resilire, meaning to rebound.',
    source: 'seed_data',
  },
  {
    word: 'ambiguous',
    phonetic: '/amˈbiɡyo͞oəs/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'adjective',
          definition: 'Open to more than one interpretation; not having one obvious meaning.',
          example: 'An ambiguous phrase.',
          synonyms: ['unclear', 'vague', 'uncertain', 'indefinite'],
        },
      ],
    },
    origin: 'From Latin ambiguus, meaning doubtful.',
    source: 'seed_data',
  },
  {
    word: 'pragmatic',
    phonetic: '/praɡˈmadik/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'adjective',
          definition: 'Dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.',
          example: 'A pragmatic approach to politics.',
          synonyms: ['practical', 'realistic', 'sensible', 'down-to-earth'],
        },
      ],
    },
    origin: 'From Greek pragmatikos, meaning relating to fact.',
    source: 'seed_data',
  },
  {
    word: 'benevolent',
    phonetic: '/bəˈnevələnt/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'adjective',
          definition: 'Well meaning and kindly.',
          example: 'A benevolent smile.',
          synonyms: ['kind', 'kindly', 'kindhearted', 'good-natured', 'compassionate'],
        },
      ],
    },
    origin: 'From Latin benevolent-, meaning well wishing.',
    source: 'seed_data',
  },
  {
    word: 'meticulous',
    phonetic: '/məˈtikyələs/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'adjective',
          definition: 'Showing great attention to detail; very careful and precise.',
          example: 'He was meticulous about his appearance.',
          synonyms: ['careful', 'conscientious', 'diligent', 'scrupulous', 'punctilious'],
        },
      ],
    },
    origin: 'From Latin meticulosus, meaning fearful.',
    source: 'seed_data',
  },
  {
    word: 'profound',
    phonetic: '/prəˈfound/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'adjective',
          definition: 'Very great or intense; having or showing great knowledge or insight.',
          example: 'Profound social changes.',
          synonyms: ['deep', 'intense', 'extreme', 'great', 'heartfelt'],
        },
      ],
    },
    origin: 'From Latin profundus, meaning deep.',
    source: 'seed_data',
  },
  {
    word: 'eloquence',
    phonetic: '/ˈeləkwəns/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'noun',
          definition: 'Fluent or persuasive speaking or writing.',
          example: 'A preacher of great power and eloquence.',
          synonyms: ['fluency', 'articulateness', 'expressiveness', 'persuasiveness'],
        },
      ],
    },
    origin: 'From Latin eloquentia, meaning speaking out.',
    source: 'seed_data',
  },
  {
    word: 'catalyst',
    phonetic: '/ˈkadəlist/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'noun',
          definition: 'A person or thing that precipitates an event.',
          example: 'The governor\'s speech acted as a catalyst for debate.',
          synonyms: ['stimulus', 'stimulation', 'spark', 'incentive'],
        },
      ],
    },
    origin: 'From Greek katalusis, meaning dissolution.',
    source: 'seed_data',
  },
  {
    word: 'innovative',
    phonetic: '/ˈinəˌvādiv/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'adjective',
          definition: 'Featuring new methods; advanced and original.',
          example: 'Innovative designs.',
          synonyms: ['original', 'new', 'novel', 'fresh', 'inventive'],
        },
      ],
    },
    origin: 'From Latin innovatus, meaning renewed.',
    source: 'seed_data',
  },
  {
    word: 'diligent',
    phonetic: '/ˈdiləjənt/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'adjective',
          definition: 'Having or showing care and conscientiousness in one\'s work or duties.',
          example: 'After diligent searching, he found a parcel.',
          synonyms: ['industrious', 'hardworking', 'assiduous', 'conscientious'],
        },
      ],
    },
    origin: 'From Latin diligent-, meaning loving, careful.',
    source: 'seed_data',
  },
  {
    word: 'exemplary',
    phonetic: '/iɡˈzemplerē/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'adjective',
          definition: 'Serving as a desirable model; representing the best of its kind.',
          example: 'Exemplary behavior.',
          synonyms: ['perfect', 'ideal', 'model', 'faultless', 'impeccable'],
        },
      ],
    },
    origin: 'From Latin exemplaris, meaning serving as a pattern.',
    source: 'seed_data',
  },
  {
    word: 'fervent',
    phonetic: '/ˈfərvənt/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'adjective',
          definition: 'Having or displaying a passionate intensity.',
          example: 'A fervent supporter of the revolution.',
          synonyms: ['passionate', 'ardent', 'intense', 'enthusiastic', 'eager'],
        },
      ],
    },
    origin: 'From Latin fervent-, meaning boiling.',
    source: 'seed_data',
  },
  {
    word: 'harmony',
    phonetic: '/ˈhärm(ə)nē/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'noun',
          definition: 'The quality of forming a pleasing and consistent whole.',
          example: 'The delicate harmony of the two cultures.',
          synonyms: ['accord', 'agreement', 'peace', 'unity', 'concord'],
        },
      ],
    },
    origin: 'From Greek harmonia, meaning joining.',
    source: 'seed_data',
  },
  {
    word: 'integrity',
    phonetic: '/inˈteɡrədē/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'noun',
          definition: 'The quality of being honest and having strong moral principles.',
          example: 'A gentleman of complete integrity.',
          synonyms: ['honesty', 'uprightness', 'probity', 'rectitude', 'honor'],
        },
      ],
    },
    origin: 'From Latin integritas, meaning soundness, wholeness.',
    source: 'seed_data',
  },
  {
    word: 'juxtapose',
    phonetic: '/ˌjəkstəˈpōz/',
    meanings: {
      definitions: [
        {
          partOfSpeech: 'verb',
          definition: 'Place or deal with close together for contrasting effect.',
          example: 'Black-and-white photos juxtaposed with color images.',
          synonyms: ['place side by side', 'set side by side', 'collocate'],
        },
      ],
    },
    origin: 'From French juxta, meaning next.',
    source: 'seed_data',
  },
];

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clean existing data (optional - comment out in production)
    console.log('🗑️  Cleaning existing seed data...');
    await prisma.aIUsageLog.deleteMany({});
    await prisma.savedWord.deleteMany({});
    await prisma.userSettings.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin@prosepolish.com', 'user1@example.com', 'user2@example.com', 'demo@prosepolish.com'],
        },
      },
    });
    await prisma.dictionaryEntry.deleteMany({
      where: {
        source: 'seed_data',
      },
    });

    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    const hashedAdminPassword = await bcrypt.hash('Admin@123!', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@prosepolish.com',
        password: hashedAdminPassword,
        name: 'Admin User',
        role: UserRole.ADMIN,
      },
    });
    console.log(`✅ Admin user created: ${adminUser.email}`);

    // Create settings for admin
    await prisma.userSettings.create({
      data: {
        userId: adminUser.id,
        llmModel: 'gemini-2.0-flash-exp',
        preferredLanguage: 'en',
        theme: 'dark',
        emailNotifications: true,
      },
    });
    console.log(`✅ Settings created for admin user`);

    // 2. Create Test Users
    console.log('👥 Creating test users...');
    const hashedUserPassword = await bcrypt.hash('User@123!', 10);

    const user1 = await prisma.user.create({
      data: {
        email: 'user1@example.com',
        password: hashedUserPassword,
        name: 'Alice Johnson',
        role: UserRole.USER,
      },
    });
    console.log(`✅ User created: ${user1.email}`);

    await prisma.userSettings.create({
      data: {
        userId: user1.id,
        llmModel: 'gemini-2.0-flash-exp',
        preferredLanguage: 'en',
        theme: 'light',
        emailNotifications: true,
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'user2@example.com',
        password: hashedUserPassword,
        name: 'Bob Smith',
        role: UserRole.USER,
      },
    });
    console.log(`✅ User created: ${user2.email}`);

    await prisma.userSettings.create({
      data: {
        userId: user2.id,
        llmModel: 'gemini-2.0-flash-exp',
        preferredLanguage: 'en',
        theme: 'light',
        emailNotifications: false,
      },
    });

    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@prosepolish.com',
        password: hashedUserPassword,
        name: 'Demo User',
        role: UserRole.USER,
      },
    });
    console.log(`✅ User created: ${demoUser.email}`);

    await prisma.userSettings.create({
      data: {
        userId: demoUser.id,
        llmModel: 'gemini-2.0-flash-exp',
        preferredLanguage: 'en',
        theme: 'dark',
        emailNotifications: true,
      },
    });

    // 3. Seed Dictionary Entries
    console.log('📚 Seeding dictionary entries...');
    let dictionaryCount = 0;
    for (const wordData of commonWords) {
      try {
        await prisma.dictionaryEntry.create({
          data: {
            word: wordData.word,
            phonetic: wordData.phonetic,
            meanings: wordData.meanings,
            origin: wordData.origin,
            source: wordData.source,
            accessCount: 0,
          },
        });
        dictionaryCount++;
      } catch (error) {
        console.warn(`⚠️  Skipping duplicate word: ${wordData.word}`);
      }
    }
    console.log(`✅ Created ${dictionaryCount} dictionary entries`);

    // 4. Create Sample Saved Words for Users
    console.log('💾 Creating sample saved words...');

    const user1SavedWords = [
      { word: 'serendipity', notes: 'Beautiful word, means happy accidents' },
      { word: 'ephemeral', notes: 'Short-lived, like cherry blossoms' },
      { word: 'eloquent', notes: 'Fluent and persuasive speech' },
      { word: 'resilient', notes: 'Bouncing back from difficulties' },
      { word: 'paradigm', notes: 'A model or pattern' },
    ];

    for (const savedWord of user1SavedWords) {
      await prisma.savedWord.create({
        data: {
          userId: user1.id,
          word: savedWord.word,
          notes: savedWord.notes,
        },
      });
    }
    console.log(`✅ Created ${user1SavedWords.length} saved words for ${user1.name}`);

    const user2SavedWords = [
      { word: 'ubiquitous', notes: 'Present everywhere' },
      { word: 'pragmatic', notes: 'Practical approach' },
      { word: 'benevolent', notes: 'Kindly and well-meaning' },
    ];

    for (const savedWord of user2SavedWords) {
      await prisma.savedWord.create({
        data: {
          userId: user2.id,
          word: savedWord.word,
          notes: savedWord.notes,
        },
      });
    }
    console.log(`✅ Created ${user2SavedWords.length} saved words for ${user2.name}`);

    const demoSavedWords = [
      { word: 'meticulous', notes: 'Attention to detail is key' },
      { word: 'profound', notes: 'Deep and meaningful insights' },
      { word: 'catalyst', notes: 'Something that causes change' },
      { word: 'innovative', notes: 'New and original ideas' },
      { word: 'integrity', notes: 'Moral principles and honesty' },
    ];

    for (const savedWord of demoSavedWords) {
      await prisma.savedWord.create({
        data: {
          userId: demoUser.id,
          word: savedWord.word,
          notes: savedWord.notes,
        },
      });
    }
    console.log(`✅ Created ${demoSavedWords.length} saved words for ${demoUser.name}`);

    // Summary
    console.log('\n✨ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: 4 (1 admin, 3 regular users)`);
    console.log(`   - Dictionary Entries: ${dictionaryCount}`);
    console.log(`   - User Settings: 4`);
    console.log(`   - Saved Words: ${user1SavedWords.length + user2SavedWords.length + demoSavedWords.length}`);
    console.log('\n👤 Test Accounts:');
    console.log('   Admin:');
    console.log('     Email: admin@prosepolish.com');
    console.log('     Password: Admin@123!');
    console.log('   Demo User:');
    console.log('     Email: demo@prosepolish.com');
    console.log('     Password: User@123!');
    console.log('   Test Users:');
    console.log('     Email: user1@example.com / user2@example.com');
    console.log('     Password: User@123!\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
