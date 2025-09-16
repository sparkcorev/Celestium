const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // You can set PORT in .env

// Health check endpoint
app.get('/', (req, res) => {
    res.send('Bot is running!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});


require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./levels.db');

// Initialize database tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        last_message INTEGER DEFAULT 0,
        warnings INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reaction_roles (
        message_id TEXT,
        emoji TEXT,
        role_id TEXT,
        PRIMARY KEY (message_id, emoji)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS giveaways (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT,
        channel_id TEXT,
        prize TEXT,
        winner_count INTEGER,
        end_time INTEGER,
        host_id TEXT,
        ended BOOLEAN DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS automod (
        guild_id TEXT PRIMARY KEY,
        anti_spam BOOLEAN DEFAULT 0,
        auto_delete_links BOOLEAN DEFAULT 0,
        word_filter BOOLEAN DEFAULT 0,
        max_mentions INTEGER DEFAULT 5
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        channel_id TEXT,
        message TEXT,
        remind_time INTEGER
    )`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});

const commands = [
    // Existing commands
    new SlashCommandBuilder()
        .setName('test')
        .setDescription('Test welcome or goodbye embed')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Choose embed type')
                .setRequired(true)
                .addChoices(
                    { name: 'welcome', value: 'welcome' },
                    { name: 'goodbye', value: 'goodbye' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display server information'),

    new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display user information')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to get info about')
                .setRequired(false)),

    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency'),

    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Check your or someone else\'s level')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check rank for')
                .setRequired(false)),

    new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show server leaderboard'),

    new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Setup reaction roles')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('Message ID to add reactions to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Emoji for the reaction')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to assign')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    new SlashCommandBuilder()
        .setName('createreactionpanel')
        .setDescription('Create a reaction role panel')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Panel title')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Panel description')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for ban')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Timeout duration in minutes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set channel slowmode')
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Slowmode in seconds (0 to disable)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Poll question')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Poll options separated by | (max 10)')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Show user avatar')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to show avatar for')
                .setRequired(false)),

    new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot say something')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    // NEW COMMANDS
    new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for warning')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Check warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check warnings for')
                .setRequired(false)),

    new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Start a giveaway')
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 1h, 30m, 2d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('prize')
                .setDescription('Prize description')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('winners')
                .setDescription('Number of winners')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(20))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time (e.g., 1h, 30m, 2d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Reminder message')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the magic 8-ball a question')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Your question')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin'),

    new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Roll dice')
        .addIntegerOption(option =>
            option.setName('sides')
                .setDescription('Number of sides (default: 6)')
                .setRequired(false)
                .setMinValue(2)
                .setMaxValue(100)),

    new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Get weather information')
        .addStringOption(option =>
            option.setName('location')
                .setDescription('City name')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configure auto moderation')
        .addBooleanOption(option =>
            option.setName('anti_spam')
                .setDescription('Enable anti-spam')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('auto_delete_links')
                .setDescription('Auto delete links')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('word_filter')
                .setDescription('Enable word filter')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('max_mentions')
                .setDescription('Maximum mentions per message')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(20))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Get a random joke'),

    new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Get a random meme'),

    new SlashCommandBuilder()
        .setName('activity')
        .setDescription('Start a voice channel activity')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Voice channel')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('activity')
                .setDescription('Activity type')
                .setRequired(true)
                .addChoices(
                    { name: 'YouTube Together', value: 'youtube' },
                    { name: 'Poker Night', value: 'poker' },
                    { name: 'Betrayal.io', value: 'betrayal' },
                    { name: 'Fishington.io', value: 'fishing' }
                )),

    new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Lock or unlock the channel')
        .addBooleanOption(option =>
            option.setName('lock')
                .setDescription('True to lock, false to unlock')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for lockdown')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('suggestion')
        .setDescription('Submit a suggestion')
        .addStringOption(option =>
            option.setName('suggestion')
                .setDescription('Your suggestion')
                .setRequired(true))
];

client.once('ready', async () => {
    console.log(`${client.user.tag} is online!`);

    const rest = new REST().setToken(process.env.BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Slash commands registered!');
    } catch (error) {
        console.error(error);
    }

    // Start reminder checker
    setInterval(checkReminders, 60000); // Check every minute
    setInterval(checkGiveaways, 30000); // Check giveaways every 30 seconds
});

// Utility functions
function createWelcomeEmbed(member, guild) {
    return new EmbedBuilder()
        .setTitle(`♥ .｡oO Welcome to ${guild.name} Oo｡. ♥`)
        .setDescription(
            `︵‿︵‿୨୧‿︵‿︵
✧ Hey ${member}, we're so glad you joined us! ✧
⭑ Check out these channels first! ⭑

☾ .｡ <#1417099517353791535> ｡. ♛
✿ .｡ <#1417099517999714398> ｡. ꒰
✧ .｡ <#1417099517353791536> ｡. ⌗

︵‿︵‿୨୧‿︵‿︵
♡ Thank you for joining us ♡`
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setImage('https://i.postimg.cc/5tdGs6YH/image.png')
        .setColor('#FFB6C1')
        .setFooter({ text: `You are the ${guild.memberCount}th member • ${new Date().toLocaleString()}` });
}


function createLevelUpEmbed(user, level, xp) {
    return new EmbedBuilder()
        .setTitle('🎉 LEVEL UP!')
        .setDescription(`︵‿︵‿୨♡୧‿︵‿︵\n**${user.username}** just reached **Level ${level}**! 🌟\n**Total XP:** ${xp}\n︵‿︵‿୨♡୧‿︵‿︵`)
        .setThumbnail(user.displayAvatarURL())
        .setColor('#FFD700')
        .setFooter({ text: `Keep chatting to level up more! • ${new Date().toLocaleString()}` });
}

function createGoodbyeEmbed(user, guild) {
    return new EmbedBuilder()
        .setTitle('💔 ɢᴏᴏᴅʙʏᴇ')
        .setDescription(`︵‿︵‿୨♡୧‿︵‿︵\n😢 ${user.username} just left us...\nWe'll miss you in **${guild.name}**\n︵‿︵‿୨♡୧‿︵‿︵`)
        .setThumbnail(user.displayAvatarURL())
        .setImage('https://i.postimg.cc/L5GW1Xj3/image.png')
        .setColor('#2F3136')
        .setFooter({ text: `Now we have ${guild.memberCount} members • ${new Date().toLocaleString()}` });
}

function getXPForLevel(level) {
    return level * 100;
}

function getLevelFromXP(xp) {
    return Math.floor(xp / 100) + 1;
}

function parseDuration(duration) {
    const regex = /(\d+)([smhd])/;
    const match = duration.match(regex);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

function checkReminders() {
    const now = Date.now();
    db.all('SELECT * FROM reminders WHERE remind_time <= ?', [now], async (err, rows) => {
        if (err || !rows) return;

        for (const reminder of rows) {
            try {
                const channel = client.channels.cache.get(reminder.channel_id);
                const user = await client.users.fetch(reminder.user_id);

                if (channel && user) {
                    const embed = new EmbedBuilder()
                        .setTitle('⏰ Reminder')
                        .setDescription(`${user}, you asked me to remind you:\n\n${reminder.message}`)
                        .setColor('#FFB6C1')
                        .setTimestamp();

                    await channel.send({ embeds: [embed] });
                }

                db.run('DELETE FROM reminders WHERE id = ?', [reminder.id]);
            } catch (error) {
                console.error('Error with reminder:', error);
            }
        }
    });
}

function checkGiveaways() {
    const now = Date.now();
    db.all('SELECT * FROM giveaways WHERE end_time <= ? AND ended = 0', [now], async (err, rows) => {
        if (err || !rows) return;

        for (const giveaway of rows) {
            try {
                const channel = client.channels.cache.get(giveaway.channel_id);
                const message = await channel.messages.fetch(giveaway.message_id);

                const reaction = message.reactions.cache.get('🎉');
                if (!reaction) continue;

                const users = await reaction.users.fetch();
                const participants = users.filter(user => !user.bot);

                if (participants.size === 0) {
                    await channel.send('No valid participants for the giveaway!');
                    continue;
                }

                const winners = participants.random(Math.min(giveaway.winner_count, participants.size));
                const winnerList = Array.isArray(winners) ? winners : [winners];

                const embed = new EmbedBuilder()
                    .setTitle('🎉 Giveaway Ended!')
                    .setDescription(`**Prize:** ${giveaway.prize}\n**Winner(s):** ${winnerList.map(w => `<@${w.id}>`).join(', ')}`)
                    .setColor('#FFD700')
                    .setTimestamp();

                await channel.send({ content: winnerList.map(w => `<@${w.id}>`).join(' '), embeds: [embed] });

                db.run('UPDATE giveaways SET ended = 1 WHERE id = ?', [giveaway.id]);
            } catch (error) {
                console.error('Error ending giveaway:', error);
            }
        }
    });
}

// Event handlers
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Auto moderation
    db.get('SELECT * FROM automod WHERE guild_id = ?', [message.guild.id], async (err, automod) => {
        if (automod && automod.anti_spam) {
            // Simple spam detection
            const userMessages = message.channel.messages.cache.filter(
                msg => msg.author.id === message.author.id &&
                    Date.now() - msg.createdTimestamp < 5000
            );

            if (userMessages.size > 5) {
                await message.delete();
                const warning = await message.channel.send(`${message.author}, please slow down with your messages!`);
                setTimeout(() => warning.delete(), 5000);
                return;
            }
        }

        if (automod && automod.auto_delete_links &&
            (message.content.includes('http://') || message.content.includes('https://'))) {
            const member = message.guild.members.cache.get(message.author.id);
            if (!member.permissions.has('ManageMessages')) {
                await message.delete();
                const warning = await message.channel.send(`${message.author}, links are not allowed in this server!`);
                setTimeout(() => warning.delete(), 5000);
                return;
            }
        }

        if (automod && automod.max_mentions) {
            const mentions = message.mentions.users.size + message.mentions.roles.size;
            if (mentions > automod.max_mentions) {
                await message.delete();
                const warning = await message.channel.send(`${message.author}, too many mentions in one message!`);
                setTimeout(() => warning.delete(), 5000);
                return;
            }
        }
    });

    // Level system
    const userId = message.author.id;
    const now = Date.now();

    db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, row) => {
        if (err) return;

        if (!row) {
            db.run('INSERT INTO users (id, xp, level, last_message) VALUES (?, ?, ?, ?)', [userId, 0, 1, now]);
            return;
        }

        if (now - row.last_message < 60000) return;

        const xpGain = Math.floor(Math.random() * 15) + 15;
        const newXP = row.xp + xpGain;
        const newLevel = getLevelFromXP(newXP);

        db.run('UPDATE users SET xp = ?, level = ?, last_message = ? WHERE id = ?', [newXP, newLevel, now, userId]);

        if (newLevel > row.level) {
            const levelChannel = client.channels.cache.get('1417099517999714396');
            if (levelChannel) {
                const embed = createLevelUpEmbed(message.author, newLevel, newXP);
                await levelChannel.send({ embeds: [embed] });
            }
        }
    });
});

client.on('guildMemberAdd', async member => {
    const welcomeChannel = client.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
    if (welcomeChannel) {
        const embed = createWelcomeEmbed(member, member.guild);
        await welcomeChannel.send({ embeds: [embed] });
    }

    const chatChannel = client.channels.cache.get('1417099517999714398');
    if (chatChannel) {
        await chatChannel.send(`Hey ${member}! 👋 Welcome to the server! Feel free to start chatting and introduce yourself! 💬✨`);
    }
});

client.on('guildMemberRemove', async member => {
    const channel = client.channels.cache.get(process.env.GOODBYE_CHANNEL_ID);
    if (channel) {
        const embed = createGoodbyeEmbed(member.user, member.guild);
        await channel.send({ embeds: [embed] });
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            return;
        }
    }

    const emoji = reaction.emoji.name || reaction.emoji.id;

    db.get('SELECT role_id FROM reaction_roles WHERE message_id = ? AND emoji = ?',
        [reaction.message.id, emoji], async (err, row) => {
            if (err || !row) return;

            const guild = reaction.message.guild;
            const member = guild.members.cache.get(user.id);
            const role = guild.roles.cache.get(row.role_id);

            if (member && role) {
                await member.roles.add(role);
            }
        });
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            return;
        }
    }

    const emoji = reaction.emoji.name || reaction.emoji.id;

    db.get('SELECT role_id FROM reaction_roles WHERE message_id = ? AND emoji = ?',
        [reaction.message.id, emoji], async (err, row) => {
            if (err || !row) return;

            const guild = reaction.message.guild;
            const member = guild.members.cache.get(user.id);
            const role = guild.roles.cache.get(row.role_id);

            if (member && role) {
                await member.roles.remove(role);
            }
        });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Existing commands with fixes
    if (interaction.commandName === 'test') {
        const type = interaction.options.getString('type');

        if (type === 'welcome') {
            const embed = createWelcomeEmbed(interaction.member, interaction.guild);
            await interaction.reply({ embeds: [embed] });
        } else if (type === 'goodbye') {
            const embed = createGoodbyeEmbed(interaction.user, interaction.guild);
            await interaction.reply({ embeds: [embed] });
        }
    }

    if (interaction.commandName === 'ping') {
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setDescription(`Bot Latency: ${Date.now() - interaction.createdTimestamp}ms\nAPI Latency: ${client.ws.ping}ms`)
            .setColor('#00FF00');
        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'serverinfo') {
        const guild = interaction.guild;
        const embed = new EmbedBuilder()
            .setTitle(`📊 ${guild.name} Server Info`)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: '💬 Channels', value: `${guild.channels.cache.size}`, inline: true },
                { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
                { name: '🔒 Verification', value: `${guild.verificationLevel}`, inline: true }
            )
            .setColor('#5865F2');
        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'userinfo') {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        const embed = new EmbedBuilder()
            .setTitle(`👤 ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: '🆔 ID', value: user.id, inline: true },
                { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true },
                { name: '📥 Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Not in server', inline: true }
            )
            .setColor('#FFB6C1');
        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'clear') {
        const amount = interaction.options.getInteger('amount');

        try {
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            await interaction.channel.bulkDelete(messages);

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Messages Cleared')
                .setDescription(`Successfully deleted ${amount} messages!`)
                .setColor('#00FF00');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: 'Error clearing messages!', ephemeral: true });
        }
    }

    if (interaction.commandName === 'rank') {
        const user = interaction.options.getUser('user') || interaction.user;

        db.get('SELECT * FROM users WHERE id = ?', [user.id], async (err, row) => {
            if (err || !row) {
                await interaction.reply('No data found for this user!');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`📊 ${user.username}'s Rank`)
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: '🎯 Level', value: `${row.level}`, inline: true },
                    { name: '⭐ XP', value: `${row.xp}`, inline: true },
                    { name: '📈 Next Level', value: `${getXPForLevel(row.level + 1) - row.xp} XP needed`, inline: true }
                )
                .setColor('#FFB6C1');
            await interaction.reply({ embeds: [embed] });
        });
    }

    if (interaction.commandName === 'leaderboard') {
        db.all('SELECT * FROM users ORDER BY xp DESC LIMIT 10', async (err, rows) => {
            if (err || !rows.length) {
                await interaction.reply('No leaderboard data available!');
                return;
            }

            let description = '';
            for (let i = 0; i < rows.length; i++) {
                const user = await client.users.fetch(rows[i].id).catch(() => null);
                if (user) {
                    description += `**${i + 1}.** ${user.username} - Level ${rows[i].level} (${rows[i].xp} XP)\n`;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('🏆 Server Leaderboard')
                .setDescription(description)
                .setColor('#FFD700');
            await interaction.reply({ embeds: [embed] });
        });
    }

    if (interaction.commandName === 'reactionrole') {
        const messageId = interaction.options.getString('message_id');
        const emoji = interaction.options.getString('emoji');
        const role = interaction.options.getRole('role');

        try {
            const message = await interaction.channel.messages.fetch(messageId);
            await message.react(emoji);

            db.run('INSERT OR REPLACE INTO reaction_roles (message_id, emoji, role_id) VALUES (?, ?, ?)',
                [messageId, emoji, role.id]);

            await interaction.reply(`Reaction role setup! React with ${emoji} to get ${role.name}`);
        } catch (error) {
            await interaction.reply('Error setting up reaction role!');
        }
    }

    if (interaction.commandName === 'createreactionpanel') {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor('#FFB6C1')
            .setFooter({ text: 'React below to get roles!' });

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });
        await interaction.followUp({ content: `Panel created! Message ID: ${message.id}`, ephemeral: true });
    }

    if (interaction.commandName === 'kick') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) {
            await interaction.reply('User not found in server!');
            return;
        }

        try {
            await member.kick(reason);
            const embed = new EmbedBuilder()
                .setTitle('👢 Member Kicked')
                .setDescription(`**${user.username}** has been kicked\n**Reason:** ${reason}`)
                .setColor('#FF6B6B');
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply('Failed to kick member!');
        }
    }

    if (interaction.commandName === 'ban') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            await interaction.guild.members.ban(user, { reason });
            const embed = new EmbedBuilder()
                .setTitle('🔨 Member Banned')
                .setDescription(`**${user.username}** has been banned\n**Reason:** ${reason}`)
                .setColor('#FF0000');
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply('Failed to ban member!');
        }
    }

    if (interaction.commandName === 'timeout') {
        const user = interaction.options.getUser('user');
        const minutes = interaction.options.getInteger('minutes');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) {
            await interaction.reply('User not found in server!');
            return;
        }

        try {
            await member.timeout(minutes * 60 * 1000, reason);
            const embed = new EmbedBuilder()
                .setTitle('⏰ Member Timed Out')
                .setDescription(`**${user.username}** has been timed out for **${minutes} minutes**\n**Reason:** ${reason}`)
                .setColor('#FFA500');
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply('Failed to timeout member!');
        }
    }

    if (interaction.commandName === 'slowmode') {
        const seconds = interaction.options.getInteger('seconds');

        try {
            await interaction.channel.setRateLimitPerUser(seconds);
            const embed = new EmbedBuilder()
                .setTitle('🐌 Slowmode Updated')
                .setDescription(seconds === 0 ? 'Slowmode disabled' : `Slowmode set to **${seconds} seconds**`)
                .setColor('#4CAF50');
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply('Failed to set slowmode!');
        }
    }

    if (interaction.commandName === 'poll') {
        const question = interaction.options.getString('question');
        const options = interaction.options.getString('options').split('|').slice(0, 10);

        if (options.length < 2) {
            await interaction.reply('Poll needs at least 2 options!');
            return;
        }

        const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

        let description = '';
        for (let i = 0; i < options.length; i++) {
            description += `${reactions[i]} ${options[i].trim()}\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle(`📊 ${question}`)
            .setDescription(description)
            .setColor('#4CAF50')
            .setFooter({ text: 'React to vote!' });

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });

        for (let i = 0; i < options.length; i++) {
            await message.react(reactions[i]);
        }
    }

    if (interaction.commandName === 'avatar') {
        const user = interaction.options.getUser('user') || interaction.user;

        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Avatar`)
            .setImage(user.displayAvatarURL({ size: 512 }))
            .setColor('#FFB6C1');
        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'say') {
        const message = interaction.options.getString('message');
        await interaction.channel.send(message);
        await interaction.reply({ content: 'Message sent!', ephemeral: true });
    }

    // NEW COMMAND HANDLERS
    if (interaction.commandName === 'warn') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        db.get('SELECT warnings FROM users WHERE id = ?', [user.id], (err, row) => {
            const currentWarnings = row ? row.warnings : 0;
            const newWarnings = currentWarnings + 1;

            db.run('INSERT OR REPLACE INTO users (id, warnings) VALUES (?, ?)', [user.id, newWarnings]);

            const embed = new EmbedBuilder()
                .setTitle('⚠️ User Warned')
                .setDescription(`**${user.username}** has been warned\n**Reason:** ${reason}\n**Total Warnings:** ${newWarnings}`)
                .setColor('#FFA500');

            interaction.reply({ embeds: [embed] });
        });
    }

    if (interaction.commandName === 'warnings') {
        const user = interaction.options.getUser('user') || interaction.user;

        db.get('SELECT warnings FROM users WHERE id = ?', [user.id], async (err, row) => {
            const warnings = row ? row.warnings : 0;

            const embed = new EmbedBuilder()
                .setTitle(`⚠️ ${user.username}'s Warnings`)
                .setDescription(`**Total Warnings:** ${warnings}`)
                .setThumbnail(user.displayAvatarURL())
                .setColor('#FFA500');

            await interaction.reply({ embeds: [embed] });
        });
    }

    if (interaction.commandName === 'giveaway') {
        const duration = interaction.options.getString('duration');
        const prize = interaction.options.getString('prize');
        const winners = interaction.options.getInteger('winners') || 1;

        const durationMs = parseDuration(duration);
        if (!durationMs) {
            await interaction.reply('Invalid duration format! Use format like: 1h, 30m, 2d');
            return;
        }

        const endTime = Date.now() + durationMs;

        const embed = new EmbedBuilder()
            .setTitle('🎉 GIVEAWAY! 🎉')
            .setDescription(`**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R>\n\nReact with 🎉 to enter!`)
            .setColor('#FFD700')
            .setFooter({ text: `Hosted by ${interaction.user.username}` });

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });
        await message.react('🎉');

        db.run('INSERT INTO giveaways (message_id, channel_id, prize, winner_count, end_time, host_id) VALUES (?, ?, ?, ?, ?, ?)',
            [message.id, interaction.channel.id, prize, winners, endTime, interaction.user.id]);
    }

    if (interaction.commandName === 'remind') {
        const timeStr = interaction.options.getString('time');
        const reminderMessage = interaction.options.getString('message');

        const timeMs = parseDuration(timeStr);
        if (!timeMs) {
            await interaction.reply('Invalid time format! Use format like: 1h, 30m, 2d');
            return;
        }

        const remindTime = Date.now() + timeMs;

        db.run('INSERT INTO reminders (user_id, channel_id, message, remind_time) VALUES (?, ?, ?, ?)',
            [interaction.user.id, interaction.channel.id, reminderMessage, remindTime]);

        const embed = new EmbedBuilder()
            .setTitle('⏰ Reminder Set')
            .setDescription(`I'll remind you about: **${reminderMessage}**\nIn: **${timeStr}** (<t:${Math.floor(remindTime / 1000)}:R>)`)
            .setColor('#4CAF50');

        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === '8ball') {
        const question = interaction.options.getString('question');
        const responses = [
            'It is certain', 'Without a doubt', 'Yes definitely', 'You may rely on it',
            'As I see it, yes', 'Most likely', 'Outlook good', 'Yes', 'Signs point to yes',
            'Reply hazy, try again', 'Ask again later', 'Better not tell you now',
            'Cannot predict now', 'Concentrate and ask again',
            "Don't count on it", 'My reply is no', 'My sources say no',
            'Outlook not so good', 'Very doubtful'
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];

        const embed = new EmbedBuilder()
            .setTitle('🎱 Magic 8-Ball')
            .addFields(
                { name: 'Question', value: question },
                { name: 'Answer', value: response }
            )
            .setColor('#8B4513');

        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'coinflip') {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';

        const embed = new EmbedBuilder()
            .setTitle('🪙 Coin Flip')
            .setDescription(`The coin landed on **${result}**!`)
            .setColor('#FFD700');

        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'dice') {
        const sides = interaction.options.getInteger('sides') || 6;
        const result = Math.floor(Math.random() * sides) + 1;

        const embed = new EmbedBuilder()
            .setTitle('🎲 Dice Roll')
            .setDescription(`You rolled a **${result}** on a ${sides}-sided die!`)
            .setColor('#FF6B6B');

        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'automod') {
        const antiSpam = interaction.options.getBoolean('anti_spam');
        const autoDeleteLinks = interaction.options.getBoolean('auto_delete_links');
        const wordFilter = interaction.options.getBoolean('word_filter');
        const maxMentions = interaction.options.getInteger('max_mentions');

        let updates = [];
        let params = [];

        if (antiSpam !== null) {
            updates.push('anti_spam = ?');
            params.push(antiSpam ? 1 : 0);
        }
        if (autoDeleteLinks !== null) {
            updates.push('auto_delete_links = ?');
            params.push(autoDeleteLinks ? 1 : 0);
        }
        if (wordFilter !== null) {
            updates.push('word_filter = ?');
            params.push(wordFilter ? 1 : 0);
        }
        if (maxMentions !== null) {
            updates.push('max_mentions = ?');
            params.push(maxMentions);
        }

        if (updates.length === 0) {
            await interaction.reply('No settings provided to update!');
            return;
        }

        params.push(interaction.guild.id);

        const query = `INSERT OR REPLACE INTO automod (guild_id, ${updates.join(', ').replace(/ = \?/g, '')}) VALUES (?, ${params.slice(0, -1).map(() => '?').join(', ')})`;

        db.run(query, params, (err) => {
            if (err) {
                interaction.reply('Error updating automod settings!');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('⚙️ Automod Settings Updated')
                .setDescription('Auto-moderation settings have been updated successfully!')
                .setColor('#4CAF50');

            interaction.reply({ embeds: [embed] });
        });
    }

    if (interaction.commandName === 'joke') {
        const jokes = [
            "Why don't scientists trust atoms? Because they make up everything!",
            "Why did the scarecrow win an award? He was outstanding in his field!",
            "Why don't eggs tell jokes? They'd crack each other up!",
            "What do you call a fake noodle? An impasta!",
            "Why did the math book look so sad? Because of all of its problems!",
            "What do you call a bear with no teeth? A gummy bear!",
            "Why can't a bicycle stand up by itself? It's two tired!",
            "What do you call a sleeping bull? A bulldozer!",
            "Why did the coffee file a police report? It got mugged!",
            "What's orange and sounds like a parrot? A carrot!"
        ];

        const joke = jokes[Math.floor(Math.random() * jokes.length)];

        const embed = new EmbedBuilder()
            .setTitle('😄 Random Joke')
            .setDescription(joke)
            .setColor('#FFB6C1');

        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'lockdown') {
        const lock = interaction.options.getBoolean('lock');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            const everyone = interaction.guild.roles.everyone;

            if (lock) {
                await interaction.channel.permissionOverwrites.edit(everyone, {
                    SendMessages: false
                });

                const embed = new EmbedBuilder()
                    .setTitle('🔒 Channel Locked')
                    .setDescription(`This channel has been locked.\n**Reason:** ${reason}`)
                    .setColor('#FF0000');

                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.channel.permissionOverwrites.edit(everyone, {
                    SendMessages: null
                });

                const embed = new EmbedBuilder()
                    .setTitle('🔓 Channel Unlocked')
                    .setDescription('This channel has been unlocked.')
                    .setColor('#00FF00');

                await interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            await interaction.reply('Error changing channel lockdown status!');
        }
    }

    if (interaction.commandName === 'suggestion') {
        const suggestion = interaction.options.getString('suggestion');

        const embed = new EmbedBuilder()
            .setTitle('💡 New Suggestion')
            .setDescription(suggestion)
            .addFields({ name: 'Suggested by', value: `${interaction.user}`, inline: true })
            .setColor('#4CAF50')
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('upvote')
                    .setLabel('👍 Upvote')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('downvote')
                    .setLabel('👎 Downvote')
                    .setStyle(ButtonStyle.Danger)
            );

        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
        await message.react('👍');
        await message.react('👎');
    }
});

client.login(process.env.BOT_TOKEN);