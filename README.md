# Celestium Discord Bot

Discord bot with welcome/goodbye embeds and admin test commands.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit `.env` file:
```
BOT_TOKEN=your_actual_bot_token
WELCOME_CHANNEL_ID=your_channel_id_here
```

### 3. Bot Permissions Required
- Send Messages
- Use Slash Commands
- Embed Links
- Read Message History

### 4. Run the Bot
```bash
npm start
```

### 5. Replace Placeholders
- Update channel IDs in embed descriptions (`<#rules>`, `<#chat>`, `<#media>`)
- Replace image URLs in `createWelcomeEmbed()` and `createGoodbyeEmbed()` functions
- Customize server-specific content

## Commands
- `/test welcome` - Test welcome embed (Admin only)
- `/test goodbye` - Test goodbye embed (Admin only)

## Features
- ✅ Welcome embed with pastel pink theme
- ✅ Goodbye embed with dark gray theme  
- ✅ Member count tracking
- ✅ Admin-only test commands
- ✅ Secure token storage
# Celestium
# Celestium
# Celestium
