const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'messageDeleteBulk',
    async execute(messages, client) {
        try {
            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [messages.first().guild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [messages.first().guild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [messages.first().guild.id]);
            connection.release();

            const messageDeleteChannel = channelRecordRow[0]?.messageDeleteBulk; // Adjust the channel record name accordingly
            if (!messageDeleteChannel) return;
            const logChannel = messages.first().guild.channels.cache.get(messageDeleteChannel);
            if (!logChannel) return;

            const existingEnableRecord = enableRecordRow[0]?.messageDeleteBulk; // Adjust the enable record name accordingly
            if (!existingEnableRecord) return;
            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';

            const channelMention = `<#${messages.first().channel.id}>`;
            const messageCount = messages.size;

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: messages.first().author.tag, iconURL: messages.first().author.displayAvatarURL({ dynamic: true }) })
                .setDescription(`:wastebasket: **${messageCount} messages bulk deleted in ${messages.first().guild.name}**`)
                .addFields(
                    { name: 'Deleted By:', value: messages.first().author.tag, inline: true },
                    { name: 'Channel:', value: channelMention, inline: true }
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
