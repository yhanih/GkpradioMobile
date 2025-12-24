# Supabase MCP Server Setup for Cursor

This guide will help you connect the Supabase MCP server to Cursor so I can directly manage your database.

## Step 1: Install the Supabase MCP Server

The Supabase MCP server package is `supabase-mcp`.

**Option A: Install globally (Recommended)**
```bash
npm install -g supabase-mcp
```

**Option B: Install locally in your project**
```bash
cd /Users/loghiny/Documents/GkpradioMobile/GkpradioMobile
npm install supabase-mcp
```

## Step 2: Get Your Supabase Credentials

You'll need:
1. **Supabase URL**: `https://fychjnaxljwmgoptjsxn.supabase.co` (from your app.json)
2. **Supabase Service Role Key**: This is different from the anon key - it has admin privileges

**To get your Service Role Key:**
1. Go to: https://supabase.com/dashboard/project/fychjnaxljwmgoptjsxn
2. Click **Settings** (gear icon) → **API**
3. Find **service_role** key (NOT the anon key)
4. Copy it (keep it secret - it has full database access!)

## Step 3: Configure MCP in Cursor

Edit your MCP configuration file:

**File location:** `~/.cursor/mcp.json`

**Add this configuration (using environment variables - RECOMMENDED):**

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "supabase-mcp"
      ],
      "env": {
        "SUPABASE_URL": "https://fychjnaxljwmgoptjsxn.supabase.co",
        "SUPABASE_KEY": "YOUR_SERVICE_ROLE_KEY_HERE"
      }
    }
  }
}
```

**Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key!**

**Quick Setup:**
1. I've created a template file: `mcp_config_template.json`
2. Copy it to `~/.cursor/mcp.json` (or merge it into your existing file)
3. Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your service role key

**Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key!**

## Step 4: Restart Cursor

After saving the configuration:
1. **Quit Cursor completely** (Cmd+Q on Mac)
2. **Reopen Cursor**
3. The MCP server should connect automatically

## Step 5: Verify Connection

Once connected, I'll be able to:
- ✅ Run SQL migrations directly
- ✅ Query your database
- ✅ Add/modify tables and columns
- ✅ Manage RLS policies
- ✅ Execute any SQL commands

## Security Notes

⚠️ **IMPORTANT:**
- The service role key has **FULL DATABASE ACCESS**
- Never commit it to git
- Only use it for local development
- Consider using environment variables instead

**Note:** The `supabase-mcp` package uses environment variables (`SUPABASE_URL` and `SUPABASE_KEY`), so the configuration above is the correct format.

## Troubleshooting

**"Command not found"**
- Make sure npm/npx is in your PATH
- Try installing globally: `npm install -g supabase-mcp`

**"Connection failed"**
- Verify your Supabase URL is correct
- Check that your service role key is valid
- Ensure you have internet connection

**"Permission denied"**
- Check that the service role key has the correct permissions
- Verify the key hasn't been rotated

## Next Steps

Once connected, I can:
1. Run the `push_token` migration directly
2. Check your database schema
3. Make any other database changes you need

Let me know when you've set it up and I'll test the connection!

