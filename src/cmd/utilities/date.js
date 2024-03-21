const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('date')
        .setDescription('Retrieve the Current Date and Time'),
    usage: '',
    async execute(interaction, client) {
        try {
            const date = new Date().toLocaleString();
            interaction.reply(`The Current Date is ${date}`)
        } catch(error) {
            console.error(error);
        }
    }
}
