const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(newMember, oldMember, client) {
        try {
            const connection = await getConnection();
            const [miscRows] = await connection.query("SELECT autorole FROM cfg_misc WHERE guild_id = ?", [newMember?.guild.id]);
            const [enableRows] = await connection.query("SELECT autorole FROM cfg_enable WHERE guild_id = ?", [newMember?.guild.id]);
            connection.release();

            const guildEnable = enableRows[0].autorole;
            const guildRoles = miscRows[0].autorole;

            console.log('guildEnable:', guildEnable);
            console.log('guildRoles:', guildRoles);

            const guildRolesArray = guildRoles.split(/\s*,\s*/).map(roleId => roleId.trim());

            if (guildEnable && guildRolesArray && Array.isArray(guildRolesArray)) {
                const screeningCompleted = newMember.pending;
                console.log('test');
                if (screeningCompleted) {
                    for (const roleId of guildRolesArray) { // Iterate over guildRolesArray, not guildRoles
                        const role = newMember.guild.roles.cache.get(roleId);
                        if (role) {
                            await newMember.roles.add(role);
                            console.log(`Added role ${role.name} to ${newMember.user.tag}`);
                        } else {
                            console.log(`Role with ID ${roleId} not found.`);
                        }
                    }
                } else {
                    console.log('Member was already verified, No Action has been taken')
                }
            } else {
                console.log('Conditions not met for adding roles.');
            }
        } catch(error) {
            console.error(error);
        }
    }
};
