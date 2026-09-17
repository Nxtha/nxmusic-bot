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
    const wasPaused = p.paused;
    if (wasPaused) p.resume();
    else p.pause();
    await i.update(require('../ui/embeds').nowPlaying(p));
    await temp(i, wasPaused ? actionCard('▶️', 'Resumed', `Resumed by <@${i.user.id}>.`): actionCard('⏸️', 'Paused', `Paused by <@${i.user.id}>.`));
};
