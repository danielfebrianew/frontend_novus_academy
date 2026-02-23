export interface CreateProResponse {
  statusCode: number;
  message: string;
  data: {
    jobId: string;
    taskId: string;
    imageUrl: string;
    generatedPrompt: string;
  };
}

export interface ProProgressEvent {
  message: string;
  progress: number;
  resultUrls: string[] | null;
  failMsg: string | null;
}

export interface KieJobRecord {
  code: number;
  message: string;
  data: {
    taskId: string;
    state: 'success' | 'processing' | 'fail' | 'queue';
    resultJson: string | null;
    failMsg: string;
  };
}

export interface StatusResponse {
  statusCode: number;
  message: string;
  data: {
    taskId: string;
    state: 'success' | 'processing' | 'fail';
    model: string;
    resultUrls: string[];
    failCode: string | null;
    failMsg: string | null;
    costTime: number;
  };
}
