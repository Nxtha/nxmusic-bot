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
function parse(v) {
    const s = String(v).trim();
    if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
    const a = s.split(':').map(Number);
    if (a.some(Number.isNaN) || a.length > 3) return NaN;
    return a.reduce((n, x) => n * 60 + x, 0)
}
module.exports = {
    data: new SlashCommandBuilder().setName('seek').setDescription('Seek within the current track').addStringOption(o => o.setName('time').setDescription('Seconds or mm:ss / hh:mm:ss').setRequired(true)),
    async execute(i) {
        const p = player(i);
        same(i, p);
        const s = parse(i.options.getString('time', true));
        if (!Number.isFinite(s) || s < 0) throw new Error('INVALID_TIME');
        await p.seek(s);
        await temp(i, actionCard('⏩', 'Seeked', `Playback moved to **${s}s** by <@${i.user.id}>.`));
    }
};
