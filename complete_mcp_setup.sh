#!/bin/bash
# Script to complete MCP setup and run migration

echo "🔧 Completing Supabase MCP Server Setup..."
echo ""

MCP_CONFIG="$HOME/.cursor/mcp.json"
TEMPLATE="mcp_config_template.json"

# Check if config exists
if [ ! -f "$MCP_CONFIG" ]; then
    echo "📝 Creating MCP config file..."
    mkdir -p "$HOME/.cursor"
    cp "$TEMPLATE" "$MCP_CONFIG"
    echo "✅ Created $MCP_CONFIG"
    echo ""
fi

# Check if service role key is set
if grep -q "YOUR_SERVICE_ROLE_KEY_HERE" "$MCP_CONFIG" 2>/dev/null; then
    echo "⚠️  Service role key needs to be configured"
    echo ""
    echo "📋 To get your service role key:"
    echo "   1. Go to: https://supabase.com/dashboard/project/fychjnaxljwmgoptjsxn/settings/api"
    echo "   2. Copy the 'service_role' key (NOT the anon key)"
    echo ""
    echo "💡 Then update $MCP_CONFIG"
    echo "   Replace 'YOUR_SERVICE_ROLE_KEY_HERE' with your actual key"
    echo ""
    echo "🔄 After updating, restart Cursor (Cmd+Q, then reopen)"
    echo "   Then I can run the migration automatically via MCP!"
    echo ""
    exit 1
else
    echo "✅ MCP config appears to be set up"
    echo "   If migration doesn't work, restart Cursor to reload MCP server"
    echo ""
fi












