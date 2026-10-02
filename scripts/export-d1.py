#!/usr/bin/env python3
"""Export a consistent SQLite backup as D1-compatible SQL (contains private data)."""
import argparse
import os
import sqlite3
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('database', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
with sqlite3.connect(args.database.resolve().as_uri() + '?mode=ro', uri=True) as db:
    if db.execute('PRAGMA integrity_check').fetchall() != [('ok',)]:
        raise SystemExit('Database failed integrity check')
    statements = [s for s in db.iterdump() if s not in ('BEGIN TRANSACTION;', 'COMMIT;')]
    if any(len(s.encode()) > 100_000 for s in statements):
        raise SystemExit('A SQL statement exceeds D1 limits; split the affected record before import')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as f:
        f.write('\n'.join(statements) + '\n')
    print('Exported SQLite backup to D1 SQL; keep this file private.')
