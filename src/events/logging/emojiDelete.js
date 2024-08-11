const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'emojiDelete',
    async execute(emoji, guild, client) {
        try {
            console.log('What is this')
            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [emoji?.guild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [emoji?.guild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [emoji?.guild.id]);
            connection.release();

            const emojisUpdateChannel = channelRecordRow[0]?.guildEmojisDelete;
            if (!emojisUpdateChannel) return;
            const logChannel = guild.channels.cache.get(emojisUpdateChannel);
            if (!logChannel) return;
            //console.log(logChannel)

            //console.log(emojisUpdateChannel)

            const existingEnableRecord = enableRecordRow[0]?.guildEmojisDelete;
            //console.log(existingEnableRecord)
            if (!existingEnableRecord) return;
            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';

            // Fetch audit logs
            const auditLogs = await emoji?.guild.fetchAuditLogs({
                type: 62,
                limit: 1
            });

            const emojiUpdateLog = auditLogs.entries.first();
            //console.log(emojiUpdateLog)
            if (!emojiUpdateLog) return;

            const { executor } = emojiUpdateLog;

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: executor.tag, iconURL: executor.displayAvatarURL({ dynamic: true }) })
                .setDescription(`:warning: **Emojis deleted in ${emoji?.guild.name}**`)
                .addFields(
                    { name: 'Emoji Name', value: emoji.name }
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
