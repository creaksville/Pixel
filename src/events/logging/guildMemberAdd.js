const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');
console.log('Test')

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, guild, client) {
        try {
            const userId = member?.user.id;
            const guildId = member?.guild.id;
            const username = member?.user.username;
            const guildname = member?.guild.name;
            const userCreated = member?.user.createdAt;

            const connection = await getConnection();
                const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [member?.guild.id]);
                const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [member?.guild.id]);
                const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [member?.guild.id]);
            connection.release();

            const banAddChannel = channelRecordRow[0]?.guildMemberAdd;
            if (!banAddChannel) return;

            const logChannel = guild.channels.cache.get(banAddChannel);
            if (!logChannel) return;

            const existingEnableRecord = enableRecordRow[0]?.guildMemberAdd;
            if (!existingEnableRecord) return;

            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';

            

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: `${username}`, iconURL: member?.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`<@${userId}> joined`)
                .addFields(
                    { name: 'Name', value: `${username} (${userId})` },
                    { name: 'Joined At', value: `<t:${Math.round(Date.now() / 1000)}:F>` },
                    { name: 'Account Age', value: `**${Math.floor((new Date() - userCreated) / 86400000)}** days`, inline: true},
                    { name: 'Member Count', value: member?.guild.memberCount.toLocaleString(), inline: true}
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
