module.exports = {
    name: 'messageCreate',
    async execute(message, client, interaction) {
      const selfping = require('./selfping');
      const sudo = require('./sudo');
      const bumpreminder = require('./bumpreminder');
      const messageLink = require('./messageLink');

      try {
        //if (message.author.bot) return;

        if (message.mentions.has(client.user.id, { ignoreRoles: true, ignoreEveryone: true })) {
          try {
            selfping(message, client);
          } catch (error) {
            console.error(`Error sending message: ${error.message}`);
            // You can also choose to ignore the error if you don't want to log it.
          }
        };
      
      messageLink(message, client);
      bumpreminder(message, client);
      sudo(message);
      } catch (error) {
        console.log(error);
      }
    }
};