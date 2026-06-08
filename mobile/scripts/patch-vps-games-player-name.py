#!/usr/bin/env python3
# Idempotent: safe to re-run after Vite deploy overwrites index.html / assets.
from pathlib import Path

ROOT = Path("/var/www/vhosts/godkingdomprinciplesradio.com/httpdocs")
LAZY = '.useState(()=>{try{return localStorage.getItem("gkp_player_name")||""}catch(e){return""}})'

BRIDGE = """    <script>
      (function () {
        try {
          var params = new URLSearchParams(window.location.search);
          var name = params.get("player_name");
          if (name && name.trim()) {
            localStorage.setItem("gkp_player_name", name.trim().slice(0, 100));
          }
          if (params.get("game_audio") === "0" || params.get("mobile") === "1") {
            localStorage.setItem("gkp_mute_game_audio", "1");
          }
        } catch (e) {}
      })();
    </script>
"""
MUTE_BLOCK = """          if (params.get("game_audio") === "0" || params.get("mobile") === "1") {
            localStorage.setItem("gkp_mute_game_audio", "1");
          }"""
PLAYER_NAME_BLOCK_END = """          if (name && name.trim()) {
            localStorage.setItem("gkp_player_name", name.trim().slice(0, 100));
          }"""

index = ROOT / "index.html"
text = index.read_text()
if "gkp_player_name" not in text:
    text = text.replace('    <script type="module"', BRIDGE + '    <script type="module"')
    index.write_text(text)
    print("index.html: injected full bridge (player_name + mute)")
elif "gkp_mute_game_audio" not in text:
    if PLAYER_NAME_BLOCK_END in text:
        text = text.replace(PLAYER_NAME_BLOCK_END, PLAYER_NAME_BLOCK_END + "\n" + MUTE_BLOCK, 1)
        index.write_text(text)
        print("index.html: extended bridge with mute logic")
    else:
        print("index.html: gkp_player_name present but bridge pattern not found; mute not added")
else:
    print("index.html: player_name and mute bridge already present")

# Word Search chunk shipped without react-router import (useNavigate is undefined at runtime).
ROUTER_IMPORT = 'import{u as wsNav}from"./router-BpWWBKyu.js";'
word_search_files = list((ROOT / "assets").glob("WordSearch*.js"))
for ws_file in word_search_files:
    ws_data = ws_file.read_text()
    if "useNavigate()" in ws_data and ROUTER_IMPORT not in ws_data:
        ws_data = ws_data.replace(
            'import{r as y,j as i}from"./vendor-CPhIXR9D.js";',
            'import{r as y,j as i}from"./vendor-CPhIXR9D.js";' + ROUTER_IMPORT,
            1,
        )
        ws_data = ws_data.replace("const P=useNavigate()", "const[,P]=wsNav()", 1)
        ws_file.write_text(ws_data)
        print(f"fixed router import in {ws_file.name}")
    elif "wsNav" in ws_data:
        print(f"word search router already fixed in {ws_file.name}")
    elif not word_search_files:
        print("MISSING WordSearch bundle")
    else:
        print(f"word search pattern not found in {ws_file.name}")

replacements = {
    "RighteousQuest": ("[D,Be]=H.useState(\"\")", f"[D,Be]=H{LAZY}"),
    "WordSearch": ("[I,re]=y.useState(\"\")", f"[I,re]=y{LAZY}"),
    "Crossword": ("[P,pe]=B.useState(\"\")", f"[P,pe]=B{LAZY}"),
}
for prefix, (old, new) in replacements.items():
    files = list((ROOT / "assets").glob(f"{prefix}*.js"))
    if not files:
        print(f"MISSING {prefix}")
        continue
    f = files[0]
    data = f.read_text()
    if old not in data:
        print(f"pattern missing in {f.name}")
        continue
    data = data.replace(old, new, 1)
    if prefix == "RighteousQuest":
        audio_hook = (
            'try{var __gkpMute=(()=>{try{return localStorage.getItem("gkp_mute_game_audio")==="1"'
            '||new URLSearchParams(location.search).get("game_audio")==="0"}catch(e){return false}})();'
            'if(__gkpMute){x.volume=0;x.muted=true}}catch(e){}'
        )
        audio_needle = 'x=new Audio("/Shattered_Crown.mp3");x.preload="auto"'
        if "__gkpMute" in data or "gkp_mute_game_audio" in data:
            print(f"game audio mute already in {f.name}")
        elif audio_needle in data:
            data = data.replace(
                audio_needle,
                audio_needle + ";" + audio_hook,
                1,
            )
            print(f"muted game audio in {f.name}")
        else:
            print(f"audio pattern missing in {f.name}")
    f.write_text(data)
    print(f"patched {f.name}")

scores_files = list((ROOT / "assets").glob("useGameScores*.js"))
if scores_files:
    f = scores_files[0]
    data = f.read_text()
    old = 'async function b(e){try{return(await(await fetch("/api/games/scores"'
    new = (
        'async function b(e){try{const n=(()=>{try{return localStorage.getItem("gkp_player_name")||""}'
        'catch(t){return""}})();n&&(!e.player_name||e.player_name==="Warrior"||e.player_name==="Seeker")'
        '&&(e={...e,player_name:n});return(await(await fetch("/api/games/scores"'
    )
    if old in data and "gkp_player_name" not in data:
        f.write_text(data.replace(old, new, 1))
        print(f"patched {f.name}")
    elif "gkp_player_name" in data:
        print("useGameScores already patched")
    else:
        print("useGameScores pattern missing")
