const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('247')
        .setDescription('Toggle 24/7 mode'),

    async execute(interaction, client) {
        const member = interaction.member;
        const guild = interaction.guild;

        // User harus berada di voice channel
        if (!member.voice.channel) {
            return interaction.reply({
                content: '❌ You must be in a voice channel.',
                flags: [1 << 6]
            });
        }

        const player = client.players.get(guild.id);

        if (!player) {
            return interaction.reply({
                content: '❌ There is no active music player.',
                flags: [1 << 6]
            });
        }

        // User harus berada di VC yang sama dengan bot
        if (
            !player.voiceChannel ||
            player.voiceChannel.id !== member.voice.channel.id
        ) {
            return interaction.reply({
                content: '❌ You must be in the same voice channel as the bot.',
                flags: [1 << 6]
            });
        }

        // Toggle 24/7
        player.twentyFourSeven = !player.twentyFourSeven;

        if (player.twentyFourSeven) {
            // =========================
            // 24/7 ON
            // =========================

            player.clearInactivityTimer(false);

            // Jangan pause karena VC kosong
            player.pauseReasons.delete('alone');

            await player.persistState('247-enabled', true);

            const embed = new EmbedBuilder()
                .setTitle('♾️ 24/7 Mode Enabled')
                .setDescription(
                    'Bot will stay in the voice channel even when everyone leaves.'
                )
                .setColor('#00FF00')
                .setTimestamp()
                .addFields({
                    name: 'Changed by',
                    value: `${interaction.member}`,
                    inline: true
                });

            await interaction.reply({
                embeds: [embed]
            });

        } else {
            // =========================
            // 24/7 OFF
            // =========================

            await player.persistState('247-disabled', true);

            const embed = new EmbedBuilder()
                .setTitle('♾️ 24/7 Mode Disabled')
                .setDescription(
                    'Bot will leave the voice channel after 5 minutes of inactivity.'
                )
                .setColor(config.bot.embedColor)
                .setTimestamp()
                .addFields({
                    name: 'Changed by',
                    value: `${interaction.member}`,
                    inline: true
                });

            await interaction.reply({
                embeds: [embed]
            });

            // Kalau VC sedang kosong, mulai inactivity timer
            const channel = player.voiceChannel;

            const listeners = channel
                ? channel.members.filter(member => !member.user.bot).size
                : 0;

            if (listeners === 0) {
                player.startInactivityTimer();
            }
        }
    }
};