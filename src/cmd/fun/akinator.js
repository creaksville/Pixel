const akinator = require('discord.js-akinator');
const language = "en"; // The Language of the Game
const childMode = false; // Whether to use Akinator's Child Mode
const gameType = "character"; // The Type of Akinator Game to Play. ("animal", "character" or "object")
const useButtons = true; // Whether to use Discord's Buttons
const embedColor = "#1F1E33";
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('akinator')
        .setDescription('Play the Akinator Game!!'),
    usage: '',
    async execute(interaction, client) {
    try {
      akinator(interaction, {
        language: language, // Defaults to "en"
        childMode: childMode, // Defaults to "false"
        gameType: gameType, // Defaults to "character"
        useButtons: useButtons, // Defaults to "false"
        embedColor: embedColor // Defaults to "Random"
    });
    } catch (error) {
      console.error('Akinator command error:', error);
      interaction.reply({
        content:'The API Seems to be Nonexistant now 😢...\nTo Play Akinator, please visit the akinator website at https://akinator.com',
        ephemeral: true
      });
    }
  },
};
