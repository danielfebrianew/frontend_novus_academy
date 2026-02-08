import { app } from 'electron';
import path from 'path';

// Mendeteksi apakah aplikasi sudah dipackage (EXE) atau masih Development
const isPackaged = app.isPackaged;

// Tentukan root path berdasarkan mode
const rootPath = isPackaged 
  ? process.resourcesPath // Di Production: menunjuk ke folder resources di dalam instalasi
  : process.cwd();        // Di Development: menunjuk ke root project folder

// Export path lengkap ke binary
export const ffmpegPath = path.join(rootPath, 'bin', 'ffmpeg.exe');
export const ffprobePath = path.join(rootPath, 'bin', 'ffprobe.exe');