import { db } from '../server/db';
import { storage } from '../server/storage';
import * as fs from 'fs';
import * as path from 'path';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  // Create languages
  console.log('📝 Creating languages...');
  let italianLanguage, spanishLanguage;
  try {
    // Create Italian language
    italianLanguage = await storage.getLanguageByCode('it');
    if (!italianLanguage) {
      italianLanguage = await storage.createLanguage({
        code: 'it',
        name: 'Italian'
      });
    }
    console.log('✅ Italian language ready');

    // Create Spanish language
    spanishLanguage = await storage.getLanguageByCode('es');
    if (!spanishLanguage) {
      spanishLanguage = await storage.createLanguage({
        code: 'es',
        name: 'Spanish'
      });
    }
    console.log('✅ Spanish language ready');
  } catch (error) {
    console.error('❌ Error creating languages:', error);
    return;
  }

  // Create beginner skill level
  console.log('📚 Creating skill levels...');
  let beginnerLevel;
  try {
    beginnerLevel = await storage.getSkillLevelByCode('beginner');
    if (!beginnerLevel) {
      beginnerLevel = await storage.createSkillLevel({
        code: 'beginner',
        name: 'Beginner',
        description: 'For learners starting their language journey',
        sortOrder: 1
      });
    }
    console.log('✅ Beginner skill level ready');
  } catch (error) {
    console.error('❌ Error creating skill level:', error);
    return;
  }

  // Import Italian courses
  console.log('📖 Importing Italian courses...');
  const courseFiles = [
    'Italian_Beginners_course1_greetings_1760098796429.json',
    'italian_course2_introductions_with_inline_reviews_1756914297319.json',
    'italian_course3_essential_courtesy_with_inline_reviews_q4_1756914955271.json',
    'italian_course4_numbers_with_inline_reviews_full_cleaned_v2_1756914955272.json',
    'italian_course5_time_date_with_inline_reviews_q4_1756924425578.json',
    'italian_course6_travel_basics_with_inline_reviews_q4_1756895270936.json',
    'italian_course7_describing_things_with_inline_reviews_q4_1756896700949.json',
    'italian_course8_weather_and_seasons_with_inline_reviews_q4_1756898173198.json',
    'italian_course9_food_and_drinks_with_inline_reviews_q4_v2_1756898433747.json',
    'italian_course10_directions_and_places_with_inline_reviews_q4_1756899105692.json',
    'Italian_beginner_course11_shopping_full_1755080022546.json',
    'Italian_beginner_course12_expressing_likes_dislikes_full_1755080022546.json',
    'Italian_beginner_course13_basic_grammar_essentials_full_1755080022546.json'
  ];

  for (const courseFile of courseFiles) {
    try {
      const filePath = path.join(process.cwd(), 'attached_assets', courseFile);
      if (fs.existsSync(filePath)) {
        console.log(`📥 Importing ${courseFile}...`);
        const courseData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        await storage.importCourseFromJSON('it', 'beginner', courseData);
        console.log(`✅ Imported ${courseFile}`);
      } else {
        console.log(`⚠️  File not found: ${courseFile}`);
      }
    } catch (error) {
      console.error(`❌ Error importing ${courseFile}:`, error);
    }
  }

  // Import Spanish courses
  console.log('📖 Importing Spanish courses...');
  const spanishCourseFiles = [
    'spanish_course1_greetings_1755092048714.json',
    'spanish_course2_introductions_1755092048718.json',
    'spanish_course3_courtesy_1755092048719.json',
    'spanish_course4_numbers_1755092048719.json',
    'spanish_course5_days_months_dates (1)_1755092048719.json',
    'spanish_course6_family_people_1755092048719.json',
    'spanish_course7_colors_adjectives_1755092048720.json',
    'spanish_course8_food_drink_1755092048720.json',
    'spanish_course9_restaurant_1755092048720.json'
  ];

  for (const courseFile of spanishCourseFiles) {
    try {
      const filePath = path.join(process.cwd(), 'attached_assets', courseFile);
      if (fs.existsSync(filePath)) {
        console.log(`📥 Importing ${courseFile}...`);
        const courseData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        await storage.importCourseFromJSON('es', 'beginner', courseData);
        console.log(`✅ Imported ${courseFile}`);
      } else {
        console.log(`⚠️  File not found: ${courseFile}`);
      }
    } catch (error) {
      console.error(`❌ Error importing ${courseFile}:`, error);
    }
  }

  // Create intermediate and advanced levels for future use
  try {
    let intermediateLevel = await storage.getSkillLevelByCode('intermediate');
    if (!intermediateLevel) {
      intermediateLevel = await storage.createSkillLevel({
        code: 'intermediate',
        name: 'Intermediate',
        description: 'For learners with basic knowledge',
        sortOrder: 2
      });
      console.log('✅ Intermediate skill level created for future use');
    }

    let advancedLevel = await storage.getSkillLevelByCode('advanced');
    if (!advancedLevel) {
      advancedLevel = await storage.createSkillLevel({
        code: 'advanced',
        name: 'Advanced',
        description: 'For experienced learners',
        sortOrder: 3
      });
      console.log('✅ Advanced skill level created for future use');
    }
  } catch (error) {
    console.error('❌ Error creating additional skill levels:', error);
  }

  console.log('🎉 Database seeding completed!');
}

// Run if called directly
const runSeeding = async () => {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  }
};

runSeeding();

export { seedDatabase };