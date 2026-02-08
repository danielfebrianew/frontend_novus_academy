// types/electron.d.ts
export {};

declare global {
  interface Window {
    electronAPI?: {
      saveRefreshToken: (token: string) => Promise<void>;
      getRefreshToken: () => Promise<string | undefined>;
      removeRefreshToken: () => Promise<void>;
      downloadFile: (url: string, defaultFilename: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    };
  }
}