module.exports = client => {
    client.user.setPresence({
        activities: [{
            name: process.env.STATUS || '🎵 NX Music | /play'
        }], status: 'online'
    });
    console.log(`Logged in as ${client.user.tag}`)
};
