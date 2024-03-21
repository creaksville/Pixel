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
    async execute(channel, oldChannel, client) {
        try {
            if (!channel.guild) return;

            const connection = await getConnection();
            const [enableRecordRow] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [channel.guild.id]);
            const [channelRecordRow] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [channel.guild.id]);
            const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [channel.guild.id]);
            connection.release();

            const existingChannelRecord = channelRecordRow[0].channelUpdate;
            const logChannel = channel.guild.channels.cache.get(existingChannelRecord);

            console.log(existingChannelRecord);
            const existingEnableRecord = enableRecordRow[0].channelUpdate;
            console.log(existingEnableRecord);
            const embedColor = miscRecordRow[0].mastercolor;

            const changes = [];

            if (channel.name !== oldChannel.name) {
                changes.push({ name: 'Name', before: oldChannel.name, after: channel.name });
            }

            if (channel.topic !== oldChannel.topic) {
                changes.push({ name: 'Topic', before: oldChannel.topic || 'No topic set', after: channel.topic || 'No topic set' });
            }

            const permissionsBefore = Array.from(oldChannel.permissionOverwrites.cache.values());
            const permissionsAfter = Array.from(channel.permissionOverwrites.cache.values());
            const permissionChanges = [];

            for (const permissionBefore of permissionsBefore) {
                const permissionAfter = permissionsAfter.find(p => p.id === permissionBefore.id);
                if (!permissionAfter) {
                    // Permission was removed
                    permissionChanges.push({ before: permissionBefore, after: null });
                } else if (JSON.stringify(permissionBefore) !== JSON.stringify(permissionAfter)) {
                    // Permission was updated
                    permissionChanges.push({ before: permissionBefore, after: permissionAfter });
                }
            }

            for (const permissionAfter of permissionsAfter) {
                const permissionBefore = permissionsBefore.find(p => p.id === permissionAfter.id);
                if (!permissionBefore) {
                    // Permission was added
                    permissionChanges.push({ before: null, after: permissionAfter });
                }
            }

            if (changes.length === 0 && permissionChanges.length === 0) {
                return;
            }

            const auditLogs = await channel.guild.fetchAuditLogs({
                type: 11, // Indicates channel update events
                limit: 1
            });

            const auditLogEntry = auditLogs.entries.first();
            const { executor } = auditLogEntry;
            await channel.guild.members.fetch(channel.guild.ownerId);
            const guildOwner = channel.guild.members.cache.get(channel.guild.ownerId);

            const serverNickname = guildOwner ? guildOwner.displayName : 'Unknown';
            const username = guildOwner ? guildOwner.user.tag : 'Unknown';
            const id = guildOwner ? guildOwner.user.id : 'Unknown';

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: `${username} (${serverNickname})`, iconURL: guildOwner.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`${CHANNEL_TYPE_MAP[channel.type] ? CHANNEL_TYPE_MAP[channel.type] : 'Unsupported channel type'} Updated (${channel.name})`)
                .addFields(changes.map(change => ({ name: change.name, value: formatChange(change) })));

            if (permissionChanges.length > 0) {
                permissionChanges.forEach(permChange => {
                    embed.addFields({ name: 'Permission Changes', value: formatPermissionChange(permChange) });
                });
            }

            embed.addFields({ name: 'ID', value: `\`\`\`ini\nUser = ${id}\nChannel = ${channel.id}\`\`\`` })
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    }
}

function formatChange(change) {
    return `${change.after} -> ${change.before}`;
}

function formatPermissionChange(permissionChange) {
    const { before, after } = permissionChange;
    const permissionTypes = {
        role: 'Role',
        member: 'Member',
    };

    if (before === null) {
        return `Added ${permissionTypes[after.type]}: ${after.id}\n` +
               `Allowed: ${getPermissionsList(after.allow)}\n` +
               `Denied: ${getPermissionsList(after.deny)}`;
    }

    if (after === null) {
        return `Removed ${permissionTypes[before.type]}: ${before.id}`;
    }

    const changedPermissions = [];
    const addedPermissions = [];
    const removedPermissions = [];

    if (before.allow !== after.allow) {
        const beforeAllow = getPermissionsList(before.allow);
        const afterAllow = getPermissionsList(after.allow);

        if (beforeAllow.length > 0 && afterAllow.length > 0) {
            addedPermissions.push(`Allowed: ${afterAllow}`);
            removedPermissions.push(`Allowed: ${beforeAllow}`);
        } else if (beforeAllow.length > 0) {
            removedPermissions.push(`Allowed: ${beforeAllow}`);
        } else if (afterAllow.length > 0) {
            addedPermissions.push(`Allowed: ${afterAllow}`);
        }
    }

    if (before.deny !== after.deny) {
        const beforeDeny = getPermissionsList(before.deny);
        const afterDeny = getPermissionsList(after.deny);

        if (beforeDeny.length > 0 && afterDeny.length > 0) {
            addedPermissions.push(`Denied: ${afterDeny}`);
            removedPermissions.push(`Denied: ${beforeDeny}`);
        } else if (beforeDeny.length > 0) {
            removedPermissions.push(`Denied: ${beforeDeny}`);
        } else if (afterDeny.length > 0) {
            addedPermissions.push(`Denied: ${afterDeny}`);
        }
    }

    if (addedPermissions.length > 0) {
        changedPermissions.push(`Added ${permissionTypes[before.type]}: ${before.id}\n${addedPermissions.join('\n')}`);
    }

    if (removedPermissions.length > 0) {
        changedPermissions.push(`Removed ${permissionTypes[before.type]}: ${before.id}\n${removedPermissions.join('\n')}`);
    }

    return `Updated ${permissionTypes[before.type]}:\n${before.id}\n${changedPermissions.join('\n')}`;
}

function getPermissionsList(permissions) {
    const permissionNames = [];

    if (permissions === '0') {
        return ['None'];
    }

    for (const [key, value] of Object.entries(PermissionFlagsBits)) {
        if (permissions & value) {
            permissionNames.push(key);
        }
    }

    return permissionNames;
}
