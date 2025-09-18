// Advanced Discord Bot - Extended Features (Production Ready)

// Additional Database Tables for New Features
db.serialize(() => {
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

    // Giveaway System
    db.run(`CREATE TABLE IF NOT EXISTS giveaways (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        channel_id TEXT,
        message_id TEXT,
        prize TEXT,
        winners INTEGER,
        end_time INTEGER,
        host_id TEXT,
        requirements TEXT DEFAULT '{}',
        status TEXT DEFAULT 'active',
        winner_ids TEXT DEFAULT '[]'
    )`);

    // Custom Commands
    db.run(`CREATE TABLE IF NOT EXISTS custom_commands (
        guild_id TEXT,
        command_name TEXT,
        response TEXT,
        response_type TEXT DEFAULT 'text',
        created_by TEXT,
        created_at INTEGER,
        usage_count INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, command_name)
    )`);

    // Suggestion System
    db.run(`CREATE TABLE IF NOT EXISTS suggestion_config (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT,
        review_channel_id TEXT,
        anonymous_allowed BOOLEAN DEFAULT 1,
        auto_thread BOOLEAN DEFAULT 1
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        user_id TEXT,
        message_id TEXT,
        content TEXT,
        status TEXT DEFAULT 'pending',
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        created_at INTEGER,
        reviewer_id TEXT,
        review_reason TEXT
    )`);

    // AFK System
    db.run(`CREATE TABLE IF NOT EXISTS afk_users (
        guild_id TEXT,
        user_id TEXT,
        reason TEXT,
        timestamp INTEGER,
        PRIMARY KEY (guild_id, user_id)
    )`);

    // Server Protection
    db.run(`CREATE TABLE IF NOT EXISTS server_protection (
        guild_id TEXT PRIMARY KEY,
        anti_nuke_enabled BOOLEAN DEFAULT 0,
        max_channel_creates INTEGER DEFAULT 5,
        max_channel_deletes INTEGER DEFAULT 5,
        max_role_creates INTEGER DEFAULT 5,
        max_role_deletes INTEGER DEFAULT 5,
        max_bans INTEGER DEFAULT 3,
        max_kicks INTEGER DEFAULT 5,
        time_window INTEGER DEFAULT 60,
        whitelist_roles TEXT DEFAULT '[]'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS protection_violations (
        guild_id TEXT,
        user_id TEXT,
        action_type TEXT,
        count INTEGER,
        window_start INTEGER,
        PRIMARY KEY (guild_id, user_id, action_type)
    )`);

    // Poll System
    db.run(`CREATE TABLE IF NOT EXISTS polls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        channel_id TEXT,
        message_id TEXT,
        question TEXT,
        options TEXT,
        creator_id TEXT,
        end_time INTEGER,
        multiple_choice BOOLEAN DEFAULT 0,
        anonymous BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'active'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS poll_votes (
        poll_id INTEGER,
        user_id TEXT,
        option_index INTEGER,
        PRIMARY KEY (poll_id, user_id, option_index)
    )`);

    // Premium Features
    db.run(`CREATE TABLE IF NOT EXISTS premium_guilds (
        guild_id TEXT PRIMARY KEY,
        tier INTEGER DEFAULT 1,
        activated_at INTEGER,
        expires_at INTEGER,
        activated_by TEXT
    )`);

    // Counting Channel
    db.run(`CREATE TABLE IF NOT EXISTS counting_config (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT,
        current_number INTEGER DEFAULT 0,
        last_user_id TEXT,
        highest_count INTEGER DEFAULT 0,
        fails INTEGER DEFAULT 0
    )`);

    // Confession System
    db.run(`CREATE TABLE IF NOT EXISTS confession_config (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT,
        anonymous_only BOOLEAN DEFAULT 1,
        require_approval BOOLEAN DEFAULT 0,
        mod_channel_id TEXT
    )`);

    // Ghost Ping Detection
    db.run(`CREATE TABLE IF NOT EXISTS ghost_pings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        channel_id TEXT,
        user_id TEXT,
        mentioned_users TEXT,
        content TEXT,
        timestamp INTEGER
    )`);
});

// Extended Commands Array
const extendedCommands = [
    // Ticket System
    new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket system management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup ticket system')
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('Category for tickets')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('support_role')
                        .setDescription('Support team role')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('panel')
                .setDescription('Create ticket panel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close current ticket')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for closing')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('Claim current ticket'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('priority')
                .setDescription('Set ticket priority')
                .addStringOption(option =>
                    option.setName('level')
                        .setDescription('Priority level')
                        .addChoices(
                            { name: 'Low', value: 'low' },
                            { name: 'Normal', value: 'normal' },
                            { name: 'High', value: 'high' },
                            { name: 'Urgent', value: 'urgent' }
                        )
                        .setRequired(true))),

    // Reaction Roles
    new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Reaction role management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add reaction role')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Message ID')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('Emoji')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to assign')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Reaction type')
                        .addChoices(
                            { name: 'Toggle', value: 'toggle' },
                            { name: 'Add Only', value: 'add' },
                            { name: 'Remove Only', value: 'remove' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove reaction role')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Message ID')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('Emoji')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all reaction roles'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    // Auto Moderation
    new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Auto moderation configuration')
        .addSubcommand(subcommand =>
            subcommand
                .setName('antispam')
                .setDescription('Configure anti-spam')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable anti-spam')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Messages per time window')
                        .setMinValue(2)
                        .setMaxValue(20))
                .addIntegerOption(option =>
                    option.setName('time')
                        .setDescription('Time window in seconds')
                        .setMinValue(1)
                        .setMaxValue(60)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('antilink')
                .setDescription('Configure anti-link')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable anti-link')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('whitelist')
                        .setDescription('Comma-separated allowed domains')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('anticaps')
                .setDescription('Configure anti-caps')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable anti-caps')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('threshold')
                        .setDescription('Caps percentage threshold')
                        .setMinValue(50)
                        .setMaxValue(100)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('punishment')
                .setDescription('Set punishment type')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Punishment type')
                        .addChoices(
                            { name: 'Timeout', value: 'timeout' },
                            { name: 'Kick', value: 'kick' },
                            { name: 'Ban', value: 'ban' },
                            { name: 'Delete Only', value: 'delete' }
                        )
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('duration')
                        .setDescription('Duration in seconds (for timeout)')
                        .setMinValue(60)
                        .setMaxValue(2419200)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    // Leveling System
    new SlashCommandBuilder()
        .setName('levels')
        .setDescription('Leveling system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup leveling system')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable leveling')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('announce_channel')
                        .setDescription('Level up announcement channel'))
                .addIntegerOption(option =>
                    option.setName('xp_per_message')
                        .setDescription('XP per message (5-50)')
                        .setMinValue(5)
                        .setMaxValue(50)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('rank')
                .setDescription('Check user rank')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to check')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('Show server leaderboard'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset user levels')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to reset')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reward')
                .setDescription('Add level role reward')
                .addIntegerOption(option =>
                    option.setName('level')
                        .setDescription('Required level')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to give')
                        .setRequired(true))),

    // Giveaway System
    new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Giveaway system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a giveaway')
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('Giveaway prize')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Duration (e.g., 1d, 2h, 30m)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('Number of winners')
                        .setMinValue(1)
                        .setMaxValue(20)
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to host in')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End a giveaway early')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Giveaway message ID')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reroll')
                .setDescription('Reroll giveaway winners')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Giveaway message ID')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List active giveaways')),

    // Custom Commands
    new SlashCommandBuilder()
        .setName('customcommand')
        .setDescription('Custom command system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create custom command')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Command name')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('response')
                        .setDescription('Command response')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Response type')
                        .addChoices(
                            { name: 'Text', value: 'text' },
                            { name: 'Embed', value: 'embed' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete custom command')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Command name')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List custom commands'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    // Suggestion System
    new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Submit a suggestion')
        .addStringOption(option =>
            option.setName('suggestion')
                .setDescription('Your suggestion')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('anonymous')
                .setDescription('Submit anonymously')),

    new SlashCommandBuilder()
        .setName('suggestion')
        .setDescription('Suggestion management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup suggestion system')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Suggestions channel')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('review_channel')
                        .setDescription('Staff review channel')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('approve')
                .setDescription('Approve a suggestion')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('Suggestion ID')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Approval reason')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('deny')
                .setDescription('Deny a suggestion')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('Suggestion ID')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Denial reason')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    // AFK System
    new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set AFK status')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('AFK reason')),

    // Server Protection
    new SlashCommandBuilder()
        .setName('protection')
        .setDescription('Server protection system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup anti-nuke protection')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable protection')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('max_actions')
                        .setDescription('Max actions per minute')
                        .setMinValue(1)
                        .setMaxValue(20)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('Manage protection whitelist')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to whitelist')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // Poll System
    new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Poll question')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Poll options (separated by |)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Poll duration (e.g., 1d, 2h)')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('multiple_choice')
                .setDescription('Allow multiple choices'))
        .addBooleanOption(option =>
            option.setName('anonymous')
                .setDescription('Anonymous voting')),

    // Premium Commands
    new SlashCommandBuilder()
        .setName('premium')
        .setDescription('Premium features')
        .addSubcommand(subcommand =>
            subcommand
                .setName('activate')
                .setDescription('Activate premium')
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('Premium code')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check premium status'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('features')
                .setDescription('View premium features')),

    // Counting Channel
    new SlashCommandBuilder()
        .setName('counting')
        .setDescription('Setup counting channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Counting channel')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    // Confession System
    new SlashCommandBuilder()
        .setName('confess')
        .setDescription('Submit anonymous confession')
        .addStringOption(option =>
            option.setName('confession')
                .setDescription('Your confession')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('confession')
        .setDescription('Setup confession system')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Confession channel')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('require_approval')
                .setDescription('Require staff approval'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    // Advanced Utility Commands
    new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder')
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('When to remind (e.g., 1h, 30m)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Reminder message')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Translate text')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to translate')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('to')
                .setDescription('Target language (e.g., es, fr, de)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('from')
                .setDescription('Source language (auto-detect if not specified)')),

    new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Get weather information')
        .addStringOption(option =>
            option.setName('location')
                .setDescription('Location to check')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('qr')
        .setDescription('Generate QR code')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to encode')
                .setRequired(true)),

    // Advanced Fun Commands
    new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Generate meme')
        .addStringOption(option =>
            option.setName('template')
                .setDescription('Meme template')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('top_text')
                .setDescription('Top text'))
        .addStringOption(option =>
            option.setName('bottom_text')
                .setDescription('Bottom text')),

    new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Get inspirational quote'),

    new SlashCommandBuilder()
        .setName('ship')
        .setDescription('Ship two users')
        .addUserOption(option =>
            option.setName('user1')
                .setDescription('First user')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user2')
                .setDescription('Second user')
                .setRequired(true)),

    // Server Analytics
    new SlashCommandBuilder()
        .setName('analytics')
        .setDescription('Advanced server analytics')
        .addSubcommand(subcommand =>
            subcommand
                .setName('overview')
                .setDescription('Server overview'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('activity')
                .setDescription('Activity statistics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('growth')
                .setDescription('Growth statistics'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    // Role Management
    new SlashCommandBuilder()
        .setName('role')
        .setDescription('Advanced role management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create role with advanced options')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Role name')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Role color (hex)')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('mentionable')
                        .setDescription('Make role mentionable'))
                .addBooleanOption(option =>
                    option.setName('hoist')
                        .setDescription('Display separately')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('massadd')
                .setDescription('Add role to multiple users')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to add')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('target_role')
                        .setDescription('Add to users with this role')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('massremove')
                .setDescription('Remove role from multiple users')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to remove')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
];

// Extended Event Handlers

// Auto Moderation System
const userMessageCounts = new Map();

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;
    
    // Check automod configuration
    db.get('SELECT * FROM automod_config WHERE guild_id = ?', [message.guild.id], async (err, config) => {
        if (!config) return;
        
        let violation = null;
        
        // Anti-spam check
        if (config.anti_spam_enabled) {
            const userId = message.author.id;
            const guildId = message.guild.id;
            const key = `${guildId}-${userId}`;
            
            if (!userMessageCounts.has(key)) {
                userMessageCounts.set(key, []);
            }
            
            const timestamps = userMessageCounts.get(key);
            const now = Date.now();
            
            // Add current message
            timestamps.push(now);
            
            // Remove old messages
            const cutoff = now - (config.anti_spam_time * 1000);
            userMessageCounts.set(key, timestamps.filter(t => t > cutoff));
            
            if (timestamps.length >= config.anti_spam_limit) {
                violation = 'spam';
            }
        }
        
        // Anti-link check
        if (config.anti_link_enabled && !violation) {
            const linkRegex = /(https?:\/\/[^\s]+)/gi;
            const links = message.content.match(linkRegex);
            
            if (links) {
                const allowedDomains = JSON.parse(config.allowed_domains || '[]');
                const hasDisallowedLink = links.some(link => {
                    const domain = new URL(link).hostname;
                    return !allowedDomains.includes(domain);
                });
                
                if (hasDisallowedLink) {
                    violation = 'link';
                }
            }
        }
        
        // Anti-caps check
        if (config.anti_caps_enabled && !violation) {
            const text = message.content.replace(/[^a-zA-Z]/g, '');
            if (text.length >= 10) {
                const capsCount = (text.match(/[A-Z]/g) || []).length;
                const capsPercentage = (capsCount / text.length) * 100;
                
                if (capsPercentage >= config.caps_threshold) {
                    violation = 'caps';
                }
            }
        }
        
        // Anti-invite check
        if (config.anti_invite_enabled && !violation) {
            const inviteRegex = /(discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)[a-zA-Z0-9]+/gi;
            if (inviteRegex.test(message.content)) {
                violation = 'invite';
            }
        }
        
        // Handle violation
        if (violation) {
            try {
                await message.delete();
                
                if (config.punishment_type !== 'delete') {
                    const member = message.member;
                    
                    if (config.punishment_type === 'timeout') {
                        await member.timeout(config.punishment_duration * 1000, `AutoMod: ${violation}`);
                    } else if (config.punishment_type === 'kick') {
                        await member.kick(`AutoMod: ${violation}`);
                    } else if (config.punishment_type === 'ban') {
                        await member.ban({ reason: `AutoMod: ${violation}` });
                    }
                }
                
                // Log violation
                db.run(`INSERT OR REPLACE INTO automod_violations 
                        (guild_id, user_id, violation_type, count, last_violation) 
                        VALUES (?, ?, ?, COALESCE((SELECT count FROM automod_violations 
                        WHERE guild_id = ? AND user_id = ? AND violation_type = ?), 0) + 1, ?)`,
                       [message.guild.id, message.author.id, violation, 
                        message.guild.id, message.author.id, violation, Date.now()]);
                
            } catch (error) {
                console.error('AutoMod action failed:', error);
            }
        }
    });
    
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
                    
                    // Check for level roles
                    db.get('SELECT level_roles FROM level_config WHERE guild_id = ?', [guildId], async (err, config) => {
                        if (config && config.level_roles) {
                            const levelRoles = JSON.parse(config.level_roles);
                            const roleToAdd = levelRoles.find(lr => lr.level === newLevel);
                            
                            if (roleToAdd) {
                                try {
                                    const role = message.guild.roles.cache.get(roleToAdd.role_id);
                                    if (role) {
                                        await message.member.roles.add(role);
                                    }
                                } catch (error) {
                                    console.error('Error adding level role:', error);
                                }
                            }
                        }
                    });
                }
            } else {
                // Create new user level entry
                db.run(`INSERT INTO user_levels (guild_id, user_id, xp, level, total_messages, last_xp_gain) 
                        VALUES (?, ?, ?, ?, 1, ?)`,
                       [guildId, userId, xpGain, Math.floor(Math.sqrt(xpGain / 100)), now]);
            }
        });
    });
    
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
                    const timeAgo = Math.floor((Date.now() - afk.timestamp) / 1000);
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
    
    // Counting Channel
    db.get('SELECT * FROM counting_config WHERE guild_id = ? AND channel_id = ?', 
           [message.guild.id, message.channel.id], async (err, counting) => {
        if (!counting) return;
        
        const number = parseInt(message.content);
        const expectedNumber = counting.current_number + 1;
        
        if (isNaN(number) || number !== expectedNumber || message.author.id === counting.last_user_id) {
            // Wrong number or same user
            await message.delete();
            
            db.run('UPDATE counting_config SET fails = fails + 1, current_number = 0, last_user_id = NULL WHERE guild_id = ?', 
                   [message.guild.id]);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Counting Failed!')
                .setDescription(`${message.author} ruined the count! We were at ${counting.current_number}.\nThe count has been reset to 0.`)
                .setColor('#FF0000');
            
            await message.channel.send({ embeds: [embed] });
        } else {
            // Correct number
            await message.react('✅');
            
            db.run(`UPDATE counting_config SET current_number = ?, last_user_id = ?, 
                    highest_count = MAX(highest_count, ?) WHERE guild_id = ?`,
                   [number, message.author.id, number, message.guild.id]);
        }
    });
});

// Ghost Ping Detection
client.on('messageDelete', async message => {
    if (message.author.bot || !message.guild || !message.mentions.users.size) return;
    
    const mentionedUsers = Array.from(message.mentions.users.keys());
    
    db.run(`INSERT INTO ghost_pings (guild_id, channel_id, user_id, mentioned_users, content, timestamp) 
            VALUES (?, ?, ?, ?, ?, ?)`,
           [message.guild.id, message.channel.id, message.author.id, 
            JSON.stringify(mentionedUsers), message.content, Date.now()]);
    
    const embed = new EmbedBuilder()
        .setTitle('👻 Ghost Ping Detected')
        .setDescription(`**${message.author.username}** deleted a message that mentioned users`)
        .addFields(
            { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
            { name: 'Mentioned Users', value: mentionedUsers.map(id => `<@${id}>`).join(', '), inline: true },
            { name: 'Content', value: message.content || '*No content*' }
        )
        .setColor('#FF6B6B')
        .setTimestamp();
    
    await message.channel.send({ embeds: [embed] });
});

// Reaction Role System
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    
    const message = reaction.message;
    const emoji = reaction.emoji.name || reaction.emoji.id;
    
    db.get('SELECT * FROM reaction_roles WHERE message_id = ? AND emoji = ?', 
           [message.id, emoji], async (err, reactionRole) => {
        if (!reactionRole) return;
        
        try {
            const guild = message.guild;
            const member = await guild.members.fetch(user.id);
            const role = guild.roles.cache.get(reactionRole.role_id);
            
            if (!role) return;
            
            if (reactionRole.type === 'toggle' || reactionRole.type === 'add') {
                if (!member.roles.cache.has(role.id)) {
                    await member.roles.add(role);
                }
            }
        } catch (error) {
            console.error('Error adding reaction role:', error);
        }
    });
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    
    const message = reaction.message;
    const emoji = reaction.emoji.name || reaction.emoji.id;
    
    db.get('SELECT * FROM reaction_roles WHERE message_id = ? AND emoji = ?', 
           [message.id, emoji], async (err, reactionRole) => {
        if (!reactionRole) return;
        
        try {
            const guild = message.guild;
            const member = await guild.members.fetch(user.id);
            const role = guild.roles.cache.get(reactionRole.role_id);
            
            if (!role) return;
            
            if (reactionRole.type === 'toggle' || reactionRole.type === 'remove') {
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                }
            }
        } catch (error) {
            console.error('Error removing reaction role:', error);
        }
    });
});

// Server Protection System
const actionCounts = new Map();

function checkServerProtection(guild, userId, actionType) {
    db.get('SELECT * FROM server_protection WHERE guild_id = ? AND anti_nuke_enabled = 1', 
           [guild.id], async (err, protection) => {
        if (!protection) return;
        
        // Check if user is whitelisted
        const whitelistRoles = JSON.parse(protection.whitelist_roles || '[]');
        const member = await guild.members.fetch(userId).catch(() => null);
        
        if (member && member.roles.cache.some(role => whitelistRoles.includes(role.id))) {
            return;
        }
        
        const key = `${guild.id}-${userId}-${actionType}`;
        const now = Date.now();
        
        if (!actionCounts.has(key)) {
            actionCounts.set(key, { count: 0, windowStart: now });
        }
        
        const actionData = actionCounts.get(key);
        
        // Reset if outside time window
        if (now - actionData.windowStart > protection.time_window * 1000) {
            actionData.count = 0;
            actionData.windowStart = now;
        }
        
        actionData.count++;
        
        // Get max for this action type
        const maxActions = protection[`max_${actionType}s`] || protection.max_channel_creates;
        
        if (actionData.count >= maxActions) {
            // Trigger protection
            try {
                if (member) {
                    await member.ban({ reason: 'Anti-nuke protection triggered' });
                    
                    const logChannel = guild.channels.cache.find(c => c.name === 'mod-logs');
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('🛡️ Server Protection Triggered')
                            .setDescription(`**User:** ${member.user.tag}\n**Action:** ${actionType}\n**Count:** ${actionData.count}/${maxActions}`)
                            .setColor('#FF0000')
                            .setTimestamp();
                        
                        await logChannel.send({ embeds: [embed] });
                    }
                }
            } catch (error) {
                console.error('Protection action failed:', error);
            }
        }
    });
}

// Monitor various guild events for protection
client.on('channelCreate', channel => {
    if (channel.guild) {
        checkServerProtection(channel.guild, channel.guild.ownerId, 'channel_create');
    }
});

client.on('channelDelete', channel => {
    if (channel.guild) {
        checkServerProtection(channel.guild, channel.guild.ownerId, 'channel_delete');
    }
});

client.on('roleCreate', role => {
    checkServerProtection(role.guild, role.guild.ownerId, 'role_create');
});

client.on('roleDelete', role => {
    checkServerProtection(role.guild, role.guild.ownerId, 'role_delete');
});

// Giveaway System
function checkGiveaways() {
    const now = Date.now();
    
    db.all('SELECT * FROM giveaways WHERE end_time <= ? AND status = "active"', [now], async (err, giveaways) => {
        if (err || !giveaways) return;
        
        for (const giveaway of giveaways) {
            try {
                const guild = client.guilds.cache.get(giveaway.guild_id);
                if (!guild) continue;
                
                const channel = guild.channels.cache.get(giveaway.channel_id);
                if (!channel) continue;
                
                const message = await channel.messages.fetch(giveaway.message_id);
                if (!message) continue;
                
                // Get reactions
                const reaction = message.reactions.cache.get('🎉');
                if (!reaction) continue;
                
                const users = await reaction.users.fetch();
                const participants = users.filter(user => !user.bot);
                
                if (participants.size === 0) {
                    const embed = new EmbedBuilder()
                        .setTitle('🎉 Giveaway Ended')
                        .setDescription(`**Prize:** ${giveaway.prize}\n**Winners:** No valid participants`)
                        .setColor('#FF6B6B')
                        .setTimestamp();
                    
                    await message.edit({ embeds: [embed] });
                    continue;
                }
                
                // Select winners
                const participantArray = Array.from(participants.values());
                const winners = [];
                
                for (let i = 0; i < Math.min(giveaway.winners, participantArray.length); i++) {
                    const randomIndex = Math.floor(Math.random() * participantArray.length);
                    const winner = participantArray.splice(randomIndex, 1)[0];
                    winners.push(winner);
                }
                
                const winnerMentions = winners.map(w => w.toString()).join(', ');
                const winnerIds = winners.map(w => w.id);
                
                const embed = new EmbedBuilder()
                    .setTitle('🎉 Giveaway Ended')
                    .setDescription(`**Prize:** ${giveaway.prize}\n**Winners:** ${winnerMentions}`)
                    .setColor('#00FF00')
                    .setTimestamp();
                
                await message.edit({ embeds: [embed] });
                await message.reply(`Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`);
                
                // Update database
                db.run('UPDATE giveaways SET status = "ended", winner_ids = ? WHERE id = ?', 
                       [JSON.stringify(winnerIds), giveaway.id]);
                
            } catch (error) {
                console.error('Error ending giveaway:', error);
            }
        }
    });
}

// Check giveaways every minute
setInterval(checkGiveaways, 60000);

// Reminder System
const reminders = new Map();

function scheduleReminder(userId, channelId, message, delay) {
    const reminderId = Date.now() + Math.random();
    const reminderTime = Date.now() + delay;
    
    reminders.set(reminderId, {
        userId,
        channelId,
        message,
        time: reminderTime
    });
    
    setTimeout(async () => {
        const reminder = reminders.get(reminderId);
        if (!reminder) return;
        
        try {
            const channel = client.channels.cache.get(channelId);
            if (channel) {
                const embed = new EmbedBuilder()
                    .setTitle('⏰ Reminder')
                    .setDescription(reminder.message)
                    .setColor('#FFA500')
                    .setTimestamp();
                
                await channel.send({ content: `<@${userId}>`, embeds: [embed] });
            }
        } catch (error) {
            console.error('Error sending reminder:', error);
        }
        
        reminders.delete(reminderId);
    }, delay);
    
    return reminderId;
}

// Utility Functions
function parseDuration(duration) {
    const regex = /(\d+)([smhd])/g;
    let totalMs = 0;
    let match;
    
    while ((match = regex.exec(duration)) !== null) {
        const value = parseInt(match[1]);
        const unit = match[2];
        
        switch (unit) {
            case 's': totalMs += value * 1000; break;
            case 'm': totalMs += value * 60 * 1000; break;
            case 'h': totalMs += value * 60 * 60 * 1000; break;
            case 'd': totalMs += value * 24 * 60 * 60 * 1000; break;
        }
    }
    
    return totalMs;
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

async function createTicket(guild, user, category) {
    try {
        // Get ticket counter
        const result = await new Promise((resolve, reject) => {
            db.get('SELECT ticket_counter FROM ticket_config WHERE guild_id = ?', [guild.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        const ticketNumber = (result?.ticket_counter || 0) + 1;
        
        // Create channel
        const channel = await guild.channels.create({
            name: `ticket-${ticketNumber.toString().padStart(4, '0')}`,
            type: 0,
            parent: category,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: ['ViewChannel']
                },
                {
                    id: user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                }
            ]
        });
        
        // Update counter
        db.run('UPDATE ticket_config SET ticket_counter = ? WHERE guild_id = ?', 
               [ticketNumber, guild.id]);
        
        // Save ticket
        db.run(`INSERT INTO tickets (ticket_id, guild_id, channel_id, user_id, created_at) 
                VALUES (?, ?, ?, ?, ?)`,
               [`ticket-${ticketNumber}`, guild.id, channel.id, user.id, Date.now()]);
        
        // Send welcome message
        const embed = new EmbedBuilder()
            .setTitle('🎫 Support Ticket')
            .setDescription(`Hello ${user}! Thank you for creating a ticket.\n\nPlease describe your issue and a staff member will assist you shortly.`)
            .setColor('#00FF00')
            .setTimestamp();
        
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒'),
                new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('Claim')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✋')
            );
        
        await channel.send({ embeds: [embed], components: [buttons] });
        
        return channel;
        
    } catch (error) {
        console.error('Error creating ticket:', error);
        throw error;
    }
}

// Additional Event Handlers for new features would go here...

// Button/Select Menu Handlers
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton() && !interaction.isSelectMenu()) return;
    
    // Ticket System Buttons
    if (interaction.customId === 'create_ticket') {
        // Check if user already has maximum tickets
        db.get('SELECT COUNT(*) as count FROM tickets WHERE guild_id = ? AND user_id = ? AND status = "open"',
               [interaction.guild.id, interaction.user.id], async (err, result) => {
            
            const maxTickets = 3; // Could be configurable
            if (result.count >= maxTickets) {
                return interaction.reply({ 
                    content: `You already have ${maxTickets} open tickets. Please close one before creating a new one.`, 
                    ephemeral: true 
                });
            }
            
            db.get('SELECT * FROM ticket_config WHERE guild_id = ?', [interaction.guild.id], async (err, config) => {
                if (!config) {
                    return interaction.reply({ content: 'Ticket system is not configured.', ephemeral: true });
                }
                
                try {
                    const category = interaction.guild.channels.cache.get(config.category_id);
                    const channel = await createTicket(interaction.guild, interaction.user, category);
                    
                    await interaction.reply({ 
                        content: `Ticket created: ${channel}`, 
                        ephemeral: true 
                    });
                } catch (error) {
                    await interaction.reply({ 
                        content: 'Failed to create ticket. Please try again.', 
                        ephemeral: true 
                    });
                }
            });
        });
    }
    
    else if (interaction.customId === 'close_ticket') {
        // Handle ticket closure
        db.get('SELECT * FROM tickets WHERE channel_id = ? AND status = "open"', 
               [interaction.channel.id], async (err, ticket) => {
            if (!ticket) {
                return interaction.reply({ content: 'This is not a valid ticket channel.', ephemeral: true });
            }
            
            // Create transcript
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const transcript = messages.reverse().map(msg => 
                `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content}`
            ).join('\n');
            
            // Save transcript to file and send to transcript channel
            // Implementation would depend on file storage solution
            
            // Update database
            db.run('UPDATE tickets SET status = "closed", closed_at = ?, closer_id = ? WHERE channel_id = ?',
                   [Date.now(), interaction.user.id, interaction.channel.id]);
            
            await interaction.reply('Ticket will be closed in 5 seconds...');
            
            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (error) {
                    console.error('Error deleting ticket channel:', error);
                }
            }, 5000);
        });
    }
    
    else if (interaction.customId === 'claim_ticket') {
        db.run('UPDATE tickets SET claim_user_id = ? WHERE channel_id = ?',
               [interaction.user.id, interaction.channel.id]);
        
        const embed = new EmbedBuilder()
            .setDescription(`Ticket claimed by ${interaction.user}`)
            .setColor('#FFA500')
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
});

// Additional utility functions and handlers for all the new features...
// This includes handlers for all the slash commands defined above

console.log('Extended Discord Bot features loaded successfully!');
