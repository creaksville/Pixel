const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember, client) {
        try {
            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [newMember.guild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [newMember.guild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [newMember.guild.id]);
            connection.release();

            const updateChannel = channelRecordRow[0]?.guildMemberUpdate;
            if (!updateChannel) return;
            const logChannel = newMember.guild.channels.cache.get(updateChannel);
            if (!logChannel) return;

            const existingEnableRecord = enableRecordRow[0]?.guildMemberUpdate;
            if (!existingEnableRecord) return;
            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';

            const changes = [];

            // Check for role changes
            const filterRoles = role => !role.name.startsWith('✴');
            const oldRoles = oldMember.roles.cache.filter(filterRoles).sort((a, b) => b.position - a.position).map(role => `<@&${role.id}>`);
            const newRoles = newMember.roles.cache.filter(filterRoles).sort((a, b) => b.position - a.position).map(role => `<@&${role.id}>`);

            if (oldRoles.join(', ') !== newRoles.join(', ')) {
                const maxDisplayRoles = 5;

                const displayOldRoles = oldRoles.length > maxDisplayRoles 
                    ? oldRoles.slice(0, maxDisplayRoles).join(', ') + `, +${oldRoles.length - maxDisplayRoles} Other Roles` 
                    : oldRoles.join(', ');

                const displayNewRoles = newRoles.length > maxDisplayRoles 
                    ? newRoles.slice(0, maxDisplayRoles).join(', ') + `, +${newRoles.length - maxDisplayRoles} Other Roles` 
                    : newRoles.join(', ');

                changes.push({
                    name: 'Role Update',
                    value: `**Old Roles:**\n${displayOldRoles}\n**New Roles:**\n${displayNewRoles}`,
                });
            }

            // Add more checks for other updates as needed

            if (changes.length === 0) return;

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: `${newMember.user.tag}`, iconURL: newMember.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`:pencil: **${newMember.user.tag}** has been updated.`)
                .addFields(changes)
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};
