import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Video, FileJson, Trash2, Check, X, Play, Upload as UploadIcon, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DraftUpload {
  id: number;
  uploadType: 'video' | 'json';
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  metadata?: any;
  status: 'draft' | 'published' | 'failed';
  uploadedBy: string;
  publishedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export default function UploadsManager() {
  const [uploadTab, setUploadTab] = useState<'video' | 'json'>('video');
  const { toast } = useToast();

  // Fetch drafts
  const { data: drafts = [], isLoading: draftsLoading } = useQuery<DraftUpload[]>({
    queryKey: ['/api/admin/drafts'],
  });

  const videoDrafts = drafts.filter(d => d.uploadType === 'video');
  const jsonDrafts = drafts.filter(d => d.uploadType === 'json');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadIcon className="w-5 h-5" />
            Upload Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as 'video' | 'json')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="video" data-testid="tab-video-upload">
                <Video className="w-4 h-4 mr-2" />
                Video Upload
              </TabsTrigger>
              <TabsTrigger value="json" data-testid="tab-json-upload">
                <FileJson className="w-4 h-4 mr-2" />
                JSON Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="video">
              <VideoUploadForm />
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Video Drafts</h3>
                {draftsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : videoDrafts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No video drafts</p>
                ) : (
                  <div className="space-y-4">
                    {videoDrafts.map(draft => (
                      <VideoDraftCard key={draft.id} draft={draft} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="json">
              <JSONUploadForm />
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">JSON Drafts</h3>
                {draftsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : jsonDrafts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No JSON drafts</p>
                ) : (
                  <div className="space-y-4">
                    {jsonDrafts.map(draft => (
                      <JSONDraftCard key={draft.id} draft={draft} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function VideoUploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDraftId, setSelectedDraftId] = useState('');
  const [languageId, setLanguageId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [lessonNumber, setLessonNumber] = useState('');
  const [stepNumber, setStepNumber] = useState('4'); // Default to step 4
  const [videoLabel, setVideoLabel] = useState(''); // For video_choice types
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: jsonDrafts = [] } = useQuery<DraftUpload[]>({
    queryKey: ['/api/admin/drafts'],
    select: (data) => data.filter(d => d.uploadType === 'json' && d.status === 'draft'),
  });

  const { data: languages = [] } = useQuery<Array<{ id: number; code: string; name: string }>>({
    queryKey: ['/api/languages'],
  });

  const { data: courses = [] } = useQuery<Array<{ id: number; title: string; languageId: number }>>({
    queryKey: ['/api/db/courses'],
    enabled: !!languageId,
  });

  const selectedDraft = jsonDrafts.find(d => d.id.toString() === selectedDraftId);
  const draftMetadata = selectedDraft?.metadata as any;
  const filteredCourses = courses.filter(c => c.languageId === parseInt(languageId));
  
  // Get available lessons that need videos from the draft
  const availableLessons = draftMetadata?.videoRequirements || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !languageId || !courseId || !lessonNumber || !stepNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill all fields and select a video file",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Get presigned URL
      const { uploadURL, objectPath } = await apiRequest('/api/admin/videos/upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename: selectedFile.name }),
      });

      // Upload to object storage
      await fetch(uploadURL, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      // Save draft metadata
      await apiRequest('/api/admin/videos/draft', {
        method: 'POST',
        body: JSON.stringify({
          fileName: selectedFile.name,
          objectPath: objectPath,
          fileSize: selectedFile.size,
          languageId: parseInt(languageId),
          courseId: parseInt(courseId),
          lessonNumber: parseInt(lessonNumber),
          stepNumber: parseInt(stepNumber),
          parentDraftId: selectedDraftId ? parseInt(selectedDraftId) : undefined,
          videoLabel: videoLabel || undefined,
        }),
      });

      // Refresh drafts
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drafts'] });

      toast({
        title: "Success",
        description: "Video uploaded successfully. Upload more or publish when ready.",
      });

      // Reset file but keep draft selection
      setSelectedFile(null);
      setLessonNumber('');
      setVideoLabel('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <label className="block text-sm font-medium mb-2">Select Course Draft (Optional)</label>
        <Select value={selectedDraftId} onValueChange={(value) => {
          setSelectedDraftId(value);
          const draft = jsonDrafts.find(d => d.id.toString() === value);
          if (draft) {
            const meta = draft.metadata as any;
            // Auto-select language if available
            const lang = languages.find(l => l.code === meta.languageCode);
            if (lang) setLanguageId(lang.id.toString());
          }
        }}>
          <SelectTrigger data-testid="select-course-draft">
            <SelectValue placeholder="Select a JSON course draft or upload manually" />
          </SelectTrigger>
          <SelectContent>
            {jsonDrafts.map(draft => {
              const meta = draft.metadata as any;
              return (
                <SelectItem key={draft.id} value={draft.id.toString()}>
                  {meta?.languageCode?.toUpperCase()} {meta?.skillLevelCode} Course{meta?.courseNumber} - {meta?.courseTitle}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {draftMetadata && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Videos: {draftMetadata.videosUploaded || 0} / {draftMetadata.videosRequired || 0} uploaded
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Language</label>
          <Select value={languageId} onValueChange={setLanguageId}>
            <SelectTrigger data-testid="select-language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map(lang => (
                <SelectItem key={lang.id} value={lang.id.toString()}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Course</label>
          <Select value={courseId} onValueChange={setCourseId} disabled={!languageId}>
            <SelectTrigger data-testid="select-course">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {filteredCourses.map(course => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Lesson {availableLessons.length > 0 ? "(from draft)" : "Number"}
          </label>
          {availableLessons.length > 0 ? (
            <Select value={lessonNumber} onValueChange={setLessonNumber}>
              <SelectTrigger data-testid="select-lesson">
                <SelectValue placeholder="Select lesson" />
              </SelectTrigger>
              <SelectContent>
                {availableLessons.map((req: any) => (
                  <SelectItem key={req.lessonNumber} value={req.lessonNumber.toString()}>
                    Lesson {req.lessonNumber}: {req.lessonTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="number"
              value={lessonNumber}
              onChange={(e) => setLessonNumber(e.target.value)}
              placeholder="e.g., 1"
              data-testid="input-lesson-number"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Step Number</label>
          <Input
            type="number"
            value={stepNumber}
            onChange={(e) => setStepNumber(e.target.value)}
            placeholder="Usually 4"
            data-testid="input-step-number"
          />
        </div>
      </div>

      {availableLessons.find((req: any) => req.lessonNumber === parseInt(lessonNumber))?.videoType === 'video_choice' && (
        <div>
          <label className="block text-sm font-medium mb-2">Video Label (for video_choice)</label>
          <Select value={videoLabel} onValueChange={setVideoLabel}>
            <SelectTrigger data-testid="select-video-label">
              <SelectValue placeholder="Select video option" />
            </SelectTrigger>
            <SelectContent>
              {availableLessons.find((req: any) => req.lessonNumber === parseInt(lessonNumber))?.videosNeeded.map((vid: any, idx: number) => (
                <SelectItem key={idx} value={vid.label}>
                  {vid.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Video File</label>
        <Input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          data-testid="input-video-file"
        />
        {selectedFile && (
          <p className="text-sm text-gray-600 mt-2">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      <Button
        onClick={handleUpload}
        disabled={uploading || !selectedFile}
        className="w-full"
        data-testid="button-upload-video"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <UploadIcon className="w-4 h-4 mr-2" />
            Upload Video
          </>
        )}
      </Button>
    </div>
  );
}

function VideoDraftCard({ draft }: { draft: DraftUpload }) {
  const { toast } = useToast();
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await apiRequest(`/api/admin/videos/${draft.id}/publish`, {
        method: 'POST',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/drafts'] });

      toast({
        title: "Published",
        description: "Video is now live!",
      });
    } catch (error: any) {
      toast({
        title: "Publish Failed",
        description: error.message || "Failed to publish video",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiRequest(`/api/admin/drafts/${draft.id}`, {
        method: 'DELETE',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/drafts'] });

      toast({
        title: "Deleted",
        description: "Draft deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete draft",
        variant: "destructive",
      });
    }
  };

  const metadata = draft.metadata as any;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-5 h-5 text-blue-500" />
              <h4 className="font-semibold">{draft.fileName}</h4>
              <Badge variant={draft.status === 'published' ? 'default' : draft.status === 'failed' ? 'destructive' : 'secondary'}>
                {draft.status}
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>Course ID: {metadata?.courseId}, Lesson: {metadata?.lessonNumber}, Step: {metadata?.stepNumber}</p>
              {draft.fileSize && <p>Size: {(draft.fileSize / 1024 / 1024).toFixed(2)} MB</p>}
              <p>Uploaded: {format(new Date(draft.createdAt), 'MMM d, yyyy HH:mm')}</p>
              {draft.publishedAt && <p>Published: {format(new Date(draft.publishedAt), 'MMM d, yyyy HH:mm')}</p>}
              {draft.errorMessage && <p className="text-red-600">Error: {draft.errorMessage}</p>}
            </div>
          </div>

          <div className="flex gap-2">
            {draft.status === 'draft' && (
              <Button
                onClick={handlePublish}
                disabled={publishing}
                size="sm"
                data-testid={`button-publish-${draft.id}`}
              >
                {publishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Publish
                  </>
                )}
              </Button>
            )}
            
            {draft.status !== 'published' && (
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                data-testid={`button-delete-${draft.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function JSONUploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonContent, setJsonContent] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      try {
        const text = await file.text();
        const json = JSON.parse(text);
        setJsonContent(json);
        setPreview(null);
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "The selected file is not valid JSON",
          variant: "destructive",
        });
        setSelectedFile(null);
        setJsonContent(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !jsonContent) {
      toast({
        title: "No File Selected",
        description: "Please select a JSON file",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Get presigned URL
      const { uploadURL, objectPath } = await apiRequest('/api/admin/json/upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename: selectedFile.name }),
      });

      // Upload to object storage
      await fetch(uploadURL, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Save draft with preview
      const result = await apiRequest('/api/admin/json/draft', {
        method: 'POST',
        body: JSON.stringify({
          fileName: selectedFile.name,
          objectPath: objectPath, // Use object path instead of upload URL
          jsonContent,
        }),
      });

      setPreview(result.preview);

      // Refresh drafts
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drafts'] });

      toast({
        title: "Success",
        description: "JSON uploaded successfully. Review and publish when ready.",
      });

      // Reset form
      setSelectedFile(null);
      setJsonContent(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload JSON",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">JSON Course File</label>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          data-testid="input-json-file"
        />
        {selectedFile && jsonContent && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-semibold mb-2">File Preview:</h4>
            <p className="text-sm text-gray-600">File: {selectedFile.name}</p>
            <p className="text-sm text-gray-600">Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            {preview && (
              <div className="mt-2 text-sm">
                <p><strong>Title:</strong> {preview.title}</p>
                <p><strong>Lessons:</strong> {preview.totalLessons}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Button
        onClick={handleUpload}
        disabled={uploading || !selectedFile}
        className="w-full"
        data-testid="button-upload-json"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <UploadIcon className="w-4 h-4 mr-2" />
            Upload JSON
          </>
        )}
      </Button>
    </div>
  );
}

function JSONDraftCard({ draft }: { draft: DraftUpload }) {
  const { toast } = useToast();
  const [publishing, setPublishing] = useState(false);
  const [jsonContent, setJsonContent] = useState<any>(null);

  const metadata = draft.metadata as any;
  const videosComplete = metadata.videosRequired === 0 || (metadata.videosUploaded >= metadata.videosRequired);
  const missingVideos = metadata.videosRequired - (metadata.videosUploaded || 0);

  const handlePublish = async () => {
    if (!jsonContent) {
      toast({
        title: "Missing JSON Content",
        description: "Please reload the JSON file before publishing",
        variant: "destructive",
      });
      return;
    }

    if (!videosComplete) {
      toast({
        title: "Videos Incomplete",
        description: `Please upload ${missingVideos} more video(s) before publishing`,
        variant: "destructive",
      });
      return;
    }

    try {
      setPublishing(true);
      await apiRequest(`/api/admin/json/${draft.id}/publish`, {
        method: 'POST',
        body: JSON.stringify({
          jsonContent,
        }),
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/drafts'] });

      toast({
        title: "Published",
        description: "Course imported successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Publish Failed",
        description: error.message || "Failed to publish course",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiRequest(`/api/admin/drafts/${draft.id}`, {
        method: 'DELETE',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/drafts'] });

      toast({
        title: "Deleted",
        description: "Draft deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete draft",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileJson className="w-5 h-5 text-green-500" />
              <h4 className="font-semibold">{draft.fileName}</h4>
              <Badge variant={draft.status === 'published' ? 'default' : draft.status === 'failed' ? 'destructive' : 'secondary'}>
                {draft.status}
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              {metadata?.preview && (
                <>
                  <p><strong>Course:</strong> {metadata.preview.title}</p>
                  <p><strong>Language:</strong> {metadata.languageCode?.toUpperCase()} - {metadata.skillLevelCode}</p>
                  <p><strong>Course Number:</strong> {metadata.courseNumber}</p>
                  <p><strong>Total Lessons:</strong> {metadata.preview.totalLessons}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className={videosComplete ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
                      Videos: {metadata.videosUploaded || 0} / {metadata.videosRequired || 0}
                    </p>
                    {videosComplete ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                </>
              )}
              <p>Uploaded: {format(new Date(draft.createdAt), 'MMM d, yyyy HH:mm')}</p>
              {draft.publishedAt && <p>Published: {format(new Date(draft.publishedAt), 'MMM d, yyyy HH:mm')}</p>}
              {draft.errorMessage && <p className="text-red-600">Error: {draft.errorMessage}</p>}
            </div>

            {draft.status === 'draft' && (
              <div className="mt-4 space-y-2">
                <Input
                  type="file"
                  accept=".json"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const text = await e.target.files[0].text();
                      setJsonContent(JSON.parse(text));
                      toast({
                        title: "JSON Loaded",
                        description: "Ready to publish when videos are complete",
                      });
                    }
                  }}
                  data-testid="input-reload-json"
                />
                <p className="text-xs text-gray-500">
                  {!videosComplete 
                    ? `⚠️ Upload ${missingVideos} more video(s) before publishing`
                    : !jsonContent 
                      ? "Load the JSON file above, then click Publish"
                      : "✓ Ready to publish!"}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {draft.status === 'draft' && (
              <Button
                onClick={handlePublish}
                disabled={publishing || !videosComplete || !jsonContent}
                size="sm"
                data-testid={`button-publish-json-${draft.id}`}
              >
                {publishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Publish
                  </>
                )}
              </Button>
            )}
            
            {draft.status !== 'published' && (
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                data-testid={`button-delete-json-${draft.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
