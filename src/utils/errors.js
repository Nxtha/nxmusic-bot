const messages = {
    NOT_IN_VC: '❌ You must be in a voice channel.',
    DIFFERENT_VC: '❌ You must be in the same voice channel as me.',
    NO_PLAYER: '❌ There is no active player.',
    NO_RESULTS: '❌ No playable results found.',
    NOT_OWNER: '❌ Only the bot owner can use this command.',
    NO_CURRENT: '❌ Nothing is currently playing.',
    QUEUE_FULL: '❌ The queue is full.',
    INVALID_TIME: '❌ Invalid time. Use seconds or `mm:ss` / `hh:mm:ss`.',
    INVALID_MODE: '❌ Invalid mode.',
    CHANNEL_LOCK: '⚠️ Music controls are locked to the channel where the current session started.'
};
function messageFor(e) {
    const raw = String(e?.message || e || '');
    if (/PYI-\d+|Failed to extract .*cryptography\/hazmat|decompression resulted in return code/i.test(raw)) return '❌ The audio source failed to start. Please try `/play` again in a few seconds.';
    return messages[raw] || `❌ ${raw}`;
}
module.exports = {
    messageFor
};
