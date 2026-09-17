const {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    NoSubscriberBehavior,
    StreamType
} = require('@discordjs/voice');
const Queue = require('./Queue');
const YouTube = require('../services/YouTube');
const {
    randomMusicQuery,
    queryForGenre,
    cleanCandidates
} = require('./Autoplay');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cacheId = () => Math.floor(10000 + Math.random() * 90000);
class Player {
    constructor(guildId, limit, defaults) {
        this.guildId = guildId;
        this.queue = new Queue(limit);
        this.current = null;
        this.voiceChannelId = null;
        this.connection = null;
        this.channel = null;
        this.volume = defaults.volume;
        this.autoplay = defaults.autoplay;
        this.autoplayMode = 'similar';
        this.autoplayGenre = null;
        this.loop = 'off';
        this.always247 = defaults.always247;
        this.startedAt = 0;
        this.pausedAt = 0;
        this.endedAt = 0;
        this.idleTimer = null;
        this.sessionChannelId = null;
        this.positionOffset = 0;
        this.onEvent = () => {
        };
        this.busy = false;
        this.skipRequested = false;
        this.recovering = false;
        this.recoveryAttempts = 0;
        this.cachedPlaybackId = null;
        this.cachedPlaybackUntil = 0;
        this.activeStream = null;
        this.activeResource = null;
        this.stopping = false;
        this.failedTrackHandling = false;
        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause
            }
        });
        this.player.on(AudioPlayerStatus.Idle, () => {
            if (!this.recovering && !this.stopping) this._advance()
        });
        this.player.on('error', e => {
            if (this.recovering) return;
            if (this.current && this._isNonRecoverablePlaybackError(e)) this._failCurrentTrack(e).catch(() => {
            });
            else {
                this.onEvent('error', e);
                if (this.current) this._recoverPlayback(e);
                else this._advance()
            }
        });
    }
    async connect(channel) {
        if (this.voiceChannelId && this.voiceChannelId !== channel.id) throw new Error('DIFFERENT_VC');
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
        this.endedAt = 0;
        this.channel = channel;
        if (!this.connection || this.connection.state.status === VoiceConnectionStatus.Destroyed) {
            this.connection = joinVoiceChannel({
                channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true
            });
            this.voiceChannelId = channel.id;
            this.connection.subscribe(this.player);
            this.connection.on(VoiceConnectionStatus.Disconnected, () => this._reconnect());
        }
        return this.connection;
    }
    async _reconnect() {
        if (!this.always247 || !this.channel) return;
        try {
            await Promise.race([entersState(this.connection, VoiceConnectionStatus.Signalling, 5000), entersState(this.connection, VoiceConnectionStatus.Connecting, 5000)]);
            return
        } catch {
        }
        try {
            this.connection.destroy()
        } catch {
        }
        try {
            this.connection = joinVoiceChannel({
                channelId: this.channel.id, guildId: this.guildId, adapterCreator: this.channel.guild.voiceAdapterCreator, selfDeaf: true
            });
            this.connection.subscribe(this.player);
            this.onEvent('reconnect')
        } catch(e) {
            this.onEvent('error', e)
        }
    }
    async enqueue(tracks) {
        this.endedAt = 0;
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
        this.queue.addMany(tracks);
        this.onEvent('queue-add', tracks.length);
        if (!this.current) await this._advance();
    }
    async _start(track, offset = 0) {
        const requester = track.requester || null;
        this.current = {
            ...track,
            requester
        };
        const startedTrackId = this.current.id;
        if (this.activeStream?.destroy) this.activeStream.destroy();
        const result = await YouTube.stream(this.current, offset);
        this.activeStream = result;
        result.done.finally(() => {
            if (this.activeStream === result) this.activeStream = null;
        }).catch(() => {
        });
        result.done.catch(err => {
            if (this.current?.id !== startedTrackId || this.skipRequested || this.recovering) return;
            if (this._isNonRecoverablePlaybackError(err)) {
                this._failCurrentTrack(err).catch(() => {
                });
                return;
            }
            this._recoverPlayback(err).catch(() => {
            });
        });
        const resource = createAudioResource(result.stream, {
            inputType: StreamType.Raw, inlineVolume: true
        });
        resource.volume?.setVolume(this.volume / 100);
        this.activeResource = resource;
        this.player.play(resource);
        this.positionOffset = offset;
        this.startedAt = Date.now() - offset * 1000;
        this.pausedAt = 0;
        this.onEvent('play', this.current);
    }
    _isNonRecoverablePlaybackError(error) {
        const text = String(error?.message || error || '');
        return /please sign in|sign in to confirm|cookies-from-browser|use --cookies|authentication|no-call-home|deprecated feature/i.test(text);
    }
    async _failCurrentTrack(error) {
        if (this.failedTrackHandling || !this.current) return;
        this.failedTrackHandling = true;
        this.onEvent('error', error);
        const failedId = this.current.id;
        try {
            if (this.activeStream?.destroy) this.activeStream.destroy();
            this.activeStream = null;
            this.activeResource = null;
            this.recovering = false;
            this.recoveryAttempts = 0;
            this.skipRequested = true;
            try {
                this.player.stop(true)
            } catch {
            }
            await sleep(100);
            if (this.current?.id === failedId) this.current = null;
            this.skipRequested = false;
            setImmediate(() => this._advance().catch(e => this.onEvent('error', e)));
        } finally {
            this.failedTrackHandling = false;
        }
    }
    async _recoverPlayback(error) {
        if (this.recovering || !this.current || this.skipRequested) return;
        if (this._isNonRecoverablePlaybackError(error)) {
            await this._failCurrentTrack(error);
            return;
        }
        this.recovering = true;
        this.recoveryAttempts++;
        const id = cacheId();
        this.cachedPlaybackId = id;
        this.cachedPlaybackUntil = Date.now() + 10000;
        this.onEvent('cached', id, error);
        try {
            await sleep(Math.min(3000, 700 * this.recoveryAttempts));
            if (!this.current || this.skipRequested) return;
            const track = {
                ...this.current
            };
            const offset = Math.max(0, this.elapsed() - 1.5);
            this.player.stop(true);
            await sleep(150);
            await this._start(track, offset);
            this.recoveryAttempts = 0;
        } catch(e) {
            this.onEvent('error', e);
            if (this.recoveryAttempts < 3) {
                this.recovering = false;
                return this._recoverPlayback(e)
            }
            this.recoveryAttempts = 0;
            this.recovering = false;
            this.skipRequested = true;
            this.player.stop(true);
            return;
        } finally {
            if (this.recovering && this.current) this.recovering = false;
        }
    }
    _scheduleIdleDisconnect() {
        if (this.always247) return;
        if (this.idleTimer) clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
            if (this.always247 || this.current) return;
            if (this.activeStream?.destroy) this.activeStream.destroy();
            this.activeStream = null;
            try {
                this.player.stop(true)
            } catch {
            }
            try {
                this.connection?.destroy()
            } catch {
            }
            this.connection = null;
            this.voiceChannelId = null;
            this.channel = null;
            this.onEvent('disconnect');
        }, 180000);
        this.idleTimer.unref?.();
    }
    async _advance() {
        if (this.busy || this.recovering) return;
        this.busy = true;
        try {
            for (let attempt = 0;
            attempt < 6;
            attempt++) {
                if (this.loop === 'song' && this.current && !this.skipRequested) {
                    try {
                        await this._start(this.current);
                        return
                    } catch(e) {
                        this.onEvent('error', e);
                        continue
                    }
                }
                this.skipRequested = false;
                let next = this.queue.next();
                if (!next && this.loop === 'queue' && this.queue.history.length) {
                    this.queue.items = this.queue.history.map(x => ({
                        ...x
                    }));
                    this.queue.history = [];
                    next = this.queue.next()
                }
                if (!next && this.autoplay) {
                    let candidates = [];
                    let genre = this.autoplayGenre;
                    const ids = this.queue.history.slice( - 20).map(x => x.id);
                    if (this.autoplayMode === 'similar') {
                        const title = this.current?.title || 'popular music';
                        const queries = [`${title} similar music`, `songs similar to ${title}`, `${title} similar artists`];
                        for (const query of queries) {
                            candidates = await YouTube.search(query, 10);
                            const filtered = cleanCandidates(candidates, this.current?.id, ids);
                            if (filtered.length) {
                                next = filtered[0];
                                break;
                            }
                        }
                    } else if (this.autoplayMode === 'random') {
                        candidates = await YouTube.search(randomMusicQuery(), 10);
                        next = cleanCandidates(candidates, this.current?.id, ids)[0] || null;
                    } else if (this.autoplayMode === 'genre' && genre) {
                        candidates = await YouTube.search(queryForGenre(genre), 10);
                        next = cleanCandidates(candidates, this.current?.id, ids)[0] || null;
                    }
                    if (next) next.autoplay = true;
                }
                if (!next) {
                    this.current = null;
                    this.endedAt = Date.now();
                    this.sessionChannelId = null;
                    this.onEvent('idle');
                    this._scheduleIdleDisconnect();
                    return
                }
                const previous = this.current;
                if (previous) this.queue.history.push(previous);
                try {
                    await this._start(next);
                    return
                } catch(e) {
                    this.onEvent('error', e);
                    this.current = previous
                }
            }
            this.current = null;
            this.endedAt = Date.now();
            this.sessionChannelId = null;
            this.onEvent('idle');
            this._scheduleIdleDisconnect()
        } catch(e) {
            this.onEvent('error', e)
        } finally {
            this.busy = false
        }
    }
    pause() {
        this.player.pause();
        this.pausedAt = this.elapsed();
        this.onEvent('pause')
    }
    resume() {
        this.player.unpause();
        this.startedAt = Date.now() - this.pausedAt * 1000;
        this.onEvent('resume')
    }
    skip() {
        this.skipRequested = true;
        this.recovering = false;
        if (this.activeStream?.destroy) this.activeStream.destroy();
        this.activeStream = null;
        try {
            this.player.stop(true)
        } catch {
        }
        this.onEvent('skip')
    }
    async previous() {
        const prev = this.queue.history.pop();
        if (!prev) return false;
        if (this.current) this.queue.items.unshift(this.current);
        await this._start(prev);
        this.onEvent('previous');
        return true
    }
    stop() {
        this.stopping = true;
        if (this.activeStream?.destroy) this.activeStream.destroy();
        this.activeStream = null;
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
        this.endedAt = Date.now();
        this.sessionChannelId = null;
        this.queue.clear();
        this.queue.history = [];
        this.current = null;
        this.skipRequested = false;
        this.recovering = false;
        this.recoveryAttempts = 0;
        this.cachedPlaybackId = null;
        this.cachedPlaybackUntil = 0;
        this.activeStream = null;
        this.activeResource = null;
        this.player.stop(true);
        this.onEvent('stop');
        if (!this.always247) {
            try {
                this.connection?.destroy()
            } catch {
            }
            this.connection = null;
            this.voiceChannelId = null;
            this.channel = null
        }
        this.stopping = false
    }
    shuffle() {
        this.queue.shuffle();
        this.onEvent('shuffle')
    }
    remove(n) {
        const x = this.queue.remove(n);
        if (x) this.onEvent('remove', x);
        return x
    }
    clear() {
        this.queue.clear();
        this.onEvent('clear')
    }
    setVolume(v) {
        this.volume = Math.max(0, Math.min(100, Number(v) || 0));
        this.activeResource?.volume?.setVolume(this.volume / 100);
        this.onEvent('volume', this.volume)
    }
    setLoop(mode) {
        if (!['off', 'song', 'queue'].includes(mode)) throw new Error('INVALID_MODE');
        this.loop = mode;
        this.onEvent('loop', mode)
    }
    setAutoplay(mode, genre) {
        if (!['off', 'similar', 'genre', 'random'].includes(mode)) throw new Error('INVALID_MODE');
        if (mode === 'genre' && !genre) throw new Error('INVALID_MODE');
        this.autoplay = mode !== 'off';
        this.autoplayMode = mode;
        this.autoplayGenre = mode === 'genre' ? genre: null;
        this.onEvent('autoplay', mode, genre)
    }
    async seek(sec) {
        if (!this.current) throw new Error('NO_CURRENT');
        const s = Math.max(0, Math.min(Number(sec) || 0, this.current.duration || Number(sec) || 0));
        const t = {
            ...this.current
        };
        this.recovering = true;
        if (this.activeStream?.destroy) this.activeStream.destroy();
        this.activeStream = null;
        this.player.stop(true);
        await new Promise(r => setTimeout(r, 100));
        try {
            await this._start(t, s)
        } finally {
            this.recovering = false
        }
        this.onEvent('seek', s)
    }
    elapsed() {
        if (!this.current) return 0;
        return this.paused ? this.pausedAt: Math.max(0, (Date.now() - this.startedAt) / 1000)
    }
    get paused() {
        return this.player.state.status === AudioPlayerStatus.Paused
    }
}
module.exports = Player;
