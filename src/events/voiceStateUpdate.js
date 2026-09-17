const {
    all
} = require('../services/PlayerManager');
module.exports = (oldS, newS) => {
    for (const p of all.values()) {
        if (p.voiceChannelId === oldS.channelId && oldS.member?.user?.bot !== true && newS.channelId !== p.voiceChannelId) {
            if (p.always247) return;
            const vc = oldS.channel;
            if (vc && vc.members.filter(m => !m.user.bot).size === 0) {
                setTimeout(() => {
                    if (!p.always247 && p.connection) {
                        try {
                            p.stop()
                        } catch {
                        }
                    }
                }, 1500)
            }
        }
    }
};
