const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');
const {
    get
} = require('../services/PlayerManager');
const {
    temp
} = require('./_helpers');
module.exports = {
    data: new SlashCommandBuilder().setName('status').setDescription('Show NX Music status').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(i) {
        const p = get(i.guildId);
        await temp(i, `🎵 Player: **${p.current?'playing':'idle'}** • Queue: **${p.queue.items.length}** • 24/7: **${p.always247?'ON':'OFF'}** • Autoplay: **${p.autoplay?'ON':'OFF'}**`, 10000)
    }
};
