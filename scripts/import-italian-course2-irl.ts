import { storage } from '../server/storage.js';
import fs from 'fs';
import path from 'path';

async function importItalianCourse2WithIRL() {
  try {
    console.log('🚀 Starting import of Italian Course 2 with IRL video lessons...');

    const filePath = path.join(process.cwd(), 'attached_assets', 'italian_course2_introductions_with_IRL_1757587162137.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ Course file not found:', filePath);
      return;
    }

    console.log('📥 Reading course data...');
    const courseData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Import course for Italian (it) at beginner level
    console.log('📚 Importing course to database...');
    await storage.importCourseFromJSON('it', 'beginner', courseData);
    
    console.log('✅ Successfully imported Italian Course 2 with IRL video lessons!');
    console.log('🎬 The course now includes IRL video lessons for introducing yourself alongside regular lessons and reviews.');
    
  } catch (error) {
    console.error('❌ Error importing course:', error);
  } finally {
    process.exit(0);
  }
}

importItalianCourse2WithIRL();