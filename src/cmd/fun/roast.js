const fs = require('fs');
const config = require('../../config/config');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roast')
        .setDescription('Roast People')
        .addUserOption(option =>
            option
              .setName('user')
              .setDescription('The User You Want to Roast')),
    usage: `<user> (optional)`,
    async execute(interaction, client) {
    try {
        let user = interaction.options.getUser('user');

        const selfmention = `<@${interaction.user.id}>`;
        const roasts = JSON.parse(fs.readFileSync(config.plugins.roasts.source, 'utf8'));
        const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];
        if(!user) {
            return interaction.reply(`${selfmention}, ${randomRoast}`);
        } else if(user) {
            return interaction.reply(`<@${user.id}>, ${randomRoast}`);
        }
        
        
    } catch(error) {
        console.error(error);
    }
  },
};