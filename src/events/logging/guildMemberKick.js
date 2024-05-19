const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');
console.log('Test')

module.exports = {
    name: 'guildMemberRemove',
    async execute(user, guild, client) {
        try {
            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [user?.guild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [user?.guild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [user?.guild.id]);
            connection.release();

            const banAddChannel = channelRecordRow[0]?.guildMemberKick;
            if (!banAddChannel) return;
            const logChannel = guild.channels.cache.get(banAddChannel);

            if (!logChannel) return;

            const existingEnableRecord = enableRecordRow[0]?.guildMemberKick;
            if (!existingEnableRecord) return;
            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';

            // Fetch audit logs
            const auditLogs = await user?.guild.fetchAuditLogs({
                type: 20,
                limit: 1
            });

            // Get the latest ban entry from audit logs
            const banLog = auditLogs.entries.first();
            console.log(banLog)
            if (!banLog) return;

            const { executor, target, createdAt, reason } = banLog;
            if (target.id !== user?.user.id) return;

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: executor.tag, iconURL: executor.displayAvatarURL({ dynamic: true }) })
                .setDescription(`:hammer: **${user?.user.username}** (${user?.user.id}) has been kicked\n**Reason: ${reason}**.`)
                .addFields({ name: 'ID', value: `\`\`\`ini\nExecutor = ${executor ? executor.id : 'Unknown'}\nPerpetrator = ${user?.user.id}\`\`\`` })
                .setTimestamp(createdAt);

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
