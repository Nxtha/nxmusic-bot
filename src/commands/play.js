const {
    SlashCommandBuilder
} = require('discord.js');
const {
    player,
    voice,
    temp
} = require('./_helpers');
const yt = require('../services/YouTube');
const Activity = require('../services/ActivityManager');
const {
    actionCard
} = require('../ui/embeds');
module.exports = {
    data: new SlashCommandBuilder().setName('play').setDescription('Play YouTube music or a playlist').addStringOption(o => o.setName('query').setDescription('YouTube URL or search query').setRequired(true)),
    async execute(i) {
        const p = player(i);
        const ch = voice(i, p);
        const hadCurrent = Boolean(p.current);
        await i.deferReply();
        const msg = await i.editReply('🔎 Searching Song...');
        const q = i.options.getString('query', true);
        const tracks = await yt.getTracks(q, p.queue.limit);
        if (!tracks.length) throw new Error('NO_RESULTS');
        tracks.forEach(t => t.requester = i.user.id);
        if (!p.sessionChannelId) {
            p.sessionChannelId = i.channelId;
            Activity.setChannel(p, i.channel);
        }
        if (hadCurrent) {
            await p.enqueue(tracks);
            await i.deleteReply().catch(() => {
            });
            const label = tracks.length === 1 ? `**${tracks[0].title}**\n👤 Added by <@${i.user.id}>\n📋 Position: **#${p.queue.items.length}**`: `**${tracks.length} songs** added to the queue.\n👤 Added by <@${i.user.id}>\n📋 Starting position: **#${Math.max(1,p.queue.items.length-tracks.length+1)}**`;
            await temp(i, actionCard('📋', 'Added to Queue', label), 10000);
            return;
        }
        Activity.setChannel(p, i.channel);
        Activity.setMessage(p, msg);
        await p.connect(ch);
        await p.enqueue(tracks);
    }
};
