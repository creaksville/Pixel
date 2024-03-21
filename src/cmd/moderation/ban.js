const getConnection = require('../../functions/database/connectDatabase');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a Member')
        .addUserOption(option =>
            option
              .setName('target')
              .setDescription('Selects a Member to Ban')
              .setRequired(true))
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Gives a Reason for Banning')
                .setRequired(true)),
    usage: '<User> <Reason>',
    async execute(interaction, client) {
        try{ 
            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                return await interaction.reply('You Cannot Use This Command: Insufficient Permissions')
            }

            let user = interaction.options.getUser('target');
            let reason = interaction.options.getString('reason');
            const connection = await getConnection();

            if (user) {
                const memberTarget = interaction.guild?.members.cache.get(user?.id);
                const daysToPrune = 7;

                await connection.query(
                    "INSERT INTO mod_tracker (guild_id, guild_name, username, modname, modevent, timestamp, reason, duration, number_of_messages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [interaction.guild.id, interaction.guild.name, user?.username, interaction.user.username, 'Ban', new Date().toLocaleString(), reason, 'N/A', 'N/A']
                );

                memberTarget?.ban({ reason: `${reason} (prune: ${daysToPrune} days)` })
                connection.release();
                
                interaction.reply(`${memberTarget} has been banned`);
            }
              
        } catch(error) {
            console.error(error);
        }
    }
};