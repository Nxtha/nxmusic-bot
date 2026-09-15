const fs = require('fs');
const config = require('../config/config');
const path = require('path');

function ensureYtdlp() {
  if (config.ytdlpPath && !fs.existsSync(config.ytdlpPath)) {
    throw new Error(`YTDLP_PATH not found: ${config.ytdlpPath}`);
  }
  if (config.ytdlpPath) return config.ytdlpPath;
  const packageEntry = require.resolve('youtube-dl-exec');
  const packageRoot = path.resolve(path.dirname(packageEntry), '..');
  const filename = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const bundled = path.join(packageRoot, 'bin', filename);
  if (!fs.existsSync(bundled)) throw new Error(`youtube-dl-exec binary not found: ${bundled}`);
  return bundled;
}

function ensure() {
  const ytdlp = ensureYtdlp();
  let ffmpeg = config.ffmpegPath;
  if (ffmpeg) {
    if (!fs.existsSync(ffmpeg)) throw new Error(`FFMPEG_PATH not found: ${ffmpeg}`);
  } else {
    ffmpeg = require('ffmpeg-static');
    if (!ffmpeg || !fs.existsSync(ffmpeg)) throw new Error('FFmpeg binary unavailable');
  }
  return { ytdlp, ffmpeg };
}

module.exports = { ensure, ensureYtdlp };
