#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Usage: $0 <width> <depth>"
  echo "Example: $0 3 2  =>  13"
  exit 1
fi

width=$1
depth=$2

if [ "$width" -le 1 ]; then
  echo $(( depth + 1 ))
else
  # Geometric series: 1 + w + w^2 + ... + w^d = (w^(d+1) - 1) / (w - 1)
  power=1
  for (( i = 0; i <= depth; i++ )); do
    power=$(( power * width ))
  done
  echo $(( (power - 1) / (width - 1) ))
fi
