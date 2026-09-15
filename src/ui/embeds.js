const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { formatTime } = require('../utils/time');
const config = require('../config/config');

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatWIB(timestamp) {
  if (!timestamp) return '-';
  const d = new Date(timestamp);
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(d);
  const get = type => parts.find(x => x.type === type)?.value || '';
  return `${get('day')} ${MONTHS[Math.max(0, Number(get('month')) - 1)]} ${get('year')} • ${get('hour')}:${get('minute')} WIB`;
}

function controls(p) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('nx:previous').setEmoji('⏮️').setLabel('Previous').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('nx:pause').setEmoji(p.paused ? '▶️' : '⏯️').setLabel(p.paused ? 'Resume' : 'Pause').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('nx:skip').setEmoji('⏭️').setLabel('Skip').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('nx:stop').setEmoji('⏹️').setLabel('Stop').setStyle(ButtonStyle.Danger)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('nx:shuffle').setEmoji('🔀').setLabel('Shuffle').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('nx:loop').setEmoji('🔁').setLabel('Loop').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('nx:queue').setEmoji('📋').setLabel('Queue').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('nx:volume').setEmoji('🔊').setLabel('Volume').setStyle(ButtonStyle.Secondary)
    )
  ];
}

function nowPlaying(p) {
  const t = p.current;
  if (!t) return null;

  const requester = t.autoplay ? '🤖 Autoplay' : t.requester ? `<@${t.requester}>` : 'Unknown';
  const status = p.cachedPlaybackId && p.cachedPlaybackUntil > Date.now() ? `♻️ Playback from cached #${p.cachedPlaybackId}` : (p.paused ? '⏸️ Paused' : '▶️ Playing');
  const autoplay = p.autoplay ? (p.autoplayMode === 'genre' && p.autoplayGenre ? `On • ${p.autoplayGenre}` : 'On') : 'Off';

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle('🎵 NOW PLAYING')
    .setDescription(`**[${t.title}](${t.url})**`)
    .addFields(
      { name: 'Artist', value: ` ${t.uploader || 'Unknown'} `, inline: true },
      { name: 'Duration', value: ` ⏱ ${formatTime(t.duration)} `, inline: true },
      { name: 'Status', value: ` ${status} `, inline: true },
      { name: 'Requested by', value: ` ${requester} `, inline: true },
      { name: 'Volume', value: ` 🔊 ${p.volume}% `, inline: true },
      { name: 'Autoplay', value: ` 🤖 ${autoplay} `, inline: true },
      { name: '\u200b', value: formatWIB(p.startedAt), inline: false }
    )
    .setFooter({ text: 'NX Music' });

  return { content: '', embeds: [embed], components: controls(p) };
}

function actionCard(emoji, title, message) {
  return {
    content: '',
    embeds: [
      new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`${emoji} ${title}`)
        .setDescription(message)
        .setFooter({ text: 'NX Music' })
    ],
    components: []
  };
}

function musicEnded() {
  return {
    content: '',
    embeds: [
      new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🎵 Music Ended')
        .setDescription('All songs have been played! Use the `/play` command to add new music.')
        .setFooter({ text: 'NX Music' })
    ],
    components: []
  };
}

module.exports = { nowPlaying, musicEnded, actionCard };
