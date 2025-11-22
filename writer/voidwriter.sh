#!/usr/bin/env bash

# Helper wrapper for VoidWriter CLI
#
# Modes:
#   text       - Run VoidWriter, wait for completion, print only the captured text
#   json       - Run VoidWriter, wait for completion, print the final JSON result
#   perpetual  - Run VoidWriter in save-to-disk mode, keep server running
#                Usage: voidwriter.sh perpetual /path/to/output.txt [extra args...]
#
# Any additional arguments after the mode (and output file for perpetual) are
# passed directly through to voidwriter.js (e.g. --title, --main-text, --timeout, etc.).
#
# Examples:
#   ./run-voidwriter.sh text --title "QUESTION" --main-text "Describe the bug" --shutdown-on-save
#   ./run-voidwriter.sh json --title "REQUIREMENTS" --main-text "Describe the project" --no-open
#   ./run-voidwriter.sh perpetual /tmp/voidwriter-output.txt --title "NOTES" --main-text "Start typing" --no-open

set -euo pipefail

MODE="${1:-}"
if [[ -z "${MODE}" ]]; then
  echo "Usage: $0 {text|json|perpetual} [output-file] [extra voidwriter args...]" >&2
  exit 1
fi
shift

# Resolve project root so this works from any directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI="${ROOT_DIR}/voidwriter.js"

if [[ ! -f "${CLI}" ]]; then
  echo "Error: voidwriter.js not found at ${CLI}" >&2
  exit 1
fi

case "${MODE}" in
  text)
    # Run VoidWriter, capture final JSON line, output .text field
    # Suppress the CLI's banner output to keep stdout clean for the caller.
    RAW_OUTPUT="$(node "${CLI}" "$@" 2>/dev/null | tail -n 1)"

    if command -v jq >/dev/null 2>&1; then
      echo "${RAW_OUTPUT}" | jq -r '.text'
    else
      echo "[run-voidwriter.sh] jq not found; printing raw JSON result" >&2
      echo "${RAW_OUTPUT}"
    fi
    ;;

  json)
    # Run VoidWriter and print only the final JSON line
    node "${CLI}" "$@" 2>/dev/null | tail -n 1
    ;;

  perpetual)
    # Perpetual mode: write buffer to disk on Save and keep server running
    if [[ $# -lt 1 ]]; then
      echo "Usage: $0 perpetual /path/to/output.txt [extra voidwriter args...]" >&2
      exit 1
    fi
    OUTPUT_FILE="$1"
    shift

    # Ensure parent directory exists (if path has a directory component)
    OUTPUT_DIR="$(dirname "${OUTPUT_FILE}")"
    if [[ -n "${OUTPUT_DIR}" && "${OUTPUT_DIR}" != "." ]]; then
      mkdir -p "${OUTPUT_DIR}"
    fi

    echo "Starting VoidWriter in perpetual mode..." >&2
    echo "  Save path : ${OUTPUT_FILE}" >&2
    echo "  Note: session ends on timeout or when you stop this process (Ctrl+C)." >&2

    # In perpetual mode we:
    #   - Force save-mode to 'disk' so each Save overwrites OUTPUT_FILE
    #   - Do NOT set --shutdown-on-save so the server keeps running
    node "${CLI}" \
      --save-mode disk \
      --save-path "${OUTPUT_FILE}" \
      "$@"
    ;;

  *)
    echo "Unknown mode: ${MODE}" >&2
    echo "Usage: $0 {text|json|perpetual} [output-file] [extra voidwriter args...]" >&2
    exit 1
    ;;

esac
