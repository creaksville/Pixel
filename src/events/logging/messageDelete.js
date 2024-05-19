const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'messageDelete',
    async execute(message, client) {
        try {
            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [message.guild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [message.guild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [message.guild.id]);
            connection.release();

            const messageDeleteChannel = channelRecordRow[0]?.messageDelete; // Adjust the channel record name accordingly
            if (!messageDeleteChannel) return;
            const logChannel = message.guild.channels.cache.get(messageDeleteChannel);
            if (!logChannel) return;

            const existingEnableRecord = enableRecordRow[0]?.messageDelete; // Adjust the enable record name accordingly
            if (!existingEnableRecord) return;
            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';
            const channelMention = `<#${message.channel.id}>`;
            const content = message.content.toString();

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setDescription(`:wastebasket: **Message Deleted in ${message.guild.name}**`)
                .addFields(
                    { name: 'Deleted by', value: message.author.tag },
                    { name: 'Channel', value: channelMention },
                    { name: 'Content', value: content || 'No content available' }
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
