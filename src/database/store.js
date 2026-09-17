const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../../data/settings.json');
let data = {
};
try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'))
} catch {
}
function save() {
    fs.mkdirSync(path.dirname(file), {
        recursive: true
    });
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file)
}
function get(guildId, defaults = {
}) {
    return {
        ...defaults,
        ...(data[guildId] || {
        })
    }
}
function set(guildId, patch) {
    data[guildId] = {
        ...(data[guildId] || {
        }),
        ...patch
    };
    save();
    return data[guildId]
}
module.exports = {
    get,
    set
};
