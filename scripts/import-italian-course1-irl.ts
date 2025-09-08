import { storage } from '../server/storage.js';
import fs from 'fs';
import path from 'path';

async function importItalianCourse1WithIRL() {
  try {
    console.log('🚀 Starting import of Italian Course 1 with IRL video lessons...');

    const filePath = path.join(process.cwd(), 'attached_assets', 'Italian_course1_greetings_with_IRL_regenerated_1757252969964.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ Course file not found:', filePath);
      return;
    }

    console.log('📥 Reading course data...');
    const courseData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Import course for Italian (it) at beginner level
    console.log('📚 Importing course to database...');
    await storage.importCourseFromJSON('it', 'beginner', courseData);
    
    console.log('✅ Successfully imported Italian Course 1 with IRL video lessons!');
    console.log('🎬 The course now includes IRL video lessons alongside regular lessons and reviews.');
    
  } catch (error) {
    console.error('❌ Error importing course:', error);
  } finally {
    process.exit(0);
  }
}

importItalianCourse1WithIRL();