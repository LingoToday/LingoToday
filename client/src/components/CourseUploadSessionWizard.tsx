import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, FileJson, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CourseUploadSessionWizardProps {
  onComplete?: () => void;
}

interface ParsedLesson {
  lessonNumber: number;
  title: string;
  steps: {
    stepNumber: number;
    stepType: string;
    content: any;
  }[];
}

interface UploadSession {
  id: number;
  status: string;
  languageId: number;
  skillLevelId: number;
  courseNumber: number;
  title: string;
  description: string;
  parsedLessons: ParsedLesson[];
  requiredVideoCount: number;
  uploadedVideoCount: number;
  jsonFileUrl: string;
  videos: any[];
}

export function CourseUploadSessionWizard({ onComplete }: CourseUploadSessionWizardProps) {
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [uploadingJson, setUploadingJson] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch session details
  const { data: session, refetch: refetchSession } = useQuery<UploadSession>({
    queryKey: [`/api/admin/upload-sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  // Handle JSON file upload
  const handleJsonUpload = async () => {
    if (!jsonFile) return;

    setUploadingJson(true);
    try {
      // Read file content
      const fileContent = await jsonFile.text();
      const jsonContent = JSON.parse(fileContent);

      // Get upload URL
      const uploadUrlRes = await apiRequest('POST', '/api/admin/json/upload-url', { filename: jsonFile.name });
      const uploadUrlResponse = await uploadUrlRes.json() as { uploadURL: string };

      // Upload to object storage
      await fetch(uploadUrlResponse.uploadURL, {
        method: 'PUT',
        body: jsonFile,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Extract the object storage URL from the upload URL
      const url = new URL(uploadUrlResponse.uploadURL);
      const jsonFileUrl = `${url.origin}${url.pathname}`;

      // Create upload session
      const sessionRes = await apiRequest('POST', '/api/admin/upload-sessions', {
        jsonFileUrl,
        jsonContent,
      });
      const response = await sessionRes.json() as { session: UploadSession };

      setSessionId(response.session.id);
      toast({
        title: 'JSON uploaded successfully',
        description: `Course: ${response.session.title}`,
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingJson(false);
    }
  };

  // Get video step for a lesson
  const getVideoStep = (lesson: ParsedLesson) => {
    return lesson.steps.find(step => 
      step.stepType === 'irl_video' || 
      step.stepType === 'pro_video' || 
      step.stepType === 'video_choice' || 
      step.stepType === 'video'
    );
  };

  // Check if video is uploaded for a lesson
  const isVideoUploaded = (lessonNumber: number) => {
    const videoStep = session?.parsedLessons
      .find(l => l.lessonNumber === lessonNumber)
      ?.steps.find(s => s.stepType === 'irl_video' || s.stepType === 'pro_video' || s.stepType === 'video_choice' || s.stepType === 'video');
    
    if (!videoStep) return false;

    return session?.videos.some(
      v => v.lessonNumber === lessonNumber && v.stepNumber === videoStep.stepNumber
    );
  };

  // Handle video upload for a lesson
  const handleVideoUpload = async (lessonNumber: number, file: File) => {
    const videoStep = session?.parsedLessons
      .find(l => l.lessonNumber === lessonNumber)
      ?.steps.find(s => s.stepType === 'irl_video' || s.stepType === 'pro_video' || s.stepType === 'video_choice' || s.stepType === 'video');

    if (!videoStep) {
      toast({
        title: 'Error',
        description: 'No video step found for this lesson',
        variant: 'destructive',
      });
      return;
    }

    const key = `${lessonNumber}-${videoStep.stepNumber}`;
    setUploadingVideos(prev => new Set(prev).add(key));

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('video', file);
      formData.append('lessonNumber', lessonNumber.toString());
      formData.append('stepNumber', videoStep.stepNumber.toString());

      // Upload video directly to server
      const response = await fetch(`/api/admin/upload-sessions/${sessionId}/videos`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include session cookie
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload video');
      }

      await refetchSession();
      toast({
        title: 'Video uploaded successfully',
        description: `Lesson ${lessonNumber}: ${file.name}`,
      });
    } catch (error: any) {
      toast({
        title: 'Video upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingVideos(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // Publish session mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/admin/upload-sessions/${sessionId}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      toast({
        title: 'Course published successfully',
        description: 'The course is now live!',
      });
      onComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Publish failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const canPublish = session && session.requiredVideoCount === session.uploadedVideoCount;

  return (
    <div className="space-y-6">
      {/* JSON Upload Section */}
      {!session && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Upload Course JSON</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="json-file">Course JSON File</Label>
              <Input
                id="json-file"
                type="file"
                accept=".json"
                onChange={(e) => setJsonFile(e.target.files?.[0] || null)}
                data-testid="input-json-file"
              />
            </div>

            <Button
              onClick={handleJsonUpload}
              disabled={!jsonFile || uploadingJson}
              className="w-full"
              data-testid="button-upload-json"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadingJson ? 'Uploading...' : 'Upload JSON'}
            </Button>
          </div>
        </Card>
      )}

      {/* Course Preview & Video Upload Section */}
      {session && (
        <div className="space-y-6">
          {/* Course Info */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Course Preview</h3>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Language</div>
                <div className="font-medium" data-testid="text-course-language">
                  {session.parsedLessons[0] ? 'Italian - Beginner' : 'Unknown'}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Course Number</div>
                <div className="font-medium" data-testid="text-course-number">{session.courseNumber}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Title</div>
                <div className="font-medium" data-testid="text-course-title">{session.title}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Description</div>
                <div className="font-medium" data-testid="text-course-description">{session.description}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Total Lessons</div>
                <div className="font-medium" data-testid="text-total-lessons">{session.parsedLessons.length}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Required Videos</div>
                <div className="font-medium" data-testid="text-required-videos">
                  {session.uploadedVideoCount} / {session.requiredVideoCount}
                </div>
              </div>
            </div>

            {session.requiredVideoCount === 0 ? (
              <Alert className="mt-4">
                <AlertDescription>
                  This course has no video steps. You can publish it immediately.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="mt-4">
                <AlertDescription>
                  This course requires {session.requiredVideoCount} video(s). Upload them below.
                </AlertDescription>
              </Alert>
            )}
          </Card>

          {/* Video Upload Section */}
          {session.requiredVideoCount > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Video className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Upload Videos</h3>
              </div>

              <div className="space-y-3">
                {session.parsedLessons.map(lesson => {
                  const videoStep = getVideoStep(lesson);
                  if (!videoStep) return null;

                  const isUploaded = isVideoUploaded(lesson.lessonNumber);
                  const isUploading = uploadingVideos.has(`${lesson.lessonNumber}-${videoStep.stepNumber}`);

                  return (
                    <div 
                      key={lesson.lessonNumber}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`lesson-upload-${lesson.lessonNumber}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">Lesson {lesson.lessonNumber}: {lesson.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Step {videoStep.stepNumber} ({videoStep.stepType})
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUploaded ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm font-medium">Uploaded</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleVideoUpload(lesson.lessonNumber, file);
                                }
                              }}
                              disabled={isUploading}
                              className="max-w-[200px]"
                              data-testid={`input-video-lesson-${lesson.lessonNumber}`}
                            />
                            {isUploading && (
                              <span className="text-sm text-muted-foreground">Uploading...</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Publish Button */}
          <Card className="p-6">
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={!canPublish || publishMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-publish-course"
            >
              {publishMutation.isPending ? 'Publishing...' : 'Publish Course'}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
