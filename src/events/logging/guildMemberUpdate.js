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
            const oldRoles = oldMember.roles.cache.filter(filterRoles);
            const newRoles = newMember.roles.cache.filter(filterRoles);

            const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
            const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));
            const unchangedRoles = newRoles.filter(role => oldRoles.has(role.id));

            if (addedRoles.size > 0 || removedRoles.size > 0) {
                const maxDisplayRoles = 5;

                const displayAddedRoles = addedRoles.size > maxDisplayRoles 
                    ? addedRoles.map(role => `<@&${role.id}>`).slice(0, maxDisplayRoles).join(', ') + `, +${addedRoles.size - maxDisplayRoles} More` 
                    : addedRoles.map(role => `<@&${role.id}>`).join(', ');

                const displayRemainingOldRoles = unchangedRoles.size + removedRoles.size > maxDisplayRoles 
                    ? unchangedRoles.map(role => `<@&${role.id}>`).concat(removedRoles.map(role => `<@&${role.id}>`)).slice(0, maxDisplayRoles).join(', ') + `, +${unchangedRoles.size + removedRoles.size - maxDisplayRoles} More` 
                    : unchangedRoles.map(role => `<@&${role.id}>`).concat(removedRoles.map(role => `<@&${role.id}>`)).join(', ');

                changes.push({
                    name: 'Role Update',
                    value: `**New Roles:**\n${displayAddedRoles}\n**Old Roles:**\n${displayRemainingOldRoles}`,
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
