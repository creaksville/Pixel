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

            if (newState.channel && oldState.channel && newState.channel.id !== oldState.channel.id) {
                // User switched voice channels
                const voiceChannelJoinChannel = channelRecordRow[0]?.voiceChannelSwitch; // Adjust the channel record name accordingly
                if (voiceChannelJoinChannel) {
                    const logChannel = newState.guild.channels.cache.get(voiceChannelJoinChannel);
                    if (logChannel) {
                        const existingEnableRecord = enableRecordRow[0]?.voiceChannelSwitch;
                        if (existingEnableRecord) {
                            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';
                            const newChannelMention = `<#${newState.channel.id}>`;
                            const oldChannelMention = `<#${oldState.channel.id}>`;

                            const embed = new EmbedBuilder()
                                .setColor(embedColor)
                                .setAuthor({ name: newState.member.user.tag, iconURL: newState.member.user.displayAvatarURL({ dynamic: true }) })
                                .setDescription(`:microphone2: **${newState.member.user.tag} switched voice channels in ${newState.guild.name}**`)
                                .addFields(
                                    { name: 'From', value: oldChannelMention },
                                    { name: 'To', value: newChannelMention }
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
