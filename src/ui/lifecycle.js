function send(interaction, payload) {
    return interaction.replied || interaction.deferred ? interaction.followUp(typeof payload === 'string' ? {
        content: payload
    }
    : payload): interaction.reply(typeof payload === 'string' ? {
        content: payload
    }
    : payload);
}
function temp(interaction, payload, ms = 10000) {
    return send(interaction, payload).then(m => {
        setTimeout(() => m.delete().catch(() => {
        }), ms);
        return m;
    });
}
function persistent(interaction, payload) {
    return send(interaction, payload);
}
module.exports = {
    temp,
    persistent
};
