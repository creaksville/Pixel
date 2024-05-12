const config = require('../../config/config')
const rss = require('./rss');
const funfact = require('./funfact');
const activityStart = require('./activityStart');
const { Webhook } = require('discord-webhook-node');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        const startTimestamp = Date.now();
        console.log(`${client.user.username} is Starting`);
        // Starts the Ready Based Events
        
        rss(client);
        funfact(client);
        activityStart(client);
        autopost(client);

        const endTimestamp = Date.now();
        const elapsed = endTimestamp - startTimestamp;

        console.log(`${client.user.username} Finished Starting at ${new Date().toLocaleString()} (${elapsed} ms)`);
        console.log('-----------------------------------------------------------');

        const url = 'https://discordapp.com/api/webhooks/1218425274098516048/P18oleFNKsi_zapCTLM4W2M5I-pXN0amOBE5kxz1zmd1ugd40zq7OXlnM-W8E5MNO8Ln';

        const Hook = new Webhook(`${url}`);
        Hook.setUsername = 'PixelBot Logs';

        const webhook_message = (`${client.user.username} Finished Starting at ${new Date().toLocaleString()} (${elapsed} ms)\nThe Current Ping Time is As Follows:\nAPI Latency: ${client.ws.ping}ms`)

        // Use the original console.log and send webhook message separately
        console.log(webhook_message);
        Hook.info(webhook_message);
    }
}
