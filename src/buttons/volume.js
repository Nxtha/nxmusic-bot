const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');
module.exports = async i => {
    const modal = new ModalBuilder().setCustomId('nx:volume-modal').setTitle('Set Volume');
    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('value').setLabel('Volume 0-100').setStyle(TextInputStyle.Short).setRequired(true)));
    await i.showModal(modal)
};
