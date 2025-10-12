import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle, FileJson, Video, Play } from 'lucide-react';
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
  const [step, setStep] = useState<'upload' | 'preview' | 'videos' | 'complete'>('upload');
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [uploadingJson, setUploadingJson] = useState(false);
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
      const uploadUrlResponse = await apiRequest<{ uploadURL: string }>('/api/admin/json/upload-url', {
        method: 'POST',
        body: JSON.stringify({ fileName: jsonFile.name }),
      });

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
      const response = await apiRequest<{ session: UploadSession }>('/api/admin/upload-sessions', {
        method: 'POST',
        body: JSON.stringify({
          jsonFileUrl,
          jsonContent,
        }),
      });

      setSessionId(response.session.id);
      setStep('preview');
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

  // Video slots that need uploads
  const videoSlots = session?.parsedLessons.flatMap(lesson =>
    lesson.steps
      .filter(step => step.stepType === 'irl_video' || step.stepType === 'pro_video')
      .map(step => ({
        lessonNumber: lesson.lessonNumber,
        stepNumber: step.stepNumber,
        lessonTitle: lesson.title,
        stepType: step.stepType,
      }))
  ) || [];

  // Check if video is already uploaded
  const isVideoUploaded = (lessonNumber: number, stepNumber: number) => {
    return session?.videos.some(
      v => v.lessonNumber === lessonNumber && v.stepNumber === stepNumber
    );
  };

  // Upload video mutation
  const uploadVideoMutation = useMutation({
    mutationFn: async (data: { lessonNumber: number; stepNumber: number; file: File }) => {
      // Get upload URL
      const uploadUrlResponse = await apiRequest<{ uploadURL: string }>('/api/admin/videos/upload-url', {
        method: 'POST',
        body: JSON.stringify({ fileName: data.file.name }),
      });

      // Upload to object storage
      await fetch(uploadUrlResponse.uploadURL, {
        method: 'PUT',
        body: data.file,
        headers: {
          'Content-Type': 'video/mp4',
        },
      });

      // Extract the object storage URL
      const url = new URL(uploadUrlResponse.uploadURL);
      const videoFileUrl = `${url.origin}${url.pathname}`;

      // Add video to session
      return apiRequest(`/api/admin/upload-sessions/${sessionId}/videos`, {
        method: 'POST',
        body: JSON.stringify({
          lessonNumber: data.lessonNumber,
          stepNumber: data.stepNumber,
          videoFileUrl,
          videoFileName: data.file.name,
          fileSize: data.file.size,
        }),
      });
    },
    onSuccess: () => {
      refetchSession();
      toast({
        title: 'Video uploaded successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Video upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Publish session mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/admin/upload-sessions/${sessionId}/publish`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      setStep('complete');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      toast({
        title: 'Course published successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Publish failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const canPublish = session && session.uploadedVideoCount === session.requiredVideoCount;

  return (
    <div className="space-y-6" data-testid="course-upload-wizard">
      {/* Step 1: Upload JSON */}
      {step === 'upload' && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Step 1: Upload Course JSON</h3>
          <div className="space-y-4">
            <div>
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
              data-testid="button-upload-json"
            >
              <FileJson className="mr-2 h-4 w-4" />
              {uploadingJson ? 'Uploading...' : 'Upload JSON'}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Preview Course Structure */}
      {step === 'preview' && session && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Step 2: Course Preview</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Language</p>
              <p className="font-medium">{session.languageId === 1 ? 'Italian' : session.languageId === 2 ? 'German' : 'French'} - Beginner</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Course Number</p>
              <p className="font-medium">{session.courseNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Title</p>
              <p className="font-medium">{session.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-medium">{session.description || 'No description'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Lessons</p>
              <p className="font-medium">{session.parsedLessons.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Required Videos</p>
              <p className="font-medium">{session.requiredVideoCount}</p>
            </div>
            
            <Alert>
              <AlertDescription>
                {session.requiredVideoCount === 0
                  ? 'This course has no video steps. You can publish it immediately.'
                  : `This course requires ${session.requiredVideoCount} video(s). Upload them in the next step.`}
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => session.requiredVideoCount > 0 ? setStep('videos') : publishMutation.mutate()}
              disabled={publishMutation.isPending}
              data-testid="button-next-step"
            >
              {session.requiredVideoCount > 0 ? 'Upload Videos' : 'Publish Now'}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Upload Videos */}
      {step === 'videos' && session && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Step 3: Upload Videos</h3>
          <div className="mb-4">
            <Progress value={(session.uploadedVideoCount / session.requiredVideoCount) * 100} />
            <p className="text-sm text-muted-foreground mt-2">
              {session.uploadedVideoCount} / {session.requiredVideoCount} videos uploaded
            </p>
          </div>

          <div className="space-y-4">
            {videoSlots.map((slot, index) => {
              const uploaded = isVideoUploaded(slot.lessonNumber, slot.stepNumber);
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        Lesson {slot.lessonNumber}, Step {slot.stepNumber}: {slot.lessonTitle}
                      </p>
                      <p className="text-sm text-muted-foreground">Type: {slot.stepType}</p>
                    </div>
                    {uploaded ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            uploadVideoMutation.mutate({
                              lessonNumber: slot.lessonNumber,
                              stepNumber: slot.stepNumber,
                              file,
                            });
                          }
                        }}
                        disabled={uploadVideoMutation.isPending}
                        className="w-64"
                        data-testid={`input-video-${slot.lessonNumber}-${slot.stepNumber}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={!canPublish || publishMutation.isPending}
              data-testid="button-publish"
            >
              <Play className="mr-2 h-4 w-4" />
              {publishMutation.isPending ? 'Publishing...' : 'Publish Course'}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-semibold">Course Published Successfully!</h3>
            <p className="text-muted-foreground">
              Your course has been published and is now available to students.
            </p>
            <Button onClick={() => {
              setStep('upload');
              setJsonFile(null);
              setSessionId(null);
              onComplete?.();
            }} data-testid="button-upload-another">
              Upload Another Course
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
