const { nowPlaying, musicEnded } = require('../ui/embeds');
const messages = new Map();
const endedMessages = new Map();
const timers = new Map();

async function disableMessage(message) {
  if (!message?.components?.length) return;
  try {
    const rows = message.components.map(row => ({
      type: 1,
      components: row.components.map(component => ({
        type: 2,
        custom_id: component.customId,
        style: component.style,
        label: component.label || undefined,
        emoji: component.emoji ? { id: component.emoji.id || undefined, name: component.emoji.name || undefined } : undefined,
        disabled: true
      }))
    }));
    await message.edit({ components: rows });
  } catch {}
}

async function deactivate(player) {
  const msg = player.activityMessage || messages.get(player.guildId);
  if (!msg) return;
  await disableMessage(msg);
}

function isActiveMessage(player, message) {
  const active = player.activityMessage || messages.get(player.guildId);
  return Boolean(active?.id && message?.id && active.id === message.id);
}

async function refresh(player) {
  const channel = player.activityChannel;
  if (!channel?.isTextBased?.() || !player.current) return player.activityMessage || messages.get(player.guildId) || null;
  const payload = nowPlaying(player);
  if (!payload) return player.activityMessage || messages.get(player.guildId) || null;
  let msg = player.activityMessage || messages.get(player.guildId);
  try {
    if (msg && msg.channelId === channel.id) {
      await msg.edit(payload);
      player.activityMessage = msg;
      messages.set(player.guildId, msg);
      return msg;
    }
  } catch {
    player.activityMessage = null;
    messages.delete(player.guildId);
  }
  try {
    msg = await channel.send(payload);
    player.activityMessage = msg;
    messages.set(player.guildId, msg);
    return msg;
  } catch (e) {
    console.error(`[${player.guildId}] activity send failed:`, e.message);
  }
}

async function sendEnded(player) {
  const channel = player.activityChannel;
  if (!channel?.isTextBased?.() || !player.endedAt) return null;
  const marker = player.endedAt;
  if (player.lastEndedMessageAt === marker) return endedMessages.get(player.guildId) || null;
  try {
    const msg = await channel.send(musicEnded());
    player.lastEndedMessageAt = marker;
    player.endedMessage = msg;
    endedMessages.set(player.guildId, msg);
    return msg;
  } catch (e) {
    console.error(`[${player.guildId}] ended message send failed:`, e.message);
  }
}

function bind(player, guild) {
  player.lastGuild = guild;
  if (timers.has(player.guildId)) return;
  player.onEvent = async (type, ...args) => {
    console.log(`[${guild.id}] ${type}${args.length ? ` ${args.map(x => typeof x === 'object' ? x.title || x.id : x).join(' ')}` : ''}`);
    if (type === 'error') console.error(args[0]);
    if (type === 'cached') console.warn(`[${guild.id}] ▶️ Playback from cached #${args[0]}`);
    if (type === 'idle' || type === 'stop') {
      await deactivate(player);
      await sendEnded(player);
      return;
    }
    await refresh(player);
  };
  const timer = setInterval(() => {
    if (player.current) refresh(player).catch(() => {});
  }, 10000);
  timer.unref?.();
  timers.set(player.guildId, timer);
}

function setChannel(player, channel) {
  if (!channel?.isTextBased?.()) return;
  player.activityChannel = channel;
}
function setMessage(player, message) {
  if (!message) return;
  const previous = player.activityMessage || messages.get(player.guildId);
  if (previous?.id && previous.id !== message.id) disableMessage(previous).catch(() => {});
  player.activityMessage = message;
  messages.set(player.guildId, message);
}

module.exports = { refresh, bind, setChannel, setMessage, sendEnded, deactivate, isActiveMessage };
