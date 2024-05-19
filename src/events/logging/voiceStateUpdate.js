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

            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';

            // Scenario 3: User is muted or deafened
            if ((oldState.serverMute !== newState.serverMute || oldState.serverDeaf !== newState.serverDeaf) ||
                (oldState.selfMute !== newState.selfMute || oldState.selfDeaf !== newState.selfDeaf)) {
                const muteDeafenChannel = channelRecordRow[0]?.voiceStateUpdate; // Adjust the channel record name accordingly
                if (muteDeafenChannel) {
                    const logChannel = newState.guild.channels.cache.get(muteDeafenChannel);
                    if (logChannel) {
                        const existingEnableRecord = enableRecordRow[0]?.voiceStateUpdate;
                        if (existingEnableRecord) {
                            const userMention = `<@${newState.id}>`;
                            const action = newState.serverMute || newState.selfMute ? 'muted' : 'deafened';
                            const embed = new EmbedBuilder()
                                .setColor(embedColor)
                                .setDescription(`:mute: **${userMention} ${action} in ${newState.guild.name}**`)
                                .setTimestamp();
                            logChannel.send({ embeds: [embed] });
                        }
                    }
                }
            }

            // Scenario 4: User is moved
            if (oldState.channelID && oldState.channelID !== newState.channelID) {
                const moveChannel = channelRecordRow[0]?.voiceStateUpdate; // Adjust the channel record name accordingly
                if (moveChannel) {
                    const logChannel = newState.guild.channels.cache.get(moveChannel);
                    if (logChannel) {
                        const existingEnableRecord = enableRecordRow[0]?.voiceStateUpdate;
                        if (existingEnableRecord) {
                            const userMention = `<@${newState.id}>`;
                            const oldChannelMention = `<#${oldState.channelID}>`;
                            const newChannelMention = newState.channelID ? `<#${newState.channelID}>` : 'unknown channel';
                            const embed = new EmbedBuilder()
                                .setColor(embedColor)
                                .setDescription(`:arrow_right: **${userMention} moved from ${oldChannelMention} to ${newChannelMention} in ${newState.guild.name}**`)
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
