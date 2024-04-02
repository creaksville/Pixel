# PixelBot
<img src="./assets/pixbot-readme.png"><br>
An All New Multi-Purpose Discord Bot, ran on discord.js

<h1 align="center"> PixelBot - codename "pixbot_v1" </h1>

<p align="center">
  <a href="https://github.com/Ficouts/PixelBot/blob/production/LICENSE" alt="License"><img src="https://img.shields.io/github/license/Ficouts/PixelBot"></img></a>
  <a href="https://discord.gg/bFVMA2KgSN" alt="Discord"><img src="https://img.shields.io/discord/1218346450283528202?color=%23900000&label=Online&logo=The%20Nerds&style=flat"></img></a>
  <a href="https://github.com/Ficouts/PixelBot/issues" alt="Issues"><img src="https://img.shields.io/github/issues/Ficouts/PixelBot"></img></a>
</p>
An All New Multi-Purpose, Multi-Guilded Discord Bot

You can contribute whatever you want to if you want to improve the bot with additional features or
bug fixes.
<br>
<br>

To Now Check For Updates, the Updates will be listed on the new Changelog Page on <a href="https://discord.gg/bFVMA2KgSN">The Pixel Pub Discord Server</a>
<br>
<br>

# Features

Level/Warn with Database

Autorole Support (With Automatic Role Add when agreeing to Screening)

Bump Reminder that Awards 50 XP

User Configurations

Reddit Autoposts (Up to 10 Autopost Configurations)

Webhook Support for RSS and Fun Fact

Multi-Guild Support (Read More Below)

# Build the bot and self-host

Through Testing, this bot can run in Multiple Guilds. This was a painfully slow process to implement, mainly because I needed to figure out how to store and recall values based on guild_id and other columns. This was a bit of a nightmare at first but is now fully set. Most Plugins now use the database, instead of a hardcoded value in a config file, which cannot be changed without restarting the bot. This new handling is so much nicer. Anyways, to run this bot on your system, here are the steps:

1.) Clone the Project using `git clone https://github.com/Ficouts/PixelBot.git`

2.) Make Sure You Have Node, and MySQL Installed!!

3.) Navigate to the Root of the Project Directory

4.) Install the Required Dependencies to Allow the Bot To Run using `npm install` in the root directory (Make sure if you are using Windows to run the bot, you install Visual Studio C++ Build Tools if you are on Linux, you must install the C Compiler. Run `sudo apt-get install build-essential` for Ubuntu and Debian based systems. Run `sudo dnf install make automake gcc gcc-c++ kernel-devel` for Red Hat and Fedora Based Systems. If you don't install the VS C++ Build Tools (Windows), or the C Compiler (Linux), npm will error out, as the better-sqlite3 package requires these build tools

5.) Look For The config.temp.js File in the src/config folder, and Edit it to change your Bot Token, and the Plugins Paths (If you are looking to use any plugins)

6.) Look For The webconfig.temp.js File in the src/config folder, and Edit it to change your MySQL Credentials

7.) Once You Are Done Editing The File, Save and Rename the File from config.temp.js to config.js, and webconfig.temp.js to webconfig.js

8.) Finally, go back to the root of the project and run `node .`

# How to Keep Your Bot Online 24/7 (if you have access to the Server by SSH)

The Nice Thing is that This Bot can also be kept online. To keep your Bot Online 24/7, follow these steps

1.) Make sure you followed all but the 7th step from the previous section. We will get to running later

2.) Make sure you also have GNU Screen Installed. It should be preinstalled on any Linux System

2a.) In the case of Debian, Ubuntu, or Linux Mint and its derivatives, you can execute the following command:
      `sudo apt install screen`
      NOTE: THIS SHOULD ALREADY BE INSTALLED, BUT ITS A GOOD IDEA TO CHECK FOR UPDATES
      
2b.) If you are using CentOS 7, you can install it using the following:
      `sudo yum install screen`
      
3.) Once that's installed, you should also be in the project's root directory. If you aren't, navigate there, as this would make it much simpler and faster than if you were running a Screen Session and having to navigate to the directory anyways.

4.) Once in that directory, run `screen -S pixelbot` to start a Brand New Session. From there, run `node .` in the session to run the bot.

5.) To Back out of the session and leave it running in the background, you can do `Ctrl + A` then `d` to back out the session. If you ever need to get back into the session for whatever reason, you can run `screen -R pixelbot` to get back into that session. Then, to get out of it again, you can do `Ctrl + A` and then `d` to back out of the session.

# License

This bot is licensed under GPL version 3.
