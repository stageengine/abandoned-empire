#!/bin/sh
# Clone the source the port is generated from, at the commit it was read at.
# Everything it fetches lands in source/, which is not tracked here: it is
# Infocom's repository rather than this one, and NOTICE.md says where it came
# from and under what licence.
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
