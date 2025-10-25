#!/bin/bash

# Test VPS Connection Script for Bob's Owncast Server
# Run this to verify VPS connectivity before streaming

VPS_IP="74.208.102.89"
RTMP_PORT="1935"
WEB_PORT="8080"

echo "🧪 Testing VPS Connection to $VPS_IP"
echo "====================================="

# Test web port
echo "🌐 Testing web port $WEB_PORT..."
if curl -I --connect-timeout 10 "http://$VPS_IP:$WEB_PORT" >/dev/null 2>&1; then
    echo "✅ Web port $WEB_PORT: ACCESSIBLE"
    echo "   Stream viewer: http://$VPS_IP:$WEB_PORT"
    echo "   Admin panel: http://$VPS_IP:$WEB_PORT/admin"
else
    echo "❌ Web port $WEB_PORT: NOT ACCESSIBLE"
fi

echo ""

# Test RTMP port
echo "🎥 Testing RTMP port $RTMP_PORT..."
if timeout 5 bash -c "</dev/tcp/$VPS_IP/$RTMP_PORT" >/dev/null 2>&1; then
    echo "✅ RTMP port $RTMP_PORT: ACCESSIBLE"
    echo "   OBS Server: rtmp://$VPS_IP:$RTMP_PORT/live"
    echo "   Stream Key: gkpAdmin2025@"
else
    echo "❌ RTMP port $RTMP_PORT: NOT ACCESSIBLE"
    echo "   This means OBS cannot connect to stream"
fi

echo ""

# Get Owncast status
echo "📊 Checking Owncast status..."
if curl -s "http://$VPS_IP:$WEB_PORT/api/status" | grep -q "online"; then
    echo "✅ Owncast API: RESPONDING"
else
    echo "⚠️  Owncast API: No live stream detected (normal when offline)"
fi

echo ""
echo "🔧 Next Steps:"
echo "=============="

if timeout 5 bash -c "</dev/tcp/$VPS_IP/$RTMP_PORT" >/dev/null 2>&1; then
    echo "✅ Your VPS is ready for streaming!"
    echo "   Configure OBS with the settings above and start streaming."
else
    echo "❌ RTMP port blocked. Run this on your VPS:"
    echo "   sudo ufw allow 1935/tcp"
    echo "   sudo systemctl restart owncast"
    echo "   sudo lsof -i -P -n | grep 1935"
fi

echo ""
echo "📱 Test from Windows PowerShell:"
echo "   Test-NetConnection $VPS_IP -Port $RTMP_PORT"