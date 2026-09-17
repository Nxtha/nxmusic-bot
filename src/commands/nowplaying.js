const {
    SlashCommandBuilder
} = require('discord.js');
const {
    player,
    same,
    temp
} = require('./_helpers');
const {
    nowPlaying
} = require('../ui/embeds');
module.exports = {
    data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show the current player'),
    async execute(i) {
        const p = player(i);
        same(i, p);
        await temp(i, nowPlaying(p), 10000)
    }
};
