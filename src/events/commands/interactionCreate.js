
module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
		try {
			if (interaction.isChatInputCommand()) {
				const { commands } = client;
				const { commandName } = interaction;
				const command = commands.get(commandName);
				if (!command) return;

				try {
					await command.execute(interaction, client);
				} catch(error) {
					console.error(error);
					await interaction.reply({
						content: `Something went wrong With the Command`,
						ephemeral: true
					})
				}
			}
		} catch(error) {
			console.error(error);
		}
    }
}