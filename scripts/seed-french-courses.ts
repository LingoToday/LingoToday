import fs from 'fs';
import path from 'path';
import { DatabaseStorage } from '../server/storage.js';

async function seedFrenchCourses() {
  console.log('🇫🇷 Starting French courses import...');
  
  const storage = new DatabaseStorage();
  
  // List of French course files to import
  const courseFiles = [
    'french_course1_greetings_steps_1755099675088.json',
    'french_course2_introducing_yourself_steps_1755099675094.json',
    'french_course3_essential_courtesy_phrases_1755099675094.json',
    'french_course4_numbers_1755099675094.json',
    'french_course5_time_and_date_1755099675095.json',
    'french_course6_family_and_people_1755099675095.json',
    'french_course7_describing_things_1755099675095.json',
    'french_course8_weather_1755099675095.json',
    'french_course9_food_and_drink_1755099675096.json'
  ];

  console.log(`📚 Found ${courseFiles.length} French course files to import`);

  for (const courseFile of courseFiles) {
    try {
      const filePath = path.join(process.cwd(), 'attached_assets', courseFile);
      if (fs.existsSync(filePath)) {
        console.log(`📥 Importing ${courseFile}...`);
        const courseData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Import course for French (fr) at beginner level
        await storage.importCourseFromJSON('fr', 'beginner', courseData);
        console.log(`✅ Successfully imported ${courseFile}`);
      } else {
        console.log(`⚠️  File not found: ${courseFile}`);
      }
    } catch (error) {
      console.error(`❌ Error importing ${courseFile}:`, error);
    }
  }

  console.log('🎉 French courses import completed!');
}

// Run the script
seedFrenchCourses().catch(console.error);