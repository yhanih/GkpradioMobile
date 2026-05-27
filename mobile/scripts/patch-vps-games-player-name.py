#!/usr/bin/env python3
from pathlib import Path

ROOT = Path("/var/www/vhosts/godkingdomprinciplesradio.com/httpdocs")
LAZY = '.useState(()=>{try{return localStorage.getItem("gkp_player_name")||""}catch(e){return""}})'

index = ROOT / "index.html"
text = index.read_text()
bridge = """    <script>
      (function () {
        try {
          var params = new URLSearchParams(window.location.search);
          var name = params.get("player_name");
          if (name && name.trim()) {
            localStorage.setItem("gkp_player_name", name.trim().slice(0, 100));
          }
        } catch (e) {}
      })();
    </script>
"""
if "gkp_player_name" not in text:
    text = text.replace('    <script type="module"', bridge + '    <script type="module"')
    index.write_text(text)
    print("index.html updated")
else:
    print("index.html already has bridge")

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
    f.write_text(data.replace(old, new, 1))
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
