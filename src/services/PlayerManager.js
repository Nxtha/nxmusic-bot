const Player = require('../music/Player');
const config = require('../config/config');
const Activity = require('./ActivityManager');
const players = new Map();
function get(guildId, guild) {
    if (!players.has(guildId)) {
        const p = new Player(guildId, config.queueLimit, {
            volume: config.defaultVolume, autoplay: config.defaultAutoplay, always247: config.default247
        });
        players.set(guildId, p)
    }
    const p = players.get(guildId);
    if (guild) {
        p.lastGuild = guild;
        Activity.bind(p, guild)
    }
    return p
}
function remove(guildId) {
    players.delete(guildId)
}
module.exports = {
    get,
    remove,
    all: players
};
