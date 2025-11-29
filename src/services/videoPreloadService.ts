import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { apiClient } from '../lib/apiClient';
import type { ProgressData } from '../lib/apiClient';

interface VideoToPreload {
  url: string;
  language: string;
  courseId: string;
  lessonId: string;
  stepNumber: number;
  stepType: string;
}

interface PreloadedVideo {
  url: string;
  localUri: string | null;
  preloadedAt: number;
}

const PRELOAD_CACHE_DURATION = 30 * 60 * 1000;
const MAX_VIDEOS_TO_PRELOAD = 3;

class VideoPreloadService {
  private preloadedVideos: Map<string, PreloadedVideo> = new Map();
  private isPreloading: boolean = false;
  private authToken: string | null = null;
  private prefetchedUrls: Set<string> = new Set();

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  async eagerPreloadCurrentVideo(
    language: string,
    courseId: string,
    lessonId: string,
    stepNumber: number,
    videoUrl: string
  ): Promise<void> {
    if (!videoUrl) return;

    const normalizedUrl = this.normalizeAssetUrl(videoUrl);
    
    if (Platform.OS === 'web') {
      this.prefetchVideoForWeb(normalizedUrl);
      return;
    }

    const videoToPreload: VideoToPreload = {
      url: normalizedUrl,
      language,
      courseId,
      lessonId,
      stepNumber,
      stepType: 'eager'
    };

    console.log('🚀 Eager preloading current video:', this.getCacheKey(videoToPreload));
    await this.preloadVideos([videoToPreload]);
  }

  private prefetchVideoForWeb(url: string): void {
    if (typeof document === 'undefined') return;

    if (this.prefetchedUrls.has(url)) {
      console.log('📹 Video already prefetched for web:', url);
      return;
    }

    const existingLink = document.querySelector(`link[href="${url}"][rel="prefetch"]`);
    if (existingLink) {
      console.log('📹 Video prefetch link already exists:', url);
      this.prefetchedUrls.add(url);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'video';
    link.href = url;
    document.head.appendChild(link);
    
    this.prefetchedUrls.add(url);
    console.log('📹 Prefetching video for web:', url);

    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      this.prefetchedUrls.delete(url);
      console.log('📹 Cleaned up prefetch link for:', url);
    }, 60000);
  }

  async preloadVideosOnAppLaunch(userId: string): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('📹 Video preload skipped on app launch: Web platform uses link prefetch');
      return;
    }

    if (this.isPreloading) {
      console.log('📹 Video preload already in progress, skipping...');
      return;
    }

    try {
      this.isPreloading = true;
      console.log('📹 Starting video preload for user:', userId, 'on platform:', Platform.OS);

      const dashboardData = await apiClient.getDashboardData();
      
      if (!dashboardData || !dashboardData.progress) {
        console.log('📹 No progress data available, skipping preload');
        return;
      }

      // Get selected language from dashboard (check both user and settings)
      const selectedLanguage = dashboardData.user?.selectedLanguage || 
                               dashboardData.settings?.selectedLanguage;
      
      if (!selectedLanguage) {
        console.log('📹 No language selected, skipping video preload');
        return;
      }

      console.log('📹 User selected language:', selectedLanguage);

      const nextVideos = await this.findNext3Videos(
        dashboardData.progress,
        selectedLanguage
      );

      if (nextVideos.length === 0) {
        console.log('📹 No videos found to preload');
        return;
      }

      console.log(`📹 Found ${nextVideos.length} videos to preload:`, nextVideos.map(v => ({
        lesson: `${v.courseId}/${v.lessonId}/step${v.stepNumber}`,
        type: v.stepType
      })));

      await this.preloadVideos(nextVideos);
      
      console.log('✅ Video preload completed successfully');
    } catch (error) {
      console.error('❌ Error during video preload:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  private async findNext3Videos(
    progress: ProgressData[],
    selectedLanguage: string
  ): Promise<VideoToPreload[]> {
    const videosToPreload: VideoToPreload[] = [];

    const currentProgress = this.findCurrentPosition(progress, selectedLanguage);
    
    if (!currentProgress) {
      console.log('📹 User has no progress yet, starting with first lesson');
      const firstLessonVideos = await this.getVideosFromLesson(
        selectedLanguage,
        'course1',
        'lesson1',
        1
      );
      return firstLessonVideos.slice(0, MAX_VIDEOS_TO_PRELOAD);
    }

    console.log('📹 Current position:', {
      courseId: currentProgress.courseId,
      lessonId: currentProgress.lessonId,
      stepNumber: currentProgress.stepNumber
    });

    let currentCourseId = currentProgress.courseId;
    let currentLessonId = currentProgress.lessonId;
    let currentStepNumber = currentProgress.stepNumber + 1;

    try {
      const currentLessonData = await apiClient.getLessonData(
        selectedLanguage,
        currentCourseId,
        currentLessonId
      );

      const remainingVideos = await this.getVideosFromLesson(
        selectedLanguage,
        currentCourseId,
        currentLessonId,
        currentStepNumber,
        currentLessonData
      );

      videosToPreload.push(...remainingVideos);

      if (videosToPreload.length < MAX_VIDEOS_TO_PRELOAD) {
        const nextLessons = await this.getNextLessons(
          selectedLanguage,
          currentCourseId,
          currentLessonId
        );

        for (const nextLesson of nextLessons) {
          if (videosToPreload.length >= MAX_VIDEOS_TO_PRELOAD) break;

          const nextLessonVideos = await this.getVideosFromLesson(
            selectedLanguage,
            nextLesson.courseId,
            nextLesson.lessonId,
            1
          );

          videosToPreload.push(...nextLessonVideos);
        }
      }
    } catch (error) {
      console.error('📹 Error fetching lesson data:', error);
    }

    return videosToPreload.slice(0, MAX_VIDEOS_TO_PRELOAD);
  }

  private findCurrentPosition(progress: ProgressData[], language: string): ProgressData | null {
    const languageProgress = progress.filter(p => 
      p.courseId.toLowerCase().includes(language.toLowerCase()) ||
      p.lessonTitle?.toLowerCase().includes(language.toLowerCase())
    );

    if (languageProgress.length === 0) {
      return null;
    }

    const sortedProgress = languageProgress.sort((a, b) => {
      const courseA = parseInt(a.courseId.replace(/\D/g, ''), 10) || 0;
      const courseB = parseInt(b.courseId.replace(/\D/g, ''), 10) || 0;
      
      if (courseA !== courseB) return courseB - courseA;

      const lessonA = parseInt(a.lessonId.replace(/\D/g, ''), 10) || 0;
      const lessonB = parseInt(b.lessonId.replace(/\D/g, ''), 10) || 0;
      
      if (lessonA !== lessonB) return lessonB - lessonA;

      return b.stepNumber - a.stepNumber;
    });

    return sortedProgress[0];
  }

  private async getVideosFromLesson(
    language: string,
    courseId: string,
    lessonId: string,
    startingStep: number,
    lessonData?: any
  ): Promise<VideoToPreload[]> {
    const videos: VideoToPreload[] = [];

    try {
      const data = lessonData || await apiClient.getLessonData(language, courseId, lessonId);

      if (!data || !data.lesson) {
        return videos;
      }

      const lesson = data.lesson;
      let steps: any[] = [];

      if (Array.isArray(lesson.steps)) {
        steps = lesson.steps;
      } else if (lesson.steps && typeof lesson.steps === 'object') {
        const stepKeys = Object.keys(lesson.steps);
        const sortedKeys = stepKeys.sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });
        steps = sortedKeys.map(key => ({
          stepNumber: parseInt(key.replace(/\D/g, ''), 10) || 0,
          stepType: lesson.steps[key].type || 'unknown',
          content: lesson.steps[key]
        }));
      } else {
        for (let i = 1; i <= 10; i++) {
          const stepKey = `step${i}`;
          if (lesson[stepKey]) {
            steps.push({
              stepNumber: i,
              stepType: lesson[stepKey].type || 'unknown',
              content: lesson[stepKey]
            });
          }
        }
      }

      for (const step of steps) {
        if (step.stepNumber < startingStep) continue;

        const stepType = step.stepType || step.content?.type;
        
        if (stepType === 'pro_video' || stepType === 'video' || stepType === 'video_choice' || stepType === 'irl_video') {
          let videoUrl = this.extractVideoUrl(step);

          if (videoUrl) {
            videoUrl = this.normalizeAssetUrl(videoUrl);
            videos.push({
              url: videoUrl,
              language,
              courseId,
              lessonId,
              stepNumber: step.stepNumber,
              stepType
            });
          }
        }
      }
    } catch (error) {
      console.error(`📹 Error getting videos from ${courseId}/${lessonId}:`, error);
    }

    return videos;
  }

  private extractVideoUrl(step: any): string | null {
    const content = step.content || step;

    if (content.videoUrl) return content.videoUrl;
    if (content.video_url) return content.video_url;
    if (content.video?.url) return content.video.url;
    
    if (step.stepType === 'video_choice' && content.options && content.options.length > 0) {
      const firstOption = content.options[0];
      if (firstOption.video?.url) return firstOption.video.url;
      if (firstOption.videoUrl) return firstOption.videoUrl;
      if (firstOption.video_url) return firstOption.video_url;
    }

    if (step.video_url) return step.video_url;
    if (step.videoUrl) return step.videoUrl;

    return null;
  }

  private normalizeAssetUrl(url: string): string {
    if (!url) return '';

    const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 
                       (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) ||
                       '';

    if (!apiBaseUrl) {
      console.warn('⚠️ API base URL is missing for video preload');
      return url;
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/replit-objstore-') || url.startsWith('replit-objstore-')) {
      const normalizedPath = url.startsWith('/') ? url : '/' + url;
      return apiBaseUrl + '/api/videos' + normalizedPath;
    }

    if (url.startsWith('/attached_assets/')) {
      return apiBaseUrl + url;
    }

    if (url.startsWith('attached_assets/')) {
      return apiBaseUrl + '/' + url;
    }

    if (url.startsWith('/videos/')) {
      return apiBaseUrl + '/attached_assets' + url;
    }

    if (url.startsWith('/')) {
      return apiBaseUrl + url;
    }

    return apiBaseUrl + '/attached_assets/' + url;
  }

  private async getNextLessons(
    language: string,
    currentCourseId: string,
    currentLessonId: string
  ): Promise<Array<{ courseId: string; lessonId: string }>> {
    const nextLessons: Array<{ courseId: string; lessonId: string }> = [];

    const currentLessonNum = parseInt(currentLessonId.replace(/\D/g, ''), 10) || 1;
    const currentCourseNum = parseInt(currentCourseId.replace(/\D/g, ''), 10) || 1;

    nextLessons.push({
      courseId: currentCourseId,
      lessonId: `lesson${currentLessonNum + 1}`
    });

    nextLessons.push({
      courseId: currentCourseId,
      lessonId: `lesson${currentLessonNum + 2}`
    });

    nextLessons.push({
      courseId: `course${currentCourseNum + 1}`,
      lessonId: 'lesson1'
    });

    return nextLessons;
  }

  private async preloadVideos(videos: VideoToPreload[]): Promise<void> {
    const preloadPromises = videos.map(async (videoInfo) => {
      const cacheKey = this.getCacheKey(videoInfo);

      if (this.preloadedVideos.has(cacheKey)) {
        const cached = this.preloadedVideos.get(cacheKey)!;
        const age = Date.now() - cached.preloadedAt;
        
        if (age < PRELOAD_CACHE_DURATION) {
          console.log(`📹 Video already preloaded (cached ${Math.round(age / 1000)}s ago):`, cacheKey);
          return;
        } else {
          console.log(`📹 Cached video expired, removing:`, cacheKey);
          if (cached.localUri) {
            try {
              await FileSystem.deleteAsync(cached.localUri, { idempotent: true });
            } catch (err) {
              console.warn(`⚠️ Failed to delete expired video file:`, err);
            }
          }
          this.preloadedVideos.delete(cacheKey);
        }
      }

      try {
        console.log(`📹 Preloading video:`, cacheKey);
        console.log(`📹 Video URL:`, videoInfo.url);

        const fileName = `preload_${videoInfo.language}_${videoInfo.courseId}_${videoInfo.lessonId}_step${videoInfo.stepNumber}.mp4`;
        const localUri = `${FileSystem.documentDirectory}${fileName}`;

        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (fileInfo.exists) {
          console.log(`✅ Video already cached locally:`, cacheKey);
          this.preloadedVideos.set(cacheKey, {
            url: videoInfo.url,
            localUri,
            preloadedAt: Date.now()
          });
          return;
        }

        const headers: { [key: string]: string } = {};
        if (this.authToken) {
          headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        const downloadResumable = FileSystem.createDownloadResumable(
          videoInfo.url,
          localUri,
          { headers }
        );

        const result = await downloadResumable.downloadAsync();

        if (result && result.uri) {
          this.preloadedVideos.set(cacheKey, {
            url: videoInfo.url,
            localUri: result.uri,
            preloadedAt: Date.now()
          });

          console.log(`✅ Preloaded video to disk:`, cacheKey, '→', result.uri);
        } else {
          console.warn(`⚠️ Video download completed but no URI returned:`, cacheKey);
        }
      } catch (error) {
        console.error(`❌ Failed to preload video ${cacheKey}:`, error);
      }
    });

    await Promise.all(preloadPromises);
  }

  private getCacheKey(videoInfo: VideoToPreload): string {
    return `${videoInfo.language}/${videoInfo.courseId}/${videoInfo.lessonId}/step${videoInfo.stepNumber}`;
  }

  getPreloadedVideo(language: string, courseId: string, lessonId: string, stepNumber: number): string | null {
    const cacheKey = `${language}/${courseId}/${lessonId}/step${stepNumber}`;
    const cached = this.preloadedVideos.get(cacheKey);

    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.preloadedAt;
    
    if (age > PRELOAD_CACHE_DURATION) {
      console.log(`📹 Cached video expired:`, cacheKey);
      if (cached.localUri) {
        FileSystem.deleteAsync(cached.localUri, { idempotent: true }).catch(err => {
          console.warn(`⚠️ Failed to delete expired video file:`, err);
        });
      }
      this.preloadedVideos.delete(cacheKey);
      return null;
    }

    if (cached.localUri) {
      console.log(`✅ Using preloaded video from disk (cached ${Math.round(age / 1000)}s ago):`, cacheKey);
      return cached.localUri;
    }

    console.log(`⚠️ Preloaded video has no local URI, using remote URL:`, cacheKey);
    return cached.url;
  }

  async clearCache(): Promise<void> {
    console.log(`📹 Clearing video preload cache (${this.preloadedVideos.size} videos)`);
    
    const deletePromises: Promise<void>[] = [];
    for (const [key, cached] of this.preloadedVideos.entries()) {
      if (cached.localUri) {
        deletePromises.push(
          FileSystem.deleteAsync(cached.localUri, { idempotent: true })
            .then(() => console.log(`🗑️ Deleted cached video:`, key))
            .catch(err => console.warn(`⚠️ Failed to delete video file for ${key}:`, err))
        );
      }
    }
    
    await Promise.allSettled(deletePromises);
    this.preloadedVideos.clear();
  }

  getCacheStats(): { count: number; keys: string[] } {
    return {
      count: this.preloadedVideos.size,
      keys: Array.from(this.preloadedVideos.keys())
    };
  }
}

export const videoPreloadService = new VideoPreloadService();
