const fs = require("fs");
const fetch = require("node-fetch");
const getConnection = require("../../functions/database/connectDatabase");
const { CommandInteraction, Client, ApplicationCommandOptionType, EmbedBuilder, TextChannel, SlashCommandBuilder } = require("discord.js");
const { plugins } = require('../../config/config');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
  data: new SlashCommandBuilder()
  .setName('nsfw')
  .setDescription('Fetches a Random Post From an NSFW Subreddit')
  .addStringOption(option =>
    option
      .setName('subreddit')
      .setDescription('Subreddit to grab Post From')),
usage: '<subreddit>',
async execute(interaction, client) {
    try {
      await interaction.deferReply();
      const guildId = interaction.guild?.id;
      let userId;
      const serveruserid = interaction.member.user.id;
      const dmuserId = interaction.user.id;
      if(serveruserid == null){
        userId = dmuserId;
      } else {
        userId = serveruserid
      }

      const connection = await getConnection();
        const [miscRows] = await connection.query("SELECT mastercolor FROM cfg_misc WHERE guild_id = ?", [guildId]);
        const [userColorRow] = await connection.query(`SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?`, [userId, guildId]);
        const [enableRows] = await connection.query("SELECT reddit FROM cfg_enable WHERE guild_id = ?", [guildId]);
      connection.release();

      const subredditJson = fs.readFileSync(plugins.subreddits.source);
      const subredditArray = JSON.parse(subredditJson);

      const defaultColor = miscRows[0].mastercolor;
      const userColor = userColorRow[0].usercolor;
      let embedColor;
            
      if (!userColor) {
        embedColor = defaultColor;
      } else if (userColor) {
        embedColor = userColor;
      }
      
      const guildEnable = enableRows[0]?.reddit;
      console.log('guildEnable:', guildEnable);
      if (guildEnable !== 1) return interaction.editReply('Reddit Disabled in Configuration, please Enable It');

      if (interaction.channel instanceof TextChannel) {
        if (!interaction.channel?.nsfw) {
          return interaction.editReply('This command can only be used in NSFW channels.');
        }
      }

      if (subredditArray.length === 0) {
        return interaction.editReply('No subreddits found in the JSON file.');
      }

      const subreddit = subredditArray[Math.floor(Math.random() * subredditArray.length)];
      const options = interaction.options;
      const specifiedSubreddit = options.getString('subreddit');

      let outputSubreddit;
      if (!specifiedSubreddit) {
        outputSubreddit = subreddit;
      } else if (specifiedSubreddit) {
        outputSubreddit = specifiedSubreddit;
      }

      const url = `https://www.reddit.com/r/${outputSubreddit}/random.json`
      const header_options = {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
        }
      }

      const response = await fetch(url, header_options);
      const subname = outputSubreddit;
      const responseBody = await response.text();

      console.log(responseBody);
      const data = JSON.parse(responseBody);
     

      if (!data || !data[0] || !data[0].data || !data[0].data.children[0]) {
        return interaction.editReply(`Could not find subreddit '${outputSubreddit}'.`);
      }

      const post = data[0].data.children[0].data;
      if (!post.over_18) {
        return interaction.editReply(`Whoops, this command is meant for NSFW Results!! Please use /reddit for Non NSFW Posts!!`);
      }

      const embed = new EmbedBuilder()
        .setTitle(post.title)
        .setURL(`https://www.reddit.com${post.permalink}`)
        .setColor(embedColor)
        .setDescription(post.selftext ? post.selftext : 'No description available')
        .setFooter({
          text: `r/${subname} - 👍 ${post.ups} | 💬 ${post.num_comments}`
        })

      if (post.post_hint === 'image' || post.url.includes('.jpg') || post.url.includes('.png')) {
        embed.setImage(post.url);
      } else if (post.is_video) {
        const videoUrl = post.media.reddit_video.fallback_url;
        embed.addFields({ name: 'Video', value: `[Watch Here](${videoUrl})` });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.log(error);
    }
  },
};
