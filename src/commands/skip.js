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
    data: new SlashCommandBuilder().setName('skip').setDescription('Skip current track'),
    async execute(i) {
        const p = player(i);
        same(i, p);
        p.skip();
        await temp(i, actionCard('⏭️', 'Skipped', `Skipped by <@${i.user.id}>.`));
    }
};
