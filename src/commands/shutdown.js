const {
    SlashCommandBuilder
} = require('discord.js');
const config = require('../config/config');
module.exports = {
    data: new SlashCommandBuilder().setName('shutdown').setDescription('Shutdown NX Music'),
    async execute(i) {
        if (i.user.id !== config.ownerId) throw new Error('NOT_OWNER');
        await i.reply('🛑 Shutting down all shards...');
        if (i.client.shard) await i.client.shard.broadcastEval(() => process.exit(0));
        else process.exit(0)
    }
};
