const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'guildUpdate',
    async execute(oldGuild, newGuild, client) {
        try {
            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [newGuild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [newGuild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [newGuild.id]);
            connection.release();

            const guildUpdateChannel = channelRecordRow[0]?.guildUpdate; // Adjust the channel record name accordingly
            if (!guildUpdateChannel) return;
            const logChannel = newGuild.channels.cache.get(guildUpdateChannel);
            if (!logChannel) return;

            const existingEnableRecord = enableRecordRow[0]?.guildUpdate; // Adjust the enable record name accordingly
            if (!existingEnableRecord) return;
            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';

            // Fetch audit logs
            const auditLogs = await newGuild.fetchAuditLogs({
                type: 1, // Use appropriate type for guild updates (1 is for guild changes)
                limit: 1
            });

            const guildUpdateLog = auditLogs.entries.first();
            if (!guildUpdateLog) return;

            const { executor, target, createdAt, changes } = guildUpdateLog;
            if (target.id !== newGuild.id) return;

            const changeDetails = changes.map(change => `**${change.key}**: \`${change.old}\` ➔ \`${change.new}\``).join('\n');

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: executor.tag, iconURL: executor.displayAvatarURL({ dynamic: true }) })
                .setDescription(`:warning: **Guild Updated: ${newGuild.name}**`)
                .addFields(
                    { name: 'Changes', value: changeDetails || 'No specific changes found' }
                )
                .setTimestamp(createdAt);

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
