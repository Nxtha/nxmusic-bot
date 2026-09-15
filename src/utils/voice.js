function memberVoice(interaction){return interaction.member?.voice?.channel||null}
function requireVoice(interaction){const ch=memberVoice(interaction);if(!ch)throw new Error('NOT_IN_VC');return ch}
function requireSameVoice(interaction,player){const ch=requireVoice(interaction);if(player.voiceChannelId&&player.voiceChannelId!==ch.id)throw new Error('DIFFERENT_VC');return ch}
module.exports={memberVoice,requireVoice,requireSameVoice};
