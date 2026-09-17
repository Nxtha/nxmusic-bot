const {
    SlashCommandBuilder
} = require('discord.js');
const {
    player,
    same,
    temp
} = require('./_helpers');
const {
    actionCard
} = require('../ui/embeds');
module.exports = {
    data: new SlashCommandBuilder().setName('previous').setDescription('Play the previous track'),
    async execute(i) {
        const p = player(i);
        same(i, p);
        if (!await p.previous()) throw new Error('NO_CURRENT');
        await temp(i, actionCard('⏮️', 'Previous Track', `Previous track selected by <@${i.user.id}>.`));
    }
};
