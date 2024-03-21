const { Client, ApplicationCommandOptionType, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const getConnection = require("../../functions/database/connectDatabase");

module.exports = {
    data: new SlashCommandBuilder()
      .setName('setranks')
      .setDescription("Updates/Sets the Level Ranks (DEPRECATED SOON)")
      .addRoleOption(option =>
        option
          .setName('role')
          .setDescription('Selects The Role Assigned To The Level')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('level')
          .setDescription('Sets the Level Required For The Rank')
          .setRequired(true)
      ),
    usage: '<role> <level #>',
    async execute(interaction, client) {
        try {
            //await interaction.deferReply();
            const guildId = interaction.guild.id;
            const userId = interaction.member.user.id;
            const guildName = interaction.guild.name;
            const connection = await getConnection();

            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply('You Cannot Use This Command: Insufficient Permissions')
            };

            if (!guildId || !guildName) {
                return;
            }

            const role = interaction.options.getRole('role');
            const roleId = role.id;
            const value = parseInt(interaction.options.getString('level'));

            if (isNaN(value)) {
                return interaction.reply('Please provide a valid level (a number) for the rank.');
            }
            let guildSettings;

            // First, update the database with the new role
            await setRoleSetting(guildId, roleId, value, guildName);

            // Fetch the sorted roles from the database
            const roles = await getSortedRoles(guildId);
            console.log('Sorted roles:', roles);
                const [cfgMiscRows] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [guildId]);
                const [userColorRow] = await connection.query("SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?", [userId, guildId]);
            let userColor = userColorRow[0]?.usercolor
            let defaultColor = cfgMiscRows[0]?.mastercolor;
            let embedColor;

            if (!userColor) {
                embedColor = defaultColor;
            } else if (userColor) {
                embedColor = userColor;
            }

            // Create and send the embed with the updated roles
            if (roles.length > 0) {
                const embed = new EmbedBuilder()
                    .setColor(embedColor)
                    .setTitle('Ranks Updated')
                    .setDescription('Please Read the Info Below')
                    .setThumbnail(interaction.guild.iconURL());

                // Add the sorted roles to the embed
                roles.forEach((roleData, index) => {
                    embed.addFields({ name: `Role #${index + 1}`, value: `<@&${roleData.role_id}>\nLevel ${roleData.levels}`, inline: true });
                });
                
                await connection.release();

                await interaction.reply({embeds: [embed]});
            } else {
                await interaction.reply('No roles found or an error occurred while updating the ranks.');
            }
        } catch (error) {
            console.error(error);
            interaction.reply('An error occurred while updating the ranks.');
        }
    }
};

async function setRoleSetting(guildId, role_id, levels, guild_name) {
    try {
        const connection = await getConnection();
        const existingRole = await connection.query("SELECT * FROM lvlroles WHERE guild_id = ? AND levels = ?", [guildId, levels]);
        if (existingRole[0].length > 0) {
            // Update the existing role with the new role_id
            const updateSql = `
                UPDATE lvlroles 
                SET role_id = ?, guild_name = ?
                WHERE guild_id = ? AND levels = ?
            `;
            await connection.query(updateSql, [role_id, guild_name, guildId, levels]);
        } else {
            // Insert a new role with the specified level
            const insertSql = `
                INSERT INTO lvlroles (guild_id, guild_name, role_id, levels)
                VALUES (?, ?, ?, ?)
            `;
            await connection.query(insertSql, [guildId, guild_name, role_id, levels]);
        }
        connection.release();
    } catch (error) {
        throw error;
    }
}

async function getSortedRoles(guildId) {
    const connection = await getConnection();
    const [rolesRows] = await connection.query("SELECT * FROM lvlroles WHERE guild_id = ?", [guildId]);
    connection.release();

    let sortedRoles = [];

    if (rolesRows && rolesRows.length > 0) {
        sortedRoles = rolesRows.map((role) => ({
            role_id: role.role_id,
            levels: role.levels,
        }));
    }

    return sortedRoles;
}
