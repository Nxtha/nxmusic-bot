/**
 * Postinstall script: update the yt-dlp binary bundled by youtube-dl-exec.
 * This follows the same model used by the reference MusicBot.
 */
const {
    execFileSync
} = require('child_process');
const path = require('path');
const fs = require('fs');
const binDir = path.join(__dirname, '..', 'node_modules', 'youtube-dl-exec', 'bin');
const binary = process.platform === 'win32' ? path.join(binDir, 'yt-dlp.exe'): path.join(binDir, 'yt-dlp');
if (!fs.existsSync(binary)) {
    console.log('ℹ️ [yt-dlp] bundled binary not found yet, skipping update.');
    process.exit(0);
}
console.log('🔄 [yt-dlp] Updating bundled yt-dlp...');
try {
    execFileSync(binary, ['-U'], {
        stdio: 'inherit'
    });
} catch(e) {
    // yt-dlp can return 1 after successfully applying an update on some platforms.
    if (e.status !== 1) {
        console.warn('⚠️ [yt-dlp] update skipped (network issue or already up to date).');
    }
}
