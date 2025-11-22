#!/usr/bin/env bash

# Source this file to add convenient VoidWriter aliases to your shell.
#
#   source /path/to/repo/voidwriter-aliases.sh
#
# Aliases:
#   vw-text       - Run writer/voidwriter.js via writer/voidwriter.sh text mode
#   vw-json       - Run writer/voidwriter.js via writer/voidwriter.sh json mode
#   vw-perpetual  - Run writer/voidwriter.js via writer/voidwriter.sh perpetual mode
#
# These assume the repository root is this file's directory.

_repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_writer_cli="${_repo_root}/writer/voidwriter.js"
_writer_wrapper="${_repo_root}/writer/voidwriter.sh"

if [[ ! -f "${_writer_cli}" ]]; then
  echo "[voidwriter-aliases] warning: writer/voidwriter.js not found at ${_writer_cli}" >&2
fi

if [[ ! -x "${_writer_wrapper}" ]]; then
  # Make wrapper executable if it exists
  if [[ -f "${_writer_wrapper}" ]]; then
    chmod +x "${_writer_wrapper}" 2>/dev/null || true
  fi
fi

alias vw-text="\"${_writer_wrapper}\" text"
alias vw-json="\"${_writer_wrapper}\" json"
alias vw-perpetual="\"${_writer_wrapper}\" perpetual"

unset _repo_root _writer_cli _writer_wrapper
