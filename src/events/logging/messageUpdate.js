const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage, client) {
        try {
            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [newMessage.guild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [newMessage.guild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [newMessage.guild.id]);
            connection.release();

            const messageUpdateChannel = channelRecordRow[0]?.messageUpdate; // Adjust the channel record name accordingly
            if (!messageUpdateChannel) return;
            const logChannel = newMessage.guild.channels.cache.get(messageUpdateChannel);
            if (!logChannel) return;

            const existingEnableRecord = enableRecordRow[0]?.messageUpdate; // Adjust the enable record name accordingly
            if (!existingEnableRecord) return;
            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';
            const channelMention = `<#${newMessage.channel.id}>`;
            const oldContent = oldMessage.content.toString();
            const newContent = newMessage.content.toString();

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: newMessage.author.tag, iconURL: newMessage.author.displayAvatarURL({ dynamic: true }) })
                .setDescription(`:pencil: **Message Updated in ${newMessage.guild.name}**`)
                .addFields(
                    { name: 'Updated by', value: newMessage.author.tag },
                    { name: 'Channel', value: channelMention },
                    { name: 'Old Content', value: oldContent || 'No content available' },
                    { name: 'New Content', value: newContent || 'No content available' }
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
