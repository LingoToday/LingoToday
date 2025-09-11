import { storage } from '../server/storage.js';

async function getCourseTotals() {
  try {
    // Get Italian beginner courses
    const italianLanguage = await storage.getLanguageByCode('it');
    const beginnerLevel = await storage.getSkillLevelByCode('beginner');
    
    if (!italianLanguage || !beginnerLevel) {
      console.error('Could not find Italian language or beginner level');
      return;
    }

    const courses = await storage.getCoursesWithRelations(italianLanguage.id, beginnerLevel.id);
    
    console.log('Italian Beginner Course Totals:');
    console.log('================================');
    
    courses.forEach(course => {
      const lessonCount = course.lessons.length;
      const checkpointCount = course.checkpoints.length;
      const total = lessonCount + checkpointCount;
      
      console.log(`Course ${course.courseNumber} (${course.title}): ${lessonCount} lessons + ${checkpointCount} checkpoints = ${total} total`);
    });

    // Get other languages if they exist
    const languages = await storage.getLanguages();
    for (const language of languages) {
      if (language.code === 'it') continue; // Skip Italian, already done
      
      const langCourses = await storage.getCoursesWithRelations(language.id, beginnerLevel.id);
      if (langCourses.length > 0) {
        console.log(`\n${language.name} Beginner Course Totals:`);
        console.log('=====================================');
        
        langCourses.forEach(course => {
          const lessonCount = course.lessons.length;
          const checkpointCount = course.checkpoints.length;
          const total = lessonCount + checkpointCount;
          
          console.log(`Course ${course.courseNumber} (${course.title}): ${lessonCount} lessons + ${checkpointCount} checkpoints = ${total} total`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

getCourseTotals();