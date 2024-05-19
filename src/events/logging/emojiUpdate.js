const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'emojiUpdate',
    async execute(oldEmojis, newEmojis, guild, client) {
        try {
            console.log('What is this')
            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [newEmojis?.guild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [newEmojis?.guild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [newEmojis?.guild.id]);
            connection.release();

            const emojisUpdateChannel = channelRecordRow[0]?.guildEmojisUpdate;
            if (!emojisUpdateChannel) return;
            const logChannel = guild.channels.cache.get(emojisUpdateChannel);
            if (!logChannel) return;
            //console.log(logChannel)

            //console.log(emojisUpdateChannel)

            const existingEnableRecord = enableRecordRow[0]?.guildEmojisUpdate;
            //console.log(existingEnableRecord)
            if (!existingEnableRecord) return;
            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';

            // Fetch audit logs
            const auditLogs = await newEmojis?.guild.fetchAuditLogs({
                type: 61,
                limit: 1
            });

            const emojiUpdateLog = auditLogs.entries.first();
            //console.log(emojiUpdateLog)
            if (!emojiUpdateLog) return;

            const { executor } = emojiUpdateLog;

            const oldEmojiArray = Array.isArray(oldEmojis) ? oldEmojis : [oldEmojis];
            const newEmojiArray = Array.isArray(newEmojis) ? newEmojis : [newEmojis];

            const oldEmojiNames = oldEmojiArray.map(emoji => emoji.name);
            const newEmojiNames = newEmojiArray.map(emoji => emoji.name);


            console.log('Old Emojis:', oldEmojis);
            console.log('New Emojis:', newEmojis);


            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: executor.tag, iconURL: executor.displayAvatarURL({ dynamic: true }) })
                .setDescription(`:smile: **Emojis updated in ${newEmojis?.guild.name}**`)
                .addFields(
                    { name: 'Old Name', value: oldEmojiNames.join(', ') },
                    { name: 'New Name', value: newEmojiNames.join(', ') }
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
