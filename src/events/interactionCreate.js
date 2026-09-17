const {
    actionCard
} = require('../ui/embeds');
const commands = require('../commands').byName;
const buttons = require('../buttons');
const Search = require('../commands/search');
const {
    get
} = require('../services/PlayerManager');
const Activity = require('../services/ActivityManager');
const {
    messageFor
} = require('../utils/errors');
function enforceSessionChannel(p, interaction) {
    if (p.sessionChannelId && interaction.channelId !== p.sessionChannelId) throw new Error('CHANNEL_LOCK');
}
module.exports = async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const c = commands.get(interaction.commandName);
            if (c) {
                const p = get(interaction.guildId);
                enforceSessionChannel(p, interaction);
                await c.execute(interaction);
            }
            return;
        }
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('nx:autoplay-genre:')) {
            const owner = interaction.customId.slice('nx:autoplay-genre:'.length);
            if (owner !== interaction.user.id) throw new Error('This menu belongs to another user.');
            const p = get(interaction.guildId);
            enforceSessionChannel(p, interaction);
            const genre = interaction.values[0];
            const ch = interaction.member?.voice?.channel;
            if (!ch) throw new Error('NOT_IN_VC');
            if (p.voiceChannelId && p.voiceChannelId !== ch.id) throw new Error('DIFFERENT_VC');
            p.setAutoplay('genre', genre);
            await interaction.update({
                content: '', ...actionCard('🤖', 'Autoplay Updated', `Mode: **Fixed Genre • ${genre}** by <@${interaction.user.id}>.`)
            });
            setTimeout(() => interaction.message.delete().catch(() => {
            }), 10000);
            return;
        }
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('nx:search:')) {
            const key = interaction.customId.slice(10),
            xs = Search.cache.get(key);
            if (!xs) throw new Error('Search expired.');
            const idx = Number(interaction.values[0]),
            t = xs[idx];
            if (!t) throw new Error('NO_RESULTS');
            const p = get(interaction.guildId);
            enforceSessionChannel(p, interaction);
            const ch = interaction.member?.voice?.channel;
            if (!ch) throw new Error('NOT_IN_VC');
            if (p.voiceChannelId && p.voiceChannelId !== ch.id) throw new Error('DIFFERENT_VC');
            await p.connect(ch);
            if (!p.sessionChannelId) {
                p.sessionChannelId = interaction.channelId;
                Activity.setChannel(p, interaction.channel);
            }
            t.requester = interaction.user.id;
            await interaction.update({
                content: '', components: [], embeds: []
            });
            const msg = await interaction.fetchReply();
            Activity.setMessage(p, msg);
            Search.cache.delete(key);
            await p.enqueue([t]);
            await Activity.refresh(p);
            return;
        }
        if (interaction.isButton() && interaction.customId.startsWith('nx:')) {
            const p = get(interaction.guildId);
            enforceSessionChannel(p, interaction);
            if (!Activity.isActiveMessage(p, interaction.message)) {
                await interaction.reply({
                    content: '⚠️ This Music Activity is no longer active.', ephemeral: true
                });
                return;
            }
            const key = interaction.customId.slice(3);
            const fn = buttons[key];
            if (fn) await fn(interaction);
            return;
        }
        if (interaction.isModalSubmit() && interaction.customId === 'nx:volume-modal') {
            const p = get(interaction.guildId);
            enforceSessionChannel(p, interaction);
            const ch = interaction.member?.voice?.channel;
            if (!ch) throw new Error('NOT_IN_VC');
            if (p.voiceChannelId && p.voiceChannelId !== ch.id) throw new Error('DIFFERENT_VC');
            const v = Number(interaction.fields.getTextInputValue('value'));
            if (!Number.isInteger(v) || v < 0 || v > 100) throw new Error('Invalid volume.');
            p.setVolume(v);
            await interaction.reply({
                ...actionCard('🔊', 'Volume Changed', `Volume set to **${v}%** by <@${interaction.user.id}>.`), ephemeral: true
            });
            setTimeout(() => interaction.deleteReply().catch(() => {
            }), 10000);
        }
    } catch(e) {
        const msg = messageFor(e);
        if (interaction.deferred) await interaction.editReply({
            content: msg, components: []
        }).catch(() => {
        });
        else if (interaction.replied) await interaction.followUp({
            content: msg, ephemeral: true
        }).catch(() => {
        });
        else await interaction.reply({
            content: msg, ephemeral: true
        }).catch(() => {
        });
    }
};
