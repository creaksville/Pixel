const getConnection = require("../../functions/database/connectDatabase");

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
		try {
			if (!interaction.isCommand()) return;
			const { commands } = client;
			const { commandName } = interaction;
			const command = commands.get(commandName);
			if (!command) return;

			try {
				const connection = await getConnection();
				await connection.query('SELECT 1');

				await command.execute(interaction, client);
			} catch (error) {
				console.error('Database is offline or another error occurred:', error);
				await interaction.reply({
					content: 'An error occurred: Database is offline. Please try again later.',
					ephemeral: true
				});
			}
		} catch(error) {
			console.error(error);
		}
    }
}