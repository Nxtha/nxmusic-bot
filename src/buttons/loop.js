module.exports = async i => {
    const {
        player,
        same,
        temp
    } = require('../commands/_helpers');
    const {
        actionCard
    } = require('../ui/embeds');
    const p = player(i);
    same(i, p);
    const next = {
        off: 'song',
        song: 'queue',
        queue: 'off'
    }
    [p.loop];
    p.setLoop(next);
    await i.update(require('../ui/embeds').nowPlaying(p));
    await temp(i, actionCard('🔁', 'Loop Updated', `Loop mode: **${p.loop}** by <@${i.user.id}>.`));
};
