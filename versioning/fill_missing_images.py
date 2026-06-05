#!/usr/bin/env python3
"""Restore historical images referenced by versioned docs but missing today.

Snapshotted docs reference repo-root images via relative paths like
`../../img/foo.png`. Because `versioned_docs/version-X/` sits one level deeper
than `docs/`, those refs resolve to `versioned_docs/img/...`, which we expose as
a symlink to the repo-root `img/`. That covers every image still present today.

A few images referenced by OLD docs were later removed/renamed in `img/`. This
script finds those, and restores each from the newest release commit that still
had it (written back into `img/`, which the symlink then resolves). Targeted: it
only restores images actually referenced by a snapshot.
"""
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
MANIFEST = os.path.join(HERE, "manifest.json")

# ](../img/x), src="../../img/x", require('../img/x'), etc.
REF_RE = re.compile(r'(?:\]\(|src=["\']|require\(\s*["\'])((?:\.\./)+img/[^)"\'\s]+)')


def git_show(sha, path):
    return subprocess.run(
        ["git", "-C", REPO, "show", f"{sha}:{path}"],
        capture_output=True,
    )


def main():
    commits = [e["source_commit"] for e in json.load(open(MANIFEST))["versions"]]
    # newest first, de-duplicated
    seen, newest_first = set(), []
    for c in reversed(commits):
        if c not in seen:
            seen.add(c)
            newest_first.append(c)

    vdocs = os.path.join(REPO, "versioned_docs")
    refs = set()
    for root, _dirs, files in os.walk(vdocs):
        # don't scan the img symlink target
        if os.path.basename(root) == "img":
            continue
        for fn in files:
            if not fn.endswith((".md", ".mdx")):
                continue
            try:
                txt = open(os.path.join(root, fn), encoding="utf-8").read()
            except OSError:
                continue
            for m in REF_RE.finditer(txt):
                rest = m.group(1).split("img/", 1)[1]
                rest = rest.split("#")[0].split("?")[0]
                refs.add(rest)

    restored, unresolved = [], []
    for rest in sorted(refs):
        target = os.path.join(REPO, "img", rest)
        if os.path.exists(target):
            continue
        found = False
        for sha in newest_first:
            res = git_show(sha, f"img/{rest}")
            if res.returncode == 0 and res.stdout:
                os.makedirs(os.path.dirname(target), exist_ok=True)
                with open(target, "wb") as f:
                    f.write(res.stdout)
                restored.append(rest)
                found = True
                break
        if not found:
            unresolved.append(rest)

    print(f"[fill-missing-images] restored {len(restored)} image(s) into img/")
    for r in restored:
        print(f"   restored: {r}")
    if unresolved:
        print(f"[fill-missing-images] WARNING: {len(unresolved)} ref(s) "
              f"not found in any release commit (will 404 / break build):")
        for r in unresolved:
            print(f"   unresolved: {r}")
    return 1 if unresolved else 0


if __name__ == "__main__":
    sys.exit(main())
