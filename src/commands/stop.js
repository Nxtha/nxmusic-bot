const {
    SlashCommandBuilder
} = require('discord.js');
const {
    player,
    same,
    persistent
} = require('./_helpers');
const {
    actionCard
} = require('../ui/embeds');
module.exports = {
    data: new SlashCommandBuilder().setName('stop').setDescription('Stop playback and clear queue'),
    async execute(i) {
        const p = player(i);
        same(i, p);
        p.stop();
        await persistent(i, actionCard('⏹️', 'Stopped', `Playback stopped and queue cleared by <@${i.user.id}>.`));
    }
};
