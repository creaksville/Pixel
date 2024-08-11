const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

const CHANNEL_TYPE_MAP = {
    0: 'Text channel',
    2: 'Voice channel',
    4: 'Category',
    5: 'Announcement',
    13: 'Stage Channel',
    15: 'Forum channel'
};

module.exports = {
    name: 'channelDelete',
    async execute(channel, client) {
        try {
            if (!channel.guild) return;
            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [channel.guild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [channel.guild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [channel.guild.id]);
            connection.release();

            const existingChannelRecord = channelRecordRow[0].channelDelete;
            const logChannel = channel.guild.channels.cache.get(existingChannelRecord);

            console.log(existingChannelRecord);
            const existingEnableRecord = enableRecordRow[0].channelDelete;
            console.log(existingEnableRecord);
            const embedColor = miscRecordRow[0].mastercolor;

            let typeString = CHANNEL_TYPE_MAP[channel.type] || channel.type;

            // Instead of fetching audit logs for CHANNEL_CREATE, fetch them for CHANNEL_DELETE (action type 12)
            const auditLogs = await channel.guild.fetchAuditLogs({
                type: 12,
                limit: 1
            });

            const auditLogEntry = auditLogs.entries.first();
            const { executor } = auditLogEntry;
            await channel.guild.members.fetch(channel.guild.ownerId);
            const guildOwner = channel.guild.members.cache.get(channel.guild.ownerId);

            // Get the server owner's display name
            const serverNickname = guildOwner ? guildOwner.displayName : 'Unknown';
            const username = guildOwner ? guildOwner.user.tag : 'Unknown';
            const id = guildOwner ? guildOwner.user.id : 'Unknown';

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: `${username} (${serverNickname})`, iconURL: guildOwner.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`${CHANNEL_TYPE_MAP[channel.type] ? CHANNEL_TYPE_MAP[channel.type] : 'Unsupported channel type'} deleted (${channel.name})`)
                .addFields({ name: 'ID', value: `\`\`\`ini\nUser = ${id}\nChannel = ${channel.id}\`\`\`` })
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
