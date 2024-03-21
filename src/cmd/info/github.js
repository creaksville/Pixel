const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('github')
        .setDescription('Retrieve GitHub Link'),
    usage: '',
    async execute(interaction, client) {
        try {
            interaction.reply('https://github.com/Ficouts/PixelBot');
        } catch(error) {
            console.error(error);
        }
    }
}