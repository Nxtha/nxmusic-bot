function formatTime(seconds) {
    seconds = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(seconds / 3600),
    m = Math.floor(seconds % 3600 / 60),
    s = seconds % 60;
    return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`: `${m}:${String(s).padStart(2,'0')}`
}
module.exports = {
    formatTime
};
