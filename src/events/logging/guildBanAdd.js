const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'guildBanAdd',
    async execute(user, guild, client) {
        try {
            console.log('TEST');
            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [user.guild?.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [user.guild?.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [user.guild?.id]);
            connection.release();

            console.log(`DB Row: ${channelRecordRow[0]}`);
            console.log(`DB Row Entry Item: ${channelRecordRow[0].guildBanAdd}`);

            const existingChannelRecord = channelRecordRow[0].guildBanAdd;
            console.log(channelRecordRow);
            console.log(existingChannelRecord);
            const logChannel = guild.channels.cache.get(existingChannelRecord);
            const existingEnableRecord = enableRecordRow[0].guildBanAdd;
            const embedColor = miscRecordRow[0].mastercolor;

            // Fetch the ban information
            const banInfo = await user.guild?.bans.fetch(user);
            console.log(banInfo.user)

            if (!banInfo) {
                console.log(`Unable to fetch ban information for user ${user.tag}`);
                return;
            }

            const guildOwner = user.guild?.members.cache.get(user.guild?.ownerId);

            const serverNickname = guildOwner ? guildOwner.displayName : 'Unknown';
            const username = guildOwner ? guildOwner.user.tag : 'Unknown';
            const id = guildOwner ? guildOwner.user.id : 'Unknown';

            const executor = banInfo.executor;

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: `${username} (${serverNickname})`, iconURL: guildOwner.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`**${user.user.username}** has been banned from the server.`)
                .addFields(
                    { name: 'ID', value: `\`\`\`ini\nMod ID = ${user.user.id}\nPerpetrator ID = ${banInfo.user.id}\`\`\``}
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
