const fs = require('fs');
const path = require('path');
const {
    spawn
} = require('child_process');
const {
    PassThrough
} = require('stream');
const config = require('../config/config');
const Runtime = require('./Runtime');
let runtime = null;
let binaryPath = null;
async function rt() {
    if (!runtime) runtime = Runtime.ensure();
    if (!binaryPath) binaryPath = runtime.ytdlp;
    return runtime;
}
function cookieObject() {
    return fs.existsSync(config.cookiesPath) ? {
        cookies: config.cookiesPath
    }
    : {
    };
}
function mapTrack(x) {
    if (!x || typeof x !== 'object') return null;
    const id = x.id || x.display_id || null;
    const webpageUrl = x.webpage_url || (id ? `https://www.youtube.com/watch?v=${id}`: null);
    if (!id || !webpageUrl) return null;
    return {
        id,
        url: webpageUrl,
        title: x.title || 'Unknown',
        duration: Number(x.duration) || 0,
        thumbnail: x.thumbnail || null,
        uploader: x.uploader || x.channel || x.channel_title || 'Unknown',
        webpage_url: webpageUrl
    };
}
function addCommon(flags = {
}) {
    return {
        ...cookieObject(),
        noWarnings: true,
        ...flags
    };
}
function flagName(key) {
    return key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}
function buildArgs(flags = {
}) {
    const args = [];
    for (const[key, value] of Object.entries(flags)) {
        if (value === undefined || value === null || value === false) continue;
        const name = `--${flagName(key)}`;
        if (value === true) {
            args.push(name);
            continue;
        }
        if (Array.isArray(value)) {
            for (const item of value) args.push(name, String(item));
            continue;
        }
        args.push(name, String(value));
    }
    return args;
}
function sanitizeYtdlpError(text) {
    const raw = String(text || '').trim();
    if (/PYI-\d+|Failed to extract .*cryptography|Failed to extract .*Cryptodome|decompression resulted in return code/i.test(raw)) {
        return 'yt-dlp playback extraction failed';
    }
    return raw || 'yt-dlp request failed';
}
function spawnYtdlp(url, flags = {
}, options = {
}) {
    if (!binaryPath) throw new Error('yt-dlp binary is not initialized');
    const args = [...buildArgs(flags), '--', String(url)];
    const child = spawn(binaryPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32', windowsHide: true, ...options
    });
    child.on('error', () => {
    });
    return child;
}
function killProcess(child) {
    if (!child) return;
    try {
        if (process.platform !== 'win32' && child.pid && !child.killed) process.kill( - child.pid, 'SIGKILL');
    } catch {
    }
    try {
        if (!child.killed) child.kill('SIGKILL');
    } catch {
    }
}
async function execText(url, flags = {
}) {
    await rt();
    const child = spawnYtdlp(url, flags);
    let stdout = '';
    let stderr = '';
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', chunk => {
        stdout += chunk;
    });
    child.stderr?.on('data', chunk => {
        stderr += chunk;
    });
    return new Promise((resolve, reject) => {
        let settled = false;
        const fail = err => {
            if (settled) return;
            settled = true;
            const detail = sanitizeYtdlpError(stderr || err?.message || err || 'yt-dlp request failed');
            reject(new Error(detail));
        };
        child.on('error', fail);
        child.on('close', code => {
            if (settled) return;
            if (code === 0) {
                settled = true;
                resolve(stdout);
            } else {
                fail(new Error(stderr || `yt-dlp exited with code ${code}`));
            }
        });
    });
}
function parseJsonLines(text) {
    return String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
        try {
            return JSON.parse(line);
        } catch {
            return null;
        }
    }).filter(Boolean);
}
async function execJsonLines(url, flags = {
}) {
    const stdout = await execText(url, flags);
    return parseJsonLines(stdout);
}
async function info(url) {
    await rt();
    const out = await execText(url, addCommon({
        dumpSingleJson: true, skipDownload: true, noPlaylist: true
    }));
    try {
        return JSON.parse(out);
    } catch {
        throw new Error('yt-dlp returned invalid metadata');
    }
}
async function search(query, limit = 5) {
    await rt();
    const count = Math.max(1, Math.min(10, Number(limit) || 5));
    const raw = await execJsonLines(`ytsearch${count}:${query}`, addCommon({
        dumpJson: true, flatPlaylist: true, ignoreErrors: true, playlistEnd: count
    }));
    return raw.map(mapTrack).filter(Boolean).slice(0, count);
}
async function resolve(url) {
    await rt();
    const out = await execText(url, addCommon({
        dumpSingleJson: true, noPlaylist: true, skipDownload: true
    }));
    let parsed;
    try {
        parsed = JSON.parse(out);
    } catch {
        throw new Error('NO_RESULTS');
    }
    const track = mapTrack(parsed);
    if (!track) throw new Error('NO_RESULTS');
    return track;
}
async function playlist(url, limit = 100) {
    await rt();
    const count = Math.max(1, Math.min(100, Number(limit) || 100));
    const raw = await execJsonLines(url, addCommon({
        dumpJson: true, flatPlaylist: true, ignoreErrors: true, playlistEnd: count
    }));
    return raw.map(mapTrack).filter(Boolean).slice(0, count);
}
async function getTracks(query, limit = 100) {
    const input = String(query || '').trim();
    if (!input) return[];
    if (/^https?:\/\//i.test(input)) {
        try {
            const list = await playlist(input, limit);
            if (list.length) return list;
        } catch {
        }
        try {
            return[await resolve(input)];
        } catch {
            return[];
        }
    }
    return search(input, 1);
}
async function stream(track, offset = 0) {
    await rt();
    const ffmpeg = runtime.ffmpeg;
    const y = spawnYtdlp(track.url, addCommon({
        format: 'bestaudio/best', output: '-', noPlaylist: true, noPart: true, quiet: true, noProgress: true
    }));
    let yerr = '';
    y.stderr?.setEncoding('utf8');
    y.stderr?.on('data', d => {
        yerr += d;
    });
    y.stdout?.on('error', () => {
    });
    const ffArgs = ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0'];
    if (offset > 0) ffArgs.push('-ss', String(Math.max(0, Number(offset) || 0)));
    ffArgs.push('-f', 's16le', '-ar', '48000', '-ac', '2', 'pipe:1');
    const ff = spawn(ffmpeg, ffArgs, {
        stdio: ['pipe', 'pipe', 'pipe'], detached: process.platform !== 'win32', windowsHide: true
    });
    let fferr = '';
    ff.stderr.setEncoding('utf8');
    ff.stderr.on('data', d => {
        fferr += d;
    });
    ff.on('error', () => {
    });
    ff.stdin.on('error', err => {
        if (err?.code !== 'EPIPE') fferr += ` ${err.message || err}`;
    });
    ff.stdout.on('error', () => {
    });
    y.stdout.pipe(ff.stdin);
    const output = new PassThrough();
    ff.stdout.pipe(output);
    let settled = false;
    let destroyed = false;
    let cleanupDone = false;
    const cleanup = () => {
        if (cleanupDone) return;
        cleanupDone = true;
        try {
            y.stdout?.unpipe(ff.stdin);
        } catch {
        }
        try {
            ff.stdin?.destroy();
        } catch {
        }
        killProcess(y);
        killProcess(ff);
        try {
            output.destroy();
        } catch {
        }
    };
    const destroy = () => {
        if (destroyed) return;
        destroyed = true;
        cleanup();
    };
    const done = new Promise((resolve, reject) => {
        const fail = err => {
            if (settled) return;
            settled = true;
            reject(err instanceof Error ? err: new Error(String(err || 'stream failed')));
        };
        const ok = () => {
            if (settled) return;
            settled = true;
            resolve();
        };
        y.on('close', code => {
            if (destroyed) return;
            if (code && code !== 0) {
                const err = new Error(sanitizeYtdlpError(yerr || `yt-dlp exited ${code}`));
                output.destroy(err);
                fail(err);
                killProcess(ff);
            }
        });
        ff.on('close', code => {
            if (destroyed) return;
            if (code && code !== 0) {
                const err = new Error(fferr.trim() || `FFmpeg exited ${code}`);
                output.destroy(err);
                fail(err);
            } else if (code === 0) {
                ok();
            }
        });
        y.on('error', fail);
        ff.on('error', fail);
        output.on('error', fail);
    });
    done.catch(() => {
        if (!destroyed) cleanup();
    });
    return {
        stream: output,
        done,
        destroy
    };
}
module.exports = {
    init: rt,
    info,
    search,
    resolve,
    playlist,
    getTracks,
    stream
};
