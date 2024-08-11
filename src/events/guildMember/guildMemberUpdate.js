const { EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember, client) {
        try {
            if (newMember.user.bot) return; // Skip if the member is a bot

            const connection = await getConnection();
            const [miscRows] = await connection.query("SELECT autorole, mastercolor, trackedrole FROM cfg_misc WHERE guild_id = ?", [newMember.guild.id]);
            const [enableRows] = await connection.query("SELECT autorole FROM cfg_enable WHERE guild_id = ?", [newMember.guild.id]);
            const [trackedMessageRow] = await connection.query("SELECT * FROM tracked_roles_message WHERE guild_id = ?", [newMember.guild.id]);
            connection.release();

            const guildEnable = enableRows[0].autorole;
            const guildRoles = miscRows[0].autorole;
            const embedColor = miscRows[0]?.mastercolor || '#00FF00';

            console.log('guildEnable:', guildEnable);
            console.log('guildRoles:', guildRoles);

            const guildRolesArray = guildRoles.split(/\s*,\s*/).map(roleId => roleId.trim());

            if (guildEnable && guildRolesArray && Array.isArray(guildRolesArray)) {
                const screeningCompleted = newMember.pending === false;
                console.log('screeningCompleted:', screeningCompleted);
                if (screeningCompleted) {
                    for (const roleId of guildRolesArray) {
                        const role = newMember.guild.roles.cache.get(roleId);
                        if (role) {
                            await newMember.roles.add(role);
                            console.log(`Added role ${role.name} to ${newMember.user.tag}`);
                        } else {
                            console.log(`Role with ID ${roleId} not found.`);
                        }
                    }
                } else {
                    console.log('Member was already verified, No Action has been taken');
                }
            } else {
                console.log('Conditions not met for adding roles.');
            }

            if (trackedMessageRow.length === 0) return; // No tracking message set up
            const { channel_id, message_id } = trackedMessageRow[0];

            const logChannel = newMember.guild.channels.cache.get(channel_id);
            if (!logChannel) return;

            const roleToTrackAbove = miscRows[0].trackedrole; // ID of the role to track above
            const rolesToTrack = newMember.guild.roles.cache.filter(role => role.comparePositionTo(roleToTrackAbove) > 0 && !role.name.includes('✴')).map(role => role.id);

            // Check if roles have changed
            const oldRoles = oldMember.roles.cache.map(role => role.id);
            const newRoles = newMember.roles.cache.map(role => role.id);

            // Check if any tracked roles have been added or removed
            const addedRoles = newRoles.filter(role => rolesToTrack.includes(role) && !oldRoles.includes(role));
            const removedRoles = oldRoles.filter(role => rolesToTrack.includes(role) && !newRoles.includes(role));

            if (addedRoles.length > 0 || removedRoles.length > 0) {
                // Fetch the message to update
                let message;
                try {
                    message = await logChannel.messages.fetch(message_id);
                } catch (error) {
                    if (error.code === 10008) {
                        console.error('The tracked message was not found. It might have been deleted.');
                        return;
                    } else {
                        throw error;
                    }
                }

                // Get all members with the tracked roles above the specified role
                const membersWithTrackedRoles = newMember.guild.members.cache.filter(member =>
                    member.roles.cache.some(role => rolesToTrack.includes(role.id))
                );

                // Sort roles based on their positions
                const sortedRoles = rolesToTrack.sort((a, b) => 
                    newMember.guild.roles.cache.get(b).position - newMember.guild.roles.cache.get(a).position
                );

                // Collect all roles and members
                const roleMembersMap = new Map();

                for (const roleId of sortedRoles) {
                    const roleMembers = membersWithTrackedRoles.filter(member =>
                        member.roles.cache.has(roleId)
                    );

                    if (roleMembers.size > 0) {
                        const role = newMember.guild.roles.cache.get(roleId);
                        const memberList = roleMembers.map(member => member.user.toString()).join(',\n');
                        roleMembersMap.set(role.name, memberList);
                    }
                }

                // Construct the message description
                const memberList = Array.from(roleMembersMap, ([roleName, members]) => `\`${roleName}\`:\n${members}`).join('\n') || 'No members with these roles.';

                // Create the embed
                const embed = new EmbedBuilder()
                    .setColor(embedColor)
                    .setTitle('Chain Of Command')
                    .setDescription(memberList)
                    .setThumbnail(client.user?.displayAvatarURL())
                    .setTimestamp();

                // Update the message with the new embed
                await message.edit({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
        }
    }
};
