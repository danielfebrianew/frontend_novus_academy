export interface CreateProResponse {
  statusCode: number;
  message: string;
  data: {
    jobId: string;
    taskId: string;
    generatedPrompt: string;
  };
}

export interface ProProgressEvent {
  message: string;
  progress: number;
  resultUrls: string[] | null;
  failMsg: string | null;
}
