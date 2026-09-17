const {
    ShardingManager
} = require('discord.js');
const config = require('./config/config');
if (!config.token) throw new Error('Missing DISCORD_TOKEN in .env');
(async() => {
    try {
        const opts = {
            token: config.token, respawn: false
        };
        if (String(config.totalShards).toLowerCase() === 'auto') opts.totalShards = 'auto';
        else if (Number.isInteger(Number(config.totalShards)) && Number(config.totalShards) > 0) opts.totalShards = Number(config.totalShards);
        if (config.shardList.trim()) {
            const list = config.shardList.split(',').map(x => Number(x.trim())).filter(Number.isInteger);
            if (list.length) opts.shardList = list
        }
        const manager = new ShardingManager(require.resolve('./bot'), opts);
        manager.on('shardCreate', s => console.log(`Shard ${s.id} launched`));
        manager.on('shardError', (err, shard) => console.error(`Shard ${shard.id} error:`, err));
        await manager.spawn()
    } catch(e) {
        console.error(`[startup] ${e.message}`);
        process.exit(1)
    }
})();
