const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState, client) {
        try {
            // Check if the user joined a voice channel
            if (!oldState.channel && newState.channel) {
                const connection = await getConnection();
                const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [newState.guild.id]);
                const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [newState.guild.id]);
                const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [newState.guild.id]);
                connection.release();

                const voiceChannelJoinChannel = channelRecordRow[0]?.voiceChannelJoin; // Adjust the channel record name accordingly
                if (!voiceChannelJoinChannel) return;
                const logChannel = newState.guild.channels.cache.get(voiceChannelJoinChannel);
                if (!logChannel) return;

                const existingEnableRecord = enableRecordRow[0]?.voiceChannelJoin; // Adjust the enable record name accordingly
                if (!existingEnableRecord) return;
                const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';
                const channelMention = `<#${newState.channel.id}>`;

                const embed = new EmbedBuilder()
                    .setColor(embedColor)
                    .setAuthor({ name: newState.member.user.tag, iconURL: newState.member.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(`:microphone2: **${newState.member.user.tag} joined voice channel in ${newState.guild.name}**`)
                    .addFields(
                        { name: 'Channel', value: channelMention }
                    )
                    .setTimestamp();

                logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
        }
    }
};
