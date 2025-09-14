import { DatabaseStorage } from '../server/storage.js';
import * as fs from 'fs';
import * as path from 'path';

async function importItalianCourse1Video() {
  console.log('🇮🇹 Starting Italian Course 1 with video steps import...');
  
  const storage = new DatabaseStorage();
  
  const courseFile = 'Italian_course1_greetings_with_step4_videos_1757875916648.json';

  try {
    const filePath = path.join(process.cwd(), 'attached_assets', courseFile);
    if (fs.existsSync(filePath)) {
      console.log(`📥 Importing ${courseFile}...`);
      const courseData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Import course for Italian (it) at beginner level
      await storage.importCourseFromJSON('it', 'beginner', courseData);
      console.log(`✅ Successfully imported ${courseFile}`);
      
      console.log('🎬 Video-enabled Italian Course 1 import completed!');
    } else {
      console.log(`⚠️  File not found: ${courseFile}`);
    }
  } catch (error) {
    console.error(`❌ Error importing ${courseFile}:`, error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  importItalianCourse1Video().catch(console.error);
}

export { importItalianCourse1Video };