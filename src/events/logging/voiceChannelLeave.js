const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState, client) {
        try {
            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [newState.guild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [newState.guild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [newState.guild.id]);
            connection.release();

            const voiceChannelLeaveChannel = channelRecordRow[0]?.voiceChannelLeave; // Adjust the channel record name accordingly

            if (!newState.channel && oldState.channel) {
                // User left a voice channel
                if (voiceChannelLeaveChannel) {
                    const logChannel = newState.guild.channels.cache.get(voiceChannelLeaveChannel);
                    if (logChannel) {
                        const existingEnableRecord = enableRecordRow[0]?.voiceChannelLeave;
                        if (existingEnableRecord) {
                            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';
                            const channelMention = `<#${oldState.channel.id}>`;

                            const embed = new EmbedBuilder()
                                .setColor(embedColor)
                                .setAuthor({ name: oldState.member.user.tag, iconURL: oldState.member.user.displayAvatarURL({ dynamic: true }) })
                                .setDescription(`:microphone2: **${oldState.member.user.tag} left voice channel in ${oldState.guild.name}**`)
                                .addFields(
                                    { name: 'Channel', value: channelMention }
                                )
                                .setTimestamp();

                            logChannel.send({ embeds: [embed] });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
};
