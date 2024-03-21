// This Document shows you the structure for commands, if you feel like writing your own commands. It's pretty simple
// You must already have some type of command handler in the 'src/functions/handlers/handleCommand.js' file, preferably what i wrote
const { SlashCommandBuilder } = require('discord.js');                              // Imports for the Slash Command System. You should also import EmbedBuilder if you are working with embeds

module.exports = {
    data: new SlashCommandBuilder()
      .setName('')                                                                  // The Name of The Command
      .setDescription('')                                                           // Description of Command
      .addStringOption(option =>                                                    // Use This Logic if you intend to have Options for your commands
        option
          .setName('subreddit')                                                     // The Name for an Option
          .setDescription('Subreddit to grab Post From')                            // The Description for that Option
          .setRequired(true)),                                                      // Use if you intend to require that option
    usage: '',                                                                      // The Usage
    aliases: '',                                                                    // Any Aliases
    async execute(interaction, client) {                                            // If your command uses await Statements, this must be async execute
        try {                                                                       // This Try/Catch Loop has been added to prevent crashing by doing error handling
            
          } catch (error) {
            console.error(error);
          }
    }
}