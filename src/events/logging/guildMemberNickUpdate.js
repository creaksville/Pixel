const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember, client) {
        try {
            // Check if the nickname has changed
            if (oldMember.nickname === newMember.nickname) return;

            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [newMember.guild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [newMember.guild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [newMember.guild.id]);
            connection.release();

            const nicknameUpdateChannel = channelRecordRow[0]?.guildMemberNickUpdate;
            if (!nicknameUpdateChannel) return;
            const logChannel = newMember.guild.channels.cache.get(nicknameUpdateChannel);
            if (!logChannel) return;

            const existingEnableRecord = enableRecordRow[0]?.guildMemberNickUpdate;
            if (!existingEnableRecord) return;
            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';

            // Create embed message for nickname update
            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: `${newMember.user.tag}`, iconURL: newMember.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`:pencil: **${newMember.user.tag}** has updated their nickname.`)
                .addFields(
                    { name: 'Old Nickname', value: oldMember.nickname || oldMember.user.username, inline: true },
                    { name: 'New Nickname', value: newMember.nickname || newMember.user.username, inline: true }
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
