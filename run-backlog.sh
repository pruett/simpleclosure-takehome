#!/usr/bin/env bash
# Outer loop: build the tasks/ kanban backlog one card at a time.
# Each task runs in a BRAND-NEW `claude` process = fresh context window.
#
# Flow per task:  next-task.mjs (select)  ->  format-prompt.mjs (validate + render)  ->  claude -p
# The prompt template lives in AGENT_LOOP.md (this script holds none); format-prompt.mjs fills its
# {{...}} placeholders from the selected card's JSON. We stream the agent's progress to the terminal.
#
# Usage:
#   ./run-backlog.sh          # run until the backlog is done or a card blocks
#   ./run-backlog.sh once     # build a single next task, then exit (for a /loop wrapper)
set -uo pipefail
cd "$(dirname "$0")"

MAX_TURNS="${MAX_TURNS:-50}"          # per-task safety cap
LOGDIR="${LOGDIR:-.agent-runs}"       # raw stream-json is tee'd here per run
DEFAULT_MODEL="${DEFAULT_MODEL:-opus}"  # used when a card omits "model"
mkdir -p "$LOGDIR"

# Optional sandbox settings file: `SANDBOX_SETTINGS=path ./run-backlog.sh`
SETTINGS_ARG=()
[ -n "${SANDBOX_SETTINGS:-}" ] && SETTINGS_ARG=(--settings "$SANDBOX_SETTINGS")

# jq filter: turn the stream-json event feed into readable terminal output — the
# agent's text, each tool it calls, tool results, and the final result line.
#  = ESC (ANSI colour); 36=cyan 32=green 2=dim, 0=reset.
JQ_STREAM='
  def dim:   "[2m" + . + "[0m";
  def cyan:  "[36m" + . + "[0m";
  def green: "[32m" + . + "[0m";
  if .type == "system" and .subtype == "init" then
    ("> session \(.session_id[0:8]) · \(.model // "?")" | dim) + "\n\n"
  elif .type == "assistant" then
    ( .message.content[]? |
        if .type == "text" then .text
        elif .type == "tool_use" then
          "\n" + ("* \(.name)" | cyan) + " " + ((.input | tostring)[0:200]) + "\n"
        else empty end )
  elif .type == "user" then
    ( .message.content[]? |
        if .type == "tool_result" then
          ( .content | if type == "array" then (map(.text // "") | join(" ")) else tostring end ) as $t
          | ("  -> " + $t[0:200] | dim) + "\n"
        else empty end )
  elif .type == "result" then
    "\n" + ("[done] \(.subtype) — \(.num_turns) turns, \((.duration_ms // 0) / 1000 | floor)s" | green) + "\n"
  else empty end
'

run_one() {
  local sel; sel="$(node scripts/next-task.mjs)"
  case "$sel" in
    DONE)    echo "All tasks done.";                                              return 10 ;;
    BLOCKED) echo "A card is in tasks/blocked/ — review it, then re-run.";        return 11 ;;
    STUCK)   echo "Backlog tasks remain but none are actionable (depends_on).";   return 12 ;;
  esac

  local task_path="$sel"
  local id; id="$(basename "$task_path" .json)"
  local prompt
  if ! prompt="$(node scripts/format-prompt.mjs "$task_path")"; then
    echo "Task ${id} failed validation (see errors above); fix the card and re-run."; return 13
  fi

  # Card's "model" (already schema-validated above), or the default when omitted.
  local model; model="$(node -e 'try{process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).model||"")}catch{}' "$task_path")"
  model="${model:-$DEFAULT_MODEL}"

  echo ""
  echo "════════════════════════════════════════════════════"
  echo "Task ${id}   —   fresh context window   ·   ${model}"
  echo "════════════════════════════════════════════════════"

  claude \
    --print \
    --model "$model" \
    --fallback-model sonnet \
    --dangerously-skip-permissions \
    --disallowedTools EnterPlanMode \
    --max-turns "$MAX_TURNS" \
    ${SETTINGS_ARG[@]+"${SETTINGS_ARG[@]}"} \
    --verbose \
    --output-format stream-json \
    "$prompt" \
  | { grep --line-buffered '^{' || true; } \
  | tee "$LOGDIR/${id}.jsonl" \
  | jq --unbuffered -rj "$JQ_STREAM"

  local rc=${PIPESTATUS[0]}
  [ "$rc" -ne 0 ] && { echo "claude exited ${rc} on task ${id}; stopping."; return 1; }
  return 0
}

if [ "${1:-}" = "once" ]; then
  run_one; exit $?
fi

while : ; do
  run_one; rc=$?
  [ "$rc" -ne 0 ] && exit "$rc"
done
