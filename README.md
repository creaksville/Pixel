<img src="./assets/Pixel GitHub Readme.png"><br>
An All New Multi-Purpose Discord Bot, ran on discord.js

<h1 align="center"> Pixel - codename "pixbot_v2" </h1>

<p align="center">
  <a href="https://github.com/creaksville/Pixel/blob/production/LICENSE" alt="License"><img src="https://img.shields.io/github/license/creaksville/Pixel"></img></a>
  <a href="https://discord.gg/YyYNBKuwj3" alt="Discord"><img src="https://img.shields.io/discord/1414141163039883305?color=%23900000&label=Online&logo=The%20Nerds&style=flat"></img></a>
  <a href="https://github.com/creaksville/Pixel/issues" alt="Issues"><img src="https://img.shields.io/github/issues/creaksville/Pixel"></img></a>
</p>
An All New Multi-Purpose, Multi-Guilded Discord Bot

You can contribute whatever you want to if you want to improve the bot with additional features or
bug fixes.
<br>
<br>

To Now Check For Updates, the Updates will be listed on the new Changelog Page on <a href="https://discord.gg/YyYNBKuwj3">The Tech Corner Discord Server</a>
<br>
<br>

# Features

Level/Warn with Database

Autorole Support (With Automatic Role Add when agreeing to Screening)

Bump Reminder that Awards 50 XP

User Configurations

Webhook Support for RSS and Fun Fact

Multi-Guild Support

NEWLY ADDED: AI Chat Support (In Servers and In DMs)

SOON TO BE ADDED: AI Image Generation Support

# Build the bot and self-host

Below are the steps to download a copy of this bot and use it locally

1.) Clone the Project using `git clone https://github.com/creaksville/Pixel.git`

2.) Make Sure You Have Node, and MySQL Installed!!

3.) Navigate to the Root of the Project Directory

4.) Install the Required Dependencies to Allow the Bot To Run using `npm install` in the root directory

5.) Look For The config.temp.js File in the src/config folder, and Edit it to change your Bot Token, API Key, Urban API Host, Gemini API Key and the Plugins Paths (If you are looking to use any plugins)

6.) Look For The webconfig.temp.js File in the src/config folder, and Edit it to change your MySQL Credentials. ENSURE YOU MADE YOUR MYSQL CREDENTIALS BEFORE CONTINUING. IF YOUR CREDENTIALS DONT MATCH OR DON'T EXIST IN THE MYSQL DATABASE, THE BOT WILL NOT RUN

7.) Once You Are Done Editing The File, Save and Rename the File from config.temp.js to config.js, and webconfig.temp.js to webconfig.js

8.) Finally, go back to the root of the project and run `node .`

# How to Keep Your Bot Online 24/7 (if you have access to an Always-On Server by SSH)

The Bot's 24/7 Setup instructions used to be to set-up screen. This has been changed, as the bot can now run in a Docker Compose Container

1.) Ensure you have Docker Installed, and ensure the Docker Compose Capabilities exist before continuing

2.) Copy the docker-compose-example.yml file and rename the copied file to docker-compose.yml. DO NOT DELETE THE compose-example FILE, THIS IS YOUR BACKUP

3.) Under the docker-compose.yml file, change the following entries to your own entries
      - MYSQL_ROOT_PASSWORD to your root password you set up when you install MYSQL
      - MYSQL_DATABASE, MYSQL_USER and MYSQL_PASSWORD to the same entries you created and added in to your webconfig.js file in your config folder.

4.) Save your docker-compose.yml file, then in the root of the project folder, run `# docker compose up -d --build`. This will take about 15-20 seconds to run your first time.

5.) Once the command is complete and the output says running, run `# docker compose ps` to ensure all the necessary processes are active with no errors. Then, run `# docker compose logs -f pixel-bot` to verify there are no errors in the node.js logs

# License

This bot is licensed under GPL version 3.
