const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { player, same, temp } = require('./_helpers');
const { actionCard } = require('../ui/embeds');
const { GENRES } = require('../music/Autoplay');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Configure autoplay')
    .addStringOption(o => o
      .setName('mode')
      .setDescription('Autoplay mode')
      .setRequired(true)
      .addChoices(
        { name: 'Off', value: 'off' },
        { name: 'Similar', value: 'similar' },
        { name: 'Fixed Genre', value: 'genre' },
        { name: 'Random', value: 'random' }
      )),

  async execute(i) {
    const p = player(i);
    same(i, p);
    const mode = i.options.getString('mode', true);

    if (mode === 'genre') {
      const menu = new StringSelectMenuBuilder()
        .setCustomId(`nx:autoplay-genre:${i.user.id}`)
        .setPlaceholder('Choose a genre...')
        .addOptions(GENRES.map(g => ({ label: g, value: g })));
      await i.reply({
        content: '🎵 Choose a genre for **Fixed Genre** autoplay:',
        components: [new ActionRowBuilder().addComponents(menu)],
        ephemeral: true
      });
      return;
    }

    p.setAutoplay(mode);
    await temp(i, actionCard('🤖', 'Autoplay Updated', `Mode: **${mode === 'random' ? 'Random' : mode === 'similar' ? 'Similar' : 'Off'}** by <@${i.user.id}>.`));
  }
};
