# VPS: Fix Bible Word Search (broken link)

**Root cause:** `WordSearch-*.js` on production calls `useNavigate()` without importing `react-router`. The game white-screens; Righteous Quest and Crossword work.

**Fix (run on VPS as root or site user):**

```bash
cd /var/www/vhosts/godkingdomprinciplesradio.com/httpdocs
# From repo (after deploy), or copy script manually:
python3 /path/to/mobile/scripts/patch-vps-games-player-name.py
```

The script idempotently patches `assets/WordSearch*.js`:

- Adds `import{u as wsNav}from"./router-BpWWBKyu.js";`
- Replaces `const P=useNavigate()` with `const[,P]=wsNav()`

**Verify:**

```bash
curl -s "$(curl -s https://godkingdomprinciplesradio.com/assets/index-Cqnc4oDb.js | grep -o 'WordSearch[^"]*\.js' | head -1 | sed 's|^|https://godkingdomprinciplesradio.com/assets/|')" | head -c 200
# Must contain: router-BpWWBKyu.js and wsNav — NOT useNavigate()
```

**Long-term:** Fix the Word Search source in the website build so the next Vite deploy does not ship a broken chunk.
