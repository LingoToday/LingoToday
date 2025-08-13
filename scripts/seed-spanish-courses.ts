import fs from 'fs';
import path from 'path';
import { DbStorage } from '../server/storage.js';

async function seedSpanishCourses() {
  console.log('🇪🇸 Starting Spanish courses import...');
  
  const storage = new DbStorage();
  
  // List of Spanish course files to import
  const courseFiles = [
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

  console.log(`📚 Found ${courseFiles.length} Spanish course files to import`);

  for (const courseFile of courseFiles) {
    try {
      const filePath = path.join(process.cwd(), 'attached_assets', courseFile);
      if (fs.existsSync(filePath)) {
        console.log(`📥 Importing ${courseFile}...`);
        const courseData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Import course for Spanish (es) at beginner level
        await storage.importCourseFromJSON('es', 'beginner', courseData);
        console.log(`✅ Successfully imported ${courseFile}`);
      } else {
        console.log(`⚠️  File not found: ${courseFile}`);
      }
    } catch (error) {
      console.error(`❌ Error importing ${courseFile}:`, error);
    }
  }

  console.log('🎉 Spanish courses import completed!');
}

// Run the script
seedSpanishCourses().catch(console.error);