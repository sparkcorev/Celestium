// Complete Discord Bot - Production Ready
const { Client, GatewayIntentBits, PartialType, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ],
    partials: [
        PartialType.Message,
        PartialType.Channel,
        PartialType.Reaction
    ]
});

// Initialize SQLite database
const db = new sqlite3.Database('./bot.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Create collections
client.commands = new Collection();
client.cooldowns = new Collection();

// Database setup
db.serialize(() => {
    // Core tables
    db.run(`CREATE TABLE IF NOT EXISTS guilds (
        guild_id TEXT PRIMARY KEY,
        prefix TEXT DEFAULT '!',
        setup_completed BOOLEAN DEFAULT 0
    )`);

    // Music System
    db.run(`CREATE TABLE IF NOT EXISTS music_settings (
        guild_id TEXT PRIMARY KEY,
        dj_role_id TEXT,
        music_channel_id TEXT,
        max_queue_size INTEGER DEFAULT 50,
        default_volume INTEGER DEFAULT 50
    )`);

    // Server Configuration
    db.run(`CREATE TABLE IF NOT EXISTS server_config (
        guild_id TEXT PRIMARY KEY,
        prefix TEXT DEFAULT '!',
        welcome_channel_id TEXT,
        goodbye_channel_id TEXT,
        log_channel_id TEXT,
        mod_log_channel_id TEXT,
        mute_role_id TEXT,
        auto_role_id TEXT
    )`);

    // Moderation Cases
    db.run(`CREATE TABLE IF NOT EXISTS mod_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        case_number INTEGER,
        user_id TEXT,
        moderator_id TEXT,
        action TEXT,
        reason TEXT,
        duration INTEGER,
        timestamp INTEGER,
        active BOOLEAN DEFAULT 1
    )`);

    // Starboard System
    db.run(`CREATE TABLE IF NOT EXISTS starboard (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT,
        threshold INTEGER DEFAULT 3,
        emoji TEXT DEFAULT '⭐'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS starred_messages (
        message_id TEXT PRIMARY KEY,
        guild_id TEXT,
        channel_id TEXT,
        author_id TEXT,
        star_count INTEGER DEFAULT 0,
        starboard_message_id TEXT
    )`);

    // Welcome System
    db.run(`CREATE TABLE IF NOT EXISTS welcome_config (
        guild_id TEXT PRIMARY KEY,
        welcome_enabled BOOLEAN DEFAULT 0,
        goodbye_enabled BOOLEAN DEFAULT 0,
        welcome_message TEXT,
        goodbye_message TEXT,
        welcome_embed BOOLEAN DEFAULT 1,
        dm_welcome BOOLEAN DEFAULT 0
    )`);

    // Anti-Raid System
    db.run(`CREATE TABLE IF NOT EXISTS antiraid (
        guild_id TEXT PRIMARY KEY,
        enabled BOOLEAN DEFAULT 0,
        join_threshold INTEGER DEFAULT 10,
        time_window INTEGER DEFAULT 60,
        action TEXT DEFAULT 'kick'
    )`);

    // Temporary Actions
    db.run(`CREATE TABLE IF NOT EXISTS temp_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        user_id TEXT,
        action_type TEXT,
        end_time INTEGER,
        moderator_id TEXT,
        reason TEXT
    )`);

    // Voice Channel Management
    db.run(`CREATE TABLE IF NOT EXISTS voice_config (
        guild_id TEXT PRIMARY KEY,
        create_channel_id TEXT,
        category_id TEXT,
        channel_limit INTEGER DEFAULT 99
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS temp_channels (
        channel_id TEXT PRIMARY KEY,
        owner_id TEXT,
        guild_id TEXT
    )`);

    // Statistics
    db.run(`CREATE TABLE IF NOT EXISTS stats (
        guild_id TEXT,
        date TEXT,
        messages INTEGER DEFAULT 0,
        joins INTEGER DEFAULT 0,
        leaves INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, date)
    )`);

    // Ticket System
    db.run(`CREATE TABLE IF NOT EXISTS ticket_config (
        guild_id TEXT PRIMARY KEY,
        category_id TEXT,
        support_role_id TEXT,
        transcript_channel_id TEXT,
        ticket_counter INTEGER DEFAULT 0,
        max_tickets_per_user INTEGER DEFAULT 3,
        auto_close_inactive INTEGER DEFAULT 168
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tickets (
        ticket_id TEXT PRIMARY KEY,
        guild_id TEXT,
        channel_id TEXT,
        user_id TEXT,
        status TEXT DEFAULT 'open',
        created_at INTEGER,
        closed_at INTEGER,
        closer_id TEXT,
        claim_user_id TEXT,
        priority TEXT DEFAULT 'normal'
    )`);

    // Reaction Roles
    db.run(`CREATE TABLE IF NOT EXISTS reaction_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        message_id TEXT,
        channel_id TEXT,
        emoji TEXT,
        role_id TEXT,
        type TEXT DEFAULT 'toggle'
    )`);

    // Auto Moderation
    db.run(`CREATE TABLE IF NOT EXISTS automod_config (
        guild_id TEXT PRIMARY KEY,
        anti_spam_enabled BOOLEAN DEFAULT 0,
        anti_spam_limit INTEGER DEFAULT 5,
        anti_spam_time INTEGER DEFAULT 5,
        anti_link_enabled BOOLEAN DEFAULT 0,
        allowed_domains TEXT DEFAULT '[]',
        anti_caps_enabled BOOLEAN DEFAULT 0,
        caps_threshold INTEGER DEFAULT 70,
        anti_invite_enabled BOOLEAN DEFAULT 0,
        punishment_type TEXT DEFAULT 'timeout',
        punishment_duration INTEGER DEFAULT 300
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS automod_violations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        user_id TEXT,
        violation_type TEXT,
        count INTEGER DEFAULT 1,
        last_violation INTEGER
    )`);

    // Leveling System
    db.run(`CREATE TABLE IF NOT EXISTS level_config (
        guild_id TEXT PRIMARY KEY,
        enabled BOOLEAN DEFAULT 0,
        announce_channel_id TEXT,
        announce_levelup BOOLEAN DEFAULT 1,
        xp_per_message INTEGER DEFAULT 15,
        cooldown INTEGER DEFAULT 60,
        level_roles TEXT DEFAULT '[]'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_levels (
        guild_id TEXT,
        user_id TEXT,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 0,
        total_messages INTEGER DEFAULT 0,
        last_xp_gain INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
    )`);

    // AFK System
    db.run(`CREATE TABLE IF NOT EXISTS afk_users (
        guild_id TEXT,
        user_id TEXT,
        reason TEXT,
        timestamp INTEGER,
        PRIMARY KEY (guild_id, user_id)
    )`);

    console.log('Database tables initialized');
});

// Essential Commands
const commands = [
    // Ping command
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency'),

    // Server info
    new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display server information'),

    // User info
    new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display user information')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to get info about')),

    // Setup command
    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup bot features')
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('Setup welcome system')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Welcome channel')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('Setup logging')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Log channel')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // Moderation commands
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kick'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for ban'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 10m, 1h)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for timeout'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

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

    // AFK command
    new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set AFK status')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('AFK reason')),

    // Level commands
    new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Check user rank')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check')),

    new SlashCommandBuilder()
        .setName('levels')
        .setDescription('Leveling system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup leveling')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable leveling')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('Show leaderboard'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
];

// Event: Bot ready
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} is online!`);
    
    // Register slash commands
    try {
        console.log('Started refreshing application (/) commands.');
        
        await client.application.commands.set(commands);
        
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
    
    // Set activity
    client.user.setActivity('with Discord.js', { type: 'PLAYING' });
});

// Event: Guild join
client.on('guildCreate', guild => {
    console.log(`Joined guild: ${guild.name} (${guild.id})`);
    
    // Initialize guild in database
    db.run('INSERT OR IGNORE INTO guilds (guild_id) VALUES (?)', [guild.id]);
    db.run('INSERT OR IGNORE INTO server_config (guild_id) VALUES (?)', [guild.id]);
});

// Event: Member join
client.on('guildMemberAdd', async member => {
    const guild = member.guild;
    
    // Update statistics
    const today = new Date().toISOString().split('T')[0];
    db.run(`INSERT OR IGNORE INTO stats (guild_id, date, joins) VALUES (?, ?, 0)`, [guild.id, today]);
    db.run(`UPDATE stats SET joins = joins + 1 WHERE guild_id = ? AND date = ?`, [guild.id, today]);
    
    // Welcome system
    db.get('SELECT * FROM welcome_config WHERE guild_id = ? AND welcome_enabled = 1', [guild.id], async (err, config) => {
        if (!config) return;
        
        const channel = guild.channels.cache.get(config.welcome_channel_id);
        if (!channel) return;
        
        try {
            const welcomeMessage = config.welcome_message || 'Welcome to the server, {user}!';
            const message = welcomeMessage
                .replace('{user}', member.toString())
                .replace('{server}', guild.name)
                .replace('{username}', member.user.username);
            
            if (config.welcome_embed) {
                const embed = new EmbedBuilder()
                    .setTitle('Welcome!')
                    .setDescription(message)
                    .setColor('#00FF00')
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp();
                
                await channel.send({ embeds: [embed] });
            } else {
                await channel.send(message);
            }
        } catch (error) {
            console.error('Error sending welcome message:', error);
        }
    });
});

// Event: Member leave
client.on('guildMemberRemove', async member => {
    // Update statistics
    const today = new Date().toISOString().split('T')[0];
    db.run(`INSERT OR IGNORE INTO stats (guild_id, date, leaves) VALUES (?, ?, 0)`, [member.guild.id, today]);
    db.run(`UPDATE stats SET leaves = leaves + 1 WHERE guild_id = ? AND date = ?`, [member.guild.id, today]);
});

// Event: Message create
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;
    
    // Update message statistics
    const today = new Date().toISOString().split('T')[0];
    db.run(`INSERT OR IGNORE INTO stats (guild_id, date, messages) VALUES (?, ?, 0)`, [message.guild.id, today]);
    db.run(`UPDATE stats SET messages = messages + 1 WHERE guild_id = ? AND date = ?`, [message.guild.id, today]);
    
    // AFK System Check
    db.get('SELECT * FROM afk_users WHERE guild_id = ? AND user_id = ?', 
           [message.guild.id, message.author.id], async (err, afkUser) => {
        if (afkUser) {
            // Remove AFK status
            db.run('DELETE FROM afk_users WHERE guild_id = ? AND user_id = ?', 
                   [message.guild.id, message.author.id]);
            
            const embed = new EmbedBuilder()
                .setDescription(`Welcome back ${message.author}! I've removed your AFK status.`)
                .setColor('#00FF00');
            
            await message.reply({ embeds: [embed] });
        }
    });
    
    // Check for AFK mentions
    if (message.mentions.users.size > 0) {
        const mentionedIds = Array.from(message.mentions.users.keys());
        
        db.all('SELECT * FROM afk_users WHERE guild_id = ? AND user_id IN (' + 
               mentionedIds.map(() => '?').join(',') + ')', 
               [message.guild.id, ...mentionedIds], async (err, afkUsers) => {
            
            if (afkUsers && afkUsers.length > 0) {
                const afkMentions = afkUsers.map(afk => {
                    const user = message.mentions.users.get(afk.user_id);
                    return `**${user.username}** is AFK: ${afk.reason} - <t:${Math.floor(afk.timestamp / 1000)}:R>`;
                }).join('\n');
                
                const embed = new EmbedBuilder()
                    .setTitle('💤 AFK Users Mentioned')
                    .setDescription(afkMentions)
                    .setColor('#FFA500');
                
                await message.reply({ embeds: [embed] });
            }
        });
    }
    
    // Leveling System
    db.get('SELECT * FROM level_config WHERE guild_id = ? AND enabled = 1', [message.guild.id], async (err, levelConfig) => {
        if (!levelConfig) return;
        
        const userId = message.author.id;
        const guildId = message.guild.id;
        
        db.get('SELECT * FROM user_levels WHERE guild_id = ? AND user_id = ?', [guildId, userId], async (err, userLevel) => {
            const now = Date.now();
            
            // Check cooldown
            if (userLevel && now - userLevel.last_xp_gain < levelConfig.cooldown * 1000) {
                return;
            }
            
            const xpGain = Math.floor(Math.random() * levelConfig.xp_per_message) + 1;
            
            if (userLevel) {
                const newXp = userLevel.xp + xpGain;
                const newLevel = Math.floor(Math.sqrt(newXp / 100));
                
                db.run(`UPDATE user_levels SET xp = ?, level = ?, total_messages = total_messages + 1, 
                        last_xp_gain = ? WHERE guild_id = ? AND user_id = ?`,
                       [newXp, newLevel, now, guildId, userId]);
                
                // Check for level up
                if (newLevel > userLevel.level && levelConfig.announce_levelup) {
                    const channel = levelConfig.announce_channel_id ? 
                        message.guild.channels.cache.get(levelConfig.announce_channel_id) : message.channel;
                    
                    if (channel) {
                        const embed = new EmbedBuilder()
                            .setTitle('🎉 Level Up!')
                            .setDescription(`Congratulations ${message.author}! You've reached level **${newLevel}**!`)
                            .setColor('#00FF00')
                            .setThumbnail(message.author.displayAvatarURL())
                            .setTimestamp();
                        
                        await channel.send({ embeds: [embed] });
                    }
                }
            } else {
                // Create new user level entry
                db.run(`INSERT INTO user_levels (guild_id, user_id, xp, level, total_messages, last_xp_gain) 
                        VALUES (?, ?, ?, ?, 1, ?)`,
                       [guildId, userId, xpGain, Math.floor(Math.sqrt(xpGain / 100)), now]);
            }
        });
    });
});

// Event: Slash command interaction
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const { commandName } = interaction;
    
    try {
        switch (commandName) {
            case 'ping':
                const ping = Date.now() - interaction.createdTimestamp;
                const embed = new EmbedBuilder()
                    .setTitle('🏓 Pong!')
                    .addFields(
                        { name: 'Latency', value: `${ping}ms`, inline: true },
                        { name: 'API Latency', value: `${Math.round(client.ws.ping)}ms`, inline: true }
                    )
                    .setColor('#00FF00')
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
                break;
                
            case 'serverinfo':
                const guild = interaction.guild;
                const owner = await guild.fetchOwner();
                
                const serverEmbed = new EmbedBuilder()
                    .setTitle(`${guild.name} Server Information`)
                    .setThumbnail(guild.iconURL())
                    .addFields(
                        { name: 'Owner', value: owner.user.tag, inline: true },
                        { name: 'Members', value: guild.memberCount.toString(), inline: true },
                        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                        { name: 'Channels', value: guild.channels.cache.size.toString(), inline: true },
                        { name: 'Roles', value: guild.roles.cache.size.toString(), inline: true },
                        { name: 'Boost Level', value: guild.premiumTier.toString(), inline: true }
                    )
                    .setColor('#5865F2')
                    .setTimestamp();
                
                await interaction.reply({ embeds: [serverEmbed] });
                break;
                
            case 'userinfo':
                const targetUser = interaction.options.getUser('user') || interaction.user;
                const member = interaction.guild.members.cache.get(targetUser.id);
                
                const userEmbed = new EmbedBuilder()
                    .setTitle(`${targetUser.username} User Information`)
                    .setThumbnail(targetUser.displayAvatarURL())
                    .addFields(
                        { name: 'Username', value: targetUser.tag, inline: true },
                        { name: 'ID', value: targetUser.id, inline: true },
                        { name: 'Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`, inline: true }
                    )
                    .setColor('#5865F2');
                
                if (member) {
                    userEmbed.addFields(
                        { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
                        { name: 'Roles', value: member.roles.cache.size.toString(), inline: true }
                    );
                }
                
                await interaction.reply({ embeds: [userEmbed] });
                break;
                
            case 'setup':
                const subcommand = interaction.options.getSubcommand();
                
                if (subcommand === 'welcome') {
                    const channel = interaction.options.getChannel('channel');
                    
                    db.run(`INSERT OR REPLACE INTO welcome_config 
                            (guild_id, welcome_enabled, welcome_channel_id) 
                            VALUES (?, ?, ?)`,
                           [interaction.guild.id, 1, channel.id]);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('✅ Welcome System Setup')
                        .setDescription(`Welcome messages will be sent to ${channel}`)
                        .setColor('#00FF00');
                    
                    await interaction.reply({ embeds: [embed] });
                }
                
                if (subcommand === 'logs') {
                    const channel = interaction.options.getChannel('channel');
                    
                    db.run(`INSERT OR REPLACE INTO server_config 
                            (guild_id, log_channel_id) 
                            VALUES (?, ?)`,
                           [interaction.guild.id, channel.id]);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('✅ Logging Setup')
                        .setDescription(`Logs will be sent to ${channel}`)
                        .setColor('#00FF00');
                    
                    await interaction.reply({ embeds: [embed] });
                }
                break;
                
            case 'kick':
                const kickUser = interaction.options.getUser('user');
                const kickReason = interaction.options.getString('reason') || 'No reason provided';
                const kickMember = interaction.guild.members.cache.get(kickUser.id);
                
                if (!kickMember) {
                    return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
                }
                
                if (!kickMember.kickable) {
                    return interaction.reply({ content: 'I cannot kick this user.', ephemeral: true });
                }
                
                try {
                    await kickMember.kick(kickReason);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('👢 User Kicked')
                        .addFields(
                            { name: 'User', value: kickUser.tag, inline: true },
                            { name: 'Reason', value: kickReason, inline: true },
                            { name: 'Moderator', value: interaction.user.tag, inline: true }
                        )
                        .setColor('#FF6B6B')
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    await interaction.reply({ content: 'Failed to kick user.', ephemeral: true });
                }
                break;
                
            case 'ban':
                const banUser = interaction.options.getUser('user');
                const banReason = interaction.options.getString('reason') || 'No reason provided';
                
                try {
                    await interaction.guild.members.ban(banUser, { reason: banReason });
                    
                    const embed = new EmbedBuilder()
                        .setTitle('🔨 User Banned')
                        .addFields(
                            { name: 'User', value: banUser.tag, inline: true },
                            { name: 'Reason', value: banReason, inline: true },
                            { name: 'Moderator', value: interaction.user.tag, inline: true }
                        )
                        .setColor('#FF0000')
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    await interaction.reply({ content: 'Failed to ban user.', ephemeral: true });
                }
                break;
                
            case 'timeout':
                const timeoutUser = interaction.options.getUser('user');
                const duration = interaction.options.getString('duration');
                const timeoutReason = interaction.options.getString('reason') || 'No reason provided';
                const timeoutMember = interaction.guild.members.cache.get(timeoutUser.id);
                
                if (!timeoutMember) {
                    return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
                }
                
                // Parse duration (simple implementation)
                const durationMs = parseDuration(duration);
                if (!durationMs) {
                    return interaction.reply({ content: 'Invalid duration format. Use format like: 10m, 1h, 1d', ephemeral: true });
                }
                
                try {
                    await timeoutMember.timeout(durationMs, timeoutReason);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('⏰ User Timed Out')
                        .addFields(
                            { name: 'User', value: timeoutUser.tag, inline: true },
                            { name: 'Duration', value: duration, inline: true },
                            { name: 'Reason', value: timeoutReason, inline: true }
                        )
                        .setColor('#FFA500')
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    await interaction.reply({ content: 'Failed to timeout user.', ephemeral: true });
                }
                break;
                
            case 'clear':
                const amount = interaction.options.getInteger('amount');
                
                try {
                    const messages = await interaction.channel.bulkDelete(amount, true);
                    
                    const embed = new EmbedBuilder()
                        .setDescription(`🗑️ Deleted ${messages.size} messages`)
                        .setColor('#00FF00');
                    
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                } catch (error) {
                    await interaction.reply({ content: 'Failed to delete messages.', ephemeral: true });
                }
                break;
                
            case 'afk':
                const reason = interaction.options.getString('reason') || 'AFK';
                
                db.run(`INSERT OR REPLACE INTO afk_users (guild_id, user_id, reason, timestamp) 
                        VALUES (?, ?, ?, ?)`,
                       [interaction.guild.id, interaction.user.id, reason, Date.now()]);
                
                const embed = new EmbedBuilder()
                    .setDescription(`💤 You are now AFK: ${reason}`)
                    .setColor('#FFA500');
                
                await interaction.reply({ embeds: [embed] });
                break;
                
            case 'rank':
                const rankUser = interaction.options.getUser('user') || interaction.user;
                
                db.get('SELECT * FROM user_levels WHERE guild_id = ? AND user_id = ?', 
                       [interaction.guild.id, rankUser.id], async (err, userLevel) => {
                    
                    if (!userLevel) {
                        return interaction.reply({ content: 'No rank data found for this user.', ephemeral: true });
                    }
                    
                    const embed = new EmbedBuilder()
                        .setTitle(`${rankUser.username}'s Rank`)
                        .setThumbnail(rankUser.displayAvatarURL())
                        .addFields(
                            { name: 'Level', value: userLevel.level.toString(), inline: true },
                            { name: 'XP', value: userLevel.xp.toString(), inline: true },
                            { name: 'Messages', value: userLevel.total_messages.toString(), inline: true }
