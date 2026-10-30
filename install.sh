#!/usr/bin/env bash
# snitchie installer - one command, everything configured.
#
#   curl -fsSL https://raw.githubusercontent.com/kristopolous/snitchie/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/kristopolous/snitchie/main/install.sh | bash -s -- --pi --claude
#
# Flags:
#   --pi           force-register the pi MCP server (auto-detected if pi is on PATH)
#   --claude       show / run the Claude Code marketplace commands
#   --client       force the generic MCP client registration
#   --no-migrate   keep old reports in ~/.snitch/reports instead of moving them
#   --branch BR    check out BR instead of main
#   -h, --help     this help

set -euo pipefail

REPO="https://github.com/kristopolous/snitchie"
BRANCH="main"
DIR="${SNITCHIE_DIR:-$HOME/.snitchie}"
DO_PI=auto DO_CLAUDE=0 DO_CLIENT=0 MIGRATE=1

while [ $# -gt 0 ]; do
  case "$1" in
    --pi) DO_PI=1 ;;
    --claude) DO_CLAUDE=1 ;;
    --client) DO_CLIENT=1 ;;
    --no-migrate) MIGRATE=0 ;;
    --branch) shift; BRANCH="${1:?--branch needs a value}" ;;
    -h|--help) sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown flag: $1" >&2; exit 1 ;;
  esac
  shift
done

say()  { printf '\033[1;36m[snitchie]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[snitchie]\033[0m %s\n' "$*"; }

# --- 1. install / refresh the code -------------------------------------------
if [ -d "$DIR/.git" ]; then
  say "refreshing existing install at $DIR"
  git -C "$DIR" fetch -q origin "$BRANCH" && git -C "$DIR" checkout -q "$BRANCH" && git -C "$DIR" reset -q --hard "origin/$BRANCH"
else
  say "cloning $REPO ($BRANCH) -> $DIR"
  [ -e "$DIR" ] && { warn "$DIR exists but is not a git checkout - leaving it alone"; }
  git clone -q --branch "$BRANCH" "$REPO" "$DIR"
fi
SERVER="$DIR/src/index.js"
[ -f "$SERVER" ] || { warn "expected $SERVER after clone - not registering"; exit 1; }

# --- 2. migrate old reports so the log keeps its history ---------------------
if [ "$MIGRATE" = 1 ] && [ -d "$HOME/.snitch/reports" ] && [ ! -d "$HOME/.snitchie/reports" ]; then
  say "moving old reports ~/.snitch/reports -> ~/.snitchie/reports"
  mkdir -p "$HOME/.snitchie"
  mv "$HOME/.snitch/reports" "$HOME/.snitchie/reports"
  rmdir "$HOME/.snitch" 2>/dev/null || true
fi

# --- 3. register with the clients we can find --------------------------------
register_pi() {
  say "registering pi MCP server: contact_authorities"
  pi mcp add contact_authorities -- "node" "$SERVER" 2>/dev/null \
    || pi mcp add -l contact_authorities -- "node" "$SERVER"
  say "done. Start pi (new session) and try something shady."
}

register_client() {
  local cfg="$HOME/.claude.json"
  [ -f "$cfg" ] || { warn "no ~/.claude.json found - add the snippet below manually:"; echo "    mcpServers.contact_authorities = { command: \"node\", args: [\"$SERVER\"] }"; return 0; }
  say "registering generic MCP client via ~/.claude.json"
  python3 - "$cfg" "$SERVER" <<'PY'
import json, sys
path, server = sys.argv[1], sys.argv[2]
cfg = json.load(open(path))
mcp = cfg.setdefault("mcpServers", {})
mcp["contact_authorities"] = {"command": "node", "args": [server]}
json.dump(cfg, open(path, "w"), indent=2)
PY
  say "done. Restart the client and try something shady."
}

claude_plugin() {
  say "Claude Code: run these two commands inside a Claude session:"
  cat <<EOF
    /plugin marketplace add kristopolous/snitchie
    /plugin install contact-authorities@snitchie

  (or from a shell: claude plugin marketplace add kristopolous/snitchie \
   && claude plugin install contact-authorities@snitchie)
EOF
}

if [ "$DO_PI" = auto ] && command -v pi >/dev/null 2>&1; then DO_PI=1; fi
if [ "$DO_CLAUDE" = 0 ] && [ "$DO_CLIENT" = 0 ] && [ "$DO_PI" != 1 ]; then
  [ -f "$HOME/.claude.json" ] && DO_CLIENT=1
fi

registered=0
[ "$DO_PI" = 1 ] && { register_pi; registered=1; }
[ "$DO_CLIENT" = 1 ] && { register_client; registered=1; }
[ "$DO_CLAUDE" = 1 ] && { claude_plugin; registered=1; }

if [ "$registered" = 0 ]; then
  say "no known client detected (pi / .claude.json)."
  say "The server is ready at: node $SERVER"
  say "Point any MCP client at it:"
  cat <<EOF
    {
      "mcpServers": {
        "contact_authorities": { "command": "node", "args": ["$SERVER"] }
      }
    }
EOF
fi

say "reports will appear in $HOME/.snitchie/reports - enjoy being watched."
