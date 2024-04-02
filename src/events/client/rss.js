const fs = require('fs');
const path = require('path');
const src = require('../../config/config');
const Parser = require('rss-parser');
const parser = new Parser({
  timeout: 180000
});

const { WebhookClient, EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

const CACHE_FILE_PATH = path.join(__dirname, '../../custom/rss-cache.json');

module.exports = async (client, message) => {
  try {
    const guilds = client.guilds.cache;
    if (guilds.size === 0) return;

    guilds.forEach(async (guild) => {
      const connection = await getConnection();
      const [enableRows] = await connection.query("SELECT rss FROM cfg_enable WHERE guild_id = ?", [guild.id]);
      const [channelRows] = await connection.query("SELECT rss FROM cfg_channels WHERE guild_id = ?", [guild.id]);
      const [embed_color] = await connection.query("SELECT mastercolor FROM cfg_misc WHERE guild_id = ?", [guild.id])
      connection.release();

      const rssChannel = channelRows[0].rss;

      const color = embed_color[0]?.mastercolor;

      const cacheData = fs.existsSync(CACHE_FILE_PATH) ? JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf-8')) : {};
      const sources = JSON.parse(fs.readFileSync(src.plugins.rss.source, 'utf8'));
      const feedList = sources.map((source) => ({
        name: source.name,
        url: source.url,
        lastUpdated: new Date(cacheData[source.url]?.lastUpdated || 0),
        lastSentItemLink: cacheData[source.url]?.lastSentItemLink || null, // add last sent item link to cache data
        seenLinks: cacheData[source.url]?.seenLinks || [], // add seen links to cache data
      }));

      const channel = guild.channels.cache.get(rssChannel);

      let webhook = await channel.fetchWebhooks();
        const name = 'RSS FEED'
        webhook = webhook.find(wh => wh.name === name);

        if (!webhook) {
          console.log("Creating webhook with name:", name); // Log the name value
          webhook = await channel.createWebhook({
            name: name,
            avatar: client.user?.displayAvatarURL(),
            reason: 'none'
          });
        }

      setInterval(async () => {
        const rssEnable = enableRows[0].rss;
        

        if (!rssEnable || rssEnable !== 1) return;

        for (const feed of feedList) {
          try {
            const data = await parser.parseURL(feed.url);
            const lastBuildDate = new Date(data.lastBuildDate || data.pubDate || 0);

            if (lastBuildDate > feed.lastUpdated) {
              const newItems = data.items.filter(item => !feed.seenLinks.includes(item.link));
              if (newItems.length === 0) {
                continue;
              }


              const latestItem = newItems[0];
              
              //const webhook = new WebhookClient({ id: webhookID, token: webhookToken }); // Replace webhookID and webhookToken with your webhook ID and token
              const embedFooter = lastBuildDate.toDateString();

              const embed = new EmbedBuilder()
                .setTitle(latestItem.title)
                .setURL(latestItem.link)
                .setDescription(latestItem.contentSnippet || latestItem.content || ' ')
                .setImage(latestItem.enclosure?.url || 'https://img.freepik.com/premium-photo/close-up-question-mark-dark-theme-interrogative-topics_183270-417.jpg?size=626&ext=jpg')
                .setColor(color)
                .setTimestamp()
                .setFooter({text: `Published on ${embedFooter} | ${feed.name}`});

              webhook.send({ embeds: [embed] });

              feed.lastUpdated = lastBuildDate;
              feed.lastSentItemLink = latestItem.link;
              feed.seenLinks.unshift(latestItem.link);
              feed.seenLinks = feed.seenLinks.slice(0, 100); // only keep the last 100 seen links

              cacheData[feed.url] = {
                lastUpdated: lastBuildDate.toISOString(),
                lastSentItemLink: latestItem.link,
                seenLinks: feed.seenLinks,
              };
              fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheData));

              await new Promise(resolve => setTimeout(resolve, 10000)); // add a delay of 10 seconds before processing the next feed
            }
          } catch (error) {
            if (error.code === 'ETIMEDOUT') {
              console.log(`Request timed out for ${feed.url}`);
              // handle the timeout error here
            } else {
              console.error(`Error fetching data for ${feed.url}`, error);
            }
          }
        }
      }, 5 * 60 * 1000); // Check every 5 minutes
    });
  } catch (error) {
    console.error(error);
  }
};
