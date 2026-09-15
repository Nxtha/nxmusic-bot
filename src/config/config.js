const path=require('path');require('dotenv').config();
const bool=v=>String(v??'').toLowerCase()==='true';
const num=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
module.exports={
 token:process.env.DISCORD_TOKEN||'',clientId:process.env.CLIENT_ID||'',guildId:process.env.GUILD_ID||null,ownerId:process.env.OWNER_ID||'',
 cookiesPath:path.resolve(process.env.COOKIES_FILE||'./cookies.txt'),ytdlpPath:process.env.YTDLP_PATH||'',ffmpegPath:process.env.FFMPEG_PATH||'',
 embedColor:process.env.EMBED_COLOR||'#5865F2',status:process.env.STATUS||'🎵 NX Music | /play',queueLimit:Math.max(1,num(process.env.QUEUE_LIMIT,100)),
 defaultVolume:Math.max(0,Math.min(100,num(process.env.DEFAULT_VOLUME,70))),defaultAutoplay:bool(process.env.DEFAULT_AUTOPLAY),default247:bool(process.env.DEFAULT_247),
 totalShards:process.env.TOTAL_SHARDS||'auto',shardList:process.env.SHARD_LIST||''
};
