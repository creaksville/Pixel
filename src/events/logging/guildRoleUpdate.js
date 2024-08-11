const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'roleUpdate',
    async execute(oldRole, newRole, client) {
        try {
            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [newRole.guild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [newRole.guild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [newRole.guild.id]);
            connection.release();

            const roleUpdateChannel = channelRecordRow[0]?.guildRoleUpdate;
            if (!roleUpdateChannel) return;
            const logChannel = newRole.guild.channels.cache.get(roleUpdateChannel);
            if (!logChannel) return;

            const existingEnableRecord = enableRecordRow[0]?.guildRoleUpdate;
            if (!existingEnableRecord) return;
            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';

            // Fetch audit logs
            const auditLogs = await newRole.guild.fetchAuditLogs({
                type: 31,
                limit: 1
            });

            const roleUpdateLog = auditLogs.entries.first();
            if (!roleUpdateLog) return;

            const { executor, target, createdAt, changes } = roleUpdateLog;
            if (target.id !== newRole.id) return;

            const changeDetails = changes.map(change => `**${change.key}**: \`${change.old}\` ➔ \`${change.new}\``).join('\n');

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: executor.tag, iconURL: executor.displayAvatarURL({ dynamic: true }) })
                .setDescription(`:warning: **Role Updated in ${newRole.guild.name}**`)
                .addFields(
                    { name: 'Role Name', value: newRole.name },
                    { name: 'Changes', value: changeDetails || 'No specific changes found' }
                )
                .setTimestamp(createdAt);

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
