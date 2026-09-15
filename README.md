# NX Music V1

Discord music bot built around the NX Music feature set. The referenced MusicBot repository is used only as an implementation/architecture reference; it does not define NX Music's feature scope.

## Requirements
- Node.js 24.11.1+
- Discord bot with Guilds + Guild Voice States intents
- Bot permissions: Connect, Speak, Send Messages, Embed Links, Use Application Commands

## Setup
1. Copy `.env.example` to `.env` and fill `DISCORD_TOKEN`, `CLIENT_ID`, `OWNER_ID` and optionally `GUILD_ID`.
2. Leave `YTDLP_PATH=` and `FFMPEG_PATH=` blank for the managed yt-dlp + bundled FFmpeg setup.
3. Optional: put your own Netscape `cookies.txt` at the project root.
4. Run `npm install`. The `postinstall` script downloads/verifies the managed yt-dlp binary into `bin/`.
5. Run `npm start`.

You can manually refresh the managed yt-dlp binary later with `npm run update-ytdlp`.

If `YTDLP_PATH` is set, NX Music uses that executable instead of the managed binary. If it is blank, NX Music checks the system PATH first and then `bin/yt-dlp`.

## Commands
/play /search /pause /resume /skip /stop /previous /queue /nowplaying /shuffle /clear /remove /volume /seek /loop /autoplay /247 /status /shutdown

## Music Activity
The Music Activity UI is created automatically in the channel where `/play` is used. No setup command is required. The same message is edited as playback changes.

## Autoplay
- `similar`: follows the current track.
- `genre`: keeps one selected genre until changed.
- `random`: picks random music without requiring a genre.

## 24/7
When enabled, the bot stays in its voice channel after users leave, reconnects after transient voice disconnects, and can continue autoplay when the queue is empty.

## yt-dlp
yt-dlp maintenance is intentionally kept outside the bot runtime. `scripts/update-ytdlp.js` downloads the latest official release asset during `npm install` (`postinstall`) and can also be run manually with `npm run update-ytdlp`. The bot does not query the GitHub API on every startup.
