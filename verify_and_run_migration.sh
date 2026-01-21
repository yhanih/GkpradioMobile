#!/bin/bash
# Script to verify MCP setup and provide migration instructions

echo "🔍 Checking Supabase MCP Server setup..."
echo ""

# Check if MCP config exists
if [ -f ~/.cursor/mcp.json ]; then
    echo "✅ MCP config file exists at ~/.cursor/mcp.json"
    
    # Check if Supabase MCP is configured
    if grep -q "supabase" ~/.cursor/mcp.json; then
        echo "✅ Supabase MCP server is configured"
        
        # Check if service role key is set (without exposing it)
        if grep -q "SUPABASE_KEY" ~/.cursor/mcp.json && ! grep -q "YOUR_SERVICE_ROLE_KEY_HERE" ~/.cursor/mcp.json; then
            echo "✅ Service role key appears to be configured"
            echo ""
            echo "📝 The MCP server should be available in Cursor."
            echo "   If it's not working, try:"
            echo "   1. Restart Cursor completely (Cmd+Q, then reopen)"
            echo "   2. Check that the service role key is correct"
            echo ""
        else
            echo "⚠️  Service role key may not be configured"
            echo "   Please update ~/.cursor/mcp.json with your service role key"
        fi
    else
        echo "❌ Supabase MCP server not found in config"
    fi
else
    echo "❌ MCP config file not found"
    echo "   Please set up MCP server (see SUPABASE_MCP_SETUP.md)"
fi

echo ""
echo "📋 Migration SQL (if MCP is not available, run this in Supabase Dashboard):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat mobile/migrations/06_add_push_token_column.sql
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Quick link to Supabase SQL Editor:"
echo "   https://supabase.com/dashboard/project/fychjnaxljwmgoptjsxn/sql/new"
echo ""

