const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'roleDelete',
    async execute(role, guild, client) {
        try {
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

            // Wait for 1 second to ensure the role has been fully configured

            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [role.guild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [role.guild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [role.guild.id]);
            connection.release();

            const roleCreateChannel = channelRecordRow[0]?.guildRoleDelete;
            if (!roleCreateChannel) return;
            const logChannel = guild.channels.cache.get(roleCreateChannel);
            if (!logChannel) return;

            const existingEnableRecord = enableRecordRow[0]?.guildRoleDelete;
            if (!existingEnableRecord) return;
            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';

            // Fetch audit logs
            const auditLogs = await role.guild.fetchAuditLogs({
                type: 32
            });

            const roleCreateLog = auditLogs.entries.first();
            if (!roleCreateLog) return;

            const { executor, target, createdAt } = roleCreateLog;
            if (target.id !== role.id) return;

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: executor.tag, iconURL: executor.displayAvatarURL({ dynamic: true }) })
                .setDescription(`:warning: **Role Deleted in ${role.guild.name}**`)
                .addFields(
                    { name: 'Role Name', value: role.name }
                )
                .setTimestamp(createdAt);

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
