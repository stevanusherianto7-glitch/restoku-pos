#!/usr/bin/env python3
"""Strip unused imports flagged by eslint no-unused-vars (v3, robust).

Handles:
- default + named: `import X, { a, b } from 'm'`
- named-only: `import { a, b } from 'm'`
- type-only statement: `import type { A, B } from 'm'`
- inline type: `import { type A, b } from 'm'`
- multi-line import blocks (braces span lines)
- skips bare `type` / `e` tokens (event params, not imports)

Default: dry-run. Use --apply to write.
"""
import json, re, subprocess, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def sym_of(p: str) -> str:
    p = re.sub(r"^type\s+", "", p.strip())
    return p.split(" as ")[0].strip()

def run_eslint():
    return json.loads(subprocess.check_output(
        ["npx.cmd", "eslint", "resources/js", "-f", "json"],
        cwd=ROOT, text=True, shell=True))

def clean_import_block(text: str, unused):
    """text = the full import statement (may be multiline). Returns cleaned or None."""
    # type-only whole statement
    m_type = re.match(r"\s*import\s+type\s*\{([^}]*)\}\s*from\s*['\"]([^'\"]+)['\"]", text, re.S)
    if m_type:
        parts = [p.strip() for p in m_type.group(1).split(",") if p.strip()]
        kept = [p for p in parts if sym_of(p) not in unused]
        return f"import type {{ {', '.join(kept)} }} from '{m_type.group(2)}'" if kept else None
    m = re.search(r"import\s+(.+?)\s+from\s+['\"]([^'\"]+)['\"]", text, re.S)
    if not m:
        return text
    clause, mod = m.group(1), m.group(2)
    named = re.search(r"\{([^}]*)\}", clause)
    if not named:
        return text
    parts = [p.strip() for p in named.group(1).split(",") if p.strip()]
    kept = [p for p in parts if sym_of(p) not in unused]
    head = clause[:named.start()].rstrip().rstrip(",").strip()
    if not kept:
        return f"import {head} from '{mod}'" if head else None
    inner = "{ " + ", ".join(kept) + " }"
    return f"import {head}, {inner} from '{mod}'" if head else f"import {inner} from '{mod}'"

def main():
    apply = "--apply" in sys.argv
    data = run_eslint()
    by_file = {}
    for f in data:
        for msg in f.get("messages", []):
            if "is defined but never used" in msg.get("message", ""):
                s = msg["message"].split("'")[1]
                if s in ("type", "e"):  # skip event-param / type-keyword false positives
                    continue
                by_file.setdefault(f["filePath"], set()).add(s)

    total = 0
    for fpath, unused in by_file.items():
        if not os.path.isabs(fpath) or not os.path.exists(fpath):
            continue
        with open(fpath, encoding="utf-8") as fh:
            src = fh.read()
        # find import statements (greedy across newlines up to `from '...'`)
        new_src, n = re.subn(
            r"import\s+[^;]*?from\s*['\"][^'\"]+['\"]\s*;?",
            lambda mo: (clean_import_block(mo.group(0), unused) or ""),
            src, flags=re.S)
        if n:
            total += 1
            if apply:
                with open(fpath, "w", encoding="utf-8") as fh:
                    fh.write(new_src)
                print(f"cleaned {os.path.relpath(fpath, ROOT)} ({n} import(s))")
            else:
                print(f"[dry] {os.path.relpath(fpath, ROOT)}: {sorted(unused)}")
    print(f"\n=== {total} files {'modified' if apply else 'would be cleaned'} ===")

if __name__ == "__main__":
    main()
