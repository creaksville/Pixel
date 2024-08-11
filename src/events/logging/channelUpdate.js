// events/channelUpdate.js
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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
    name: 'channelUpdate',
    async execute(oldChannel, channel, client) {
        try {
            if (!channel.guild) return;

            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [channel.guild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [channel.guild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [channel.guild.id]);
            connection.release();

            const existingChannelRecord = channelRecordRow[0]?.channelUpdate;
            if (!existingChannelRecord) return;
            const logChannel = channel.guild.channels.cache.get(existingChannelRecord);
            if (!logChannel) return;

            const existingEnableRecord = enableRecordRow[0]?.channelUpdate;
            if (!existingEnableRecord) return;
            const embedColor = miscRecordRow[0]?.mastercolor || '#00FF00';

            const changes = [];

            if (channel.name !== oldChannel.name) {
                changes.push({ name: 'Name', before: oldChannel.name, after: channel.name });
            }

            if (channel.topic !== oldChannel.topic) {
                changes.push({ name: 'Topic', before: oldChannel.topic || 'No topic set', after: channel.topic || 'No topic set' });
            }

            if (channel.nsfw !== oldChannel.nsfw) {
                changes.push({ name: 'NSFW', before: oldChannel.nsfw ? 'Enabled' : 'Disabled', after: channel.nsfw ? 'Enabled' : 'Disabled' });
            }

            if (channel.type !== oldChannel.type) {
                changes.push({ name: 'Type', before: CHANNEL_TYPE_MAP[oldChannel.type] || 'Unknown', after: CHANNEL_TYPE_MAP[channel.type] || 'Unknown' });
            }

            // Add additional checks for cooldown setting if needed
            const oldSlowmode = oldChannel.rateLimitPerUser ?? 0;
            const newSlowmode = channel.rateLimitPerUser ?? 0;

            if (newSlowmode !== oldSlowmode) {
                changes.push({ name: 'Slowmode', before: `${oldSlowmode}s`, after: `${newSlowmode}s` });
            }

            const permissionsBefore = Array.from(oldChannel.permissionOverwrites.cache.values());
            const permissionsAfter = Array.from(channel.permissionOverwrites.cache.values());
            const permissionChanges = [];

            for (const permissionBefore of permissionsBefore) {
                const permissionAfter = permissionsAfter.find(p => p.id === permissionBefore.id);
                if (!permissionAfter) {
                    permissionChanges.push({ before: permissionBefore, after: null });
                } else if (JSON.stringify(permissionBefore) !== JSON.stringify(permissionAfter)) {
                    permissionChanges.push({ before: permissionBefore, after: permissionAfter });
                }
            }

            for (const permissionAfter of permissionsAfter) {
                const permissionBefore = permissionsBefore.find(p => p.id === permissionAfter.id);
                if (!permissionBefore) {
                    permissionChanges.push({ before: null, after: permissionAfter });
                }
            }


            if (changes.length === 0 && permissionChanges.length === 0) {
                return;
            }

                const auditLogs = await channel.guild.fetchAuditLogs({
                    type: 11, // Correctly use the integer for CHANNEL_UPDATE
                    limit: 1
                });

                const auditLogEntry = auditLogs.entries.first();
                const executor = auditLogEntry ? auditLogEntry.executor : null;

                const embed = new EmbedBuilder()
                    .setColor(embedColor)
                    .setAuthor({ name: executor ? executor.tag : 'Unknown executor', iconURL: executor ? executor.displayAvatarURL({ dynamic: true }) : null })
                    .setDescription(`${CHANNEL_TYPE_MAP[channel.type] ? CHANNEL_TYPE_MAP[channel.type] : 'Unsupported channel type'} Updated (${channel.name})`)
                    .addFields(changes.map(change => ({ name: change.name, value: `${change.before} -> ${change.after}`, inline: true })));

                if (permissionChanges.length > 0) {
                    embed.addFields({ name: 'Permission Changes', value: formatPermissionChanges(permissionChanges) });
                }

                embed.addFields({ name: 'ID', value: `\`\`\`ini\nUser = ${executor ? executor.id : 'Unknown'}\nChannel = ${channel.id}\`\`\`` })
                    .setTimestamp();

                logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
};



function formatPermissionChanges(permissionChanges) {
    return permissionChanges.map(permissionChange => {
        const { before, after } = permissionChange;
        let changes = '';

        if (!before) {
            changes += `Added permissions for ${after.type === 0 ? `<@&${after.id}>` : `<@${after.id}>`}`
        } else if (!after) {
            changes += `Removed permissions for ${before.type === 0 ? `<@&${before.id}>` : `<@${before.id}>`}`;
        } else {
            const addedPermissions = getPermissionsList(after.allow & ~before.allow).map(permission => `✅: ${permission}`);
            const removedPermissions = getPermissionsList(before.allow & ~after.allow);
            const addedDenies = getPermissionsList(after.deny & ~before.deny).map(permission => `❌: ${permission}`);
            const removedDenies = getPermissionsList(before.deny & ~after.deny);

            if (addedPermissions.length) changes += `${addedPermissions.join(',\n')}\n`;
            if (removedPermissions.length) changes += `${removedPermissions.join(',\n')}\n`;
            if (addedDenies.length) changes += `${addedDenies.join(',\n')}\n`;
            if (removedDenies.length) changes += `${removedDenies.join(',\n')}\n`;


            if (!changes) {
                changes = 'No changes in permissions';
            }
        }

        return changes;
    }).join('\n\n');
}


function getPermissionsList(permissions) {
    if (permissions === '0') {
        return ['None'];
    }

    const permissionNames = [];
    for (const [key, value] of Object.entries(PermissionFlagsBits)) {
        if (permissions & value) {
            permissionNames.push(key);
        }
    }

    return permissionNames;
}
