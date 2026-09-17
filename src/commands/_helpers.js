const {
    get
} = require('../services/PlayerManager');
const {
    requireVoice,
    requireSameVoice
} = require('../utils/voice');
function player(i) {
    return get(i.guildId, i.guild)
}
function voice(i, p) {
    const ch = requireVoice(i);
    if (p.voiceChannelId && p.voiceChannelId !== ch.id) throw new Error('DIFFERENT_VC');
    return ch
}
function same(i, p) {
    return requireSameVoice(i, p)
}
const {
    temp,
    persistent
} = require('../ui/lifecycle');
module.exports = {
    player,
    voice,
    same,
    temp,
    persistent
};
