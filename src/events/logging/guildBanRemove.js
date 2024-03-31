const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'guildBanRemove',
    async execute(user, guild, client) {
        try {
            console.log('TEST');
            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [user.guild?.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [user.guild?.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [user.guild?.id]);
            connection.release();

            console.log(`DB Row: ${channelRecordRow[0]}`);
            console.log(`DB Row Entry Item: ${channelRecordRow[0].guildBanRemove}`);

            const existingChannelRecord = channelRecordRow[0].guildBanRemove;
            console.log(channelRecordRow);
            console.log(existingChannelRecord);
            const logChannel = guild.channels.cache.get(existingChannelRecord);
            const existingEnableRecord = enableRecordRow[0].guildBanRemove;
            const embedColor = miscRecordRow[0].mastercolor;

            const guildOwner = user.guild?.members.cache.get(user.guild?.ownerId);
            const serverNickname = guildOwner ? guildOwner.displayName : 'Unknown';
            const username = guildOwner ? guildOwner.user.tag : 'Unknown';
            const id = guildOwner ? guildOwner.user.id : 'Unknown';

            const executor = await user.guild?.bans.fetch(user);

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: `${username} (${serverNickname})`, iconURL: guildOwner.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`**${user.user.username}** has been unbanned from the server.`)
                .addFields(
                    { name: 'ID', value: `\`\`\`ini\nMod ID = ${user.user.id}\nUnbanned ID = ${executor.user.id}\`\`\`` }
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
