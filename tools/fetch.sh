#!/bin/sh
set -e

commit=97b7b3d68c075dd9af7da499c3e9690ada3471fd
here=$(cd "$(dirname "$0")/.." && pwd)

mkdir -p "$here/source"

if [ ! -d "$here/source/zork1/.git" ]; then
    git clone https://github.com/historicalsource/zork1.git "$here/source/zork1"
fi

cd "$here/source/zork1"
git fetch --depth 1 origin "$commit" 2>/dev/null || git fetch origin
git checkout --quiet "$commit"

echo "source/zork1 at $commit"
