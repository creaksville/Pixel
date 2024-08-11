const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');
console.log('Test')

module.exports = {
    name: 'guildBanRemove',
    async execute(user, guild, client) {
        try {
            const connection = await getConnection();
                const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [user?.guild.id]);
                const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [user?.guild.id]);
                const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [user?.guild.id]);
            connection.release();

            const banRemoveChannel = channelRecordRow[0]?.guildBanRemove;
            if (!banRemoveChannel) return;
            const logChannel = guild.channels.cache.get(banRemoveChannel);
            if (!logChannel) return;

            const existingEnableRecord = enableRecordRow[0]?.guildBanRemove;
            if (!existingEnableRecord) return;
            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';

            // Fetch audit logs
            const auditLogs = await user?.guild.fetchAuditLogs({
                type: 23,
                limit: 1
            });

            // Get the latest unban entry from audit logs
            const unbanLog = auditLogs.entries.first();
            if (!unbanLog) return;

            const { executor, target, createdAt } = unbanLog;
            if (target.id !== user?.user.id) return;

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: executor.tag, iconURL: executor.displayAvatarURL({ dynamic: true }) })
                .setDescription(`:unlock: **${user?.user.tag}** (${user?.user.id}) has been unbanned.`)
                .addFields({ name: 'ID', value: `\`\`\`ini\nExecutor = ${executor ? executor.id : 'Unknown'}\nPerpetrator = ${user?.user.id}\`\`\`` })
                .setTimestamp(createdAt);

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
