---
slug: security-update-march-2026
title: "安全更新：疑似供應鏈事件"
date: 2026-03-24T14:00:00
authors:
  - krrish
  - ishaan-alt
description: "截至 2026 年 3 月 24 日下午 2:00（ET）"
tags: [security, incident-report]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import VersionVerificationTable from '@site/src/components/VersionVerificationTable';

> **狀態：** 調查進行中
> **最後更新：** 2026 年 3 月 27 日

> **更新（3 月 30 日）：** LiteLLM 的全新**安全**版本現已可用（v1.83.0）。這是由我們新的 [CI/CD v2](https://docs.litellm.ai/blog/ci-cd-v2-improvements) 管線發佈，該管線加入了隔離環境、更強的安全閘道，以及更安全的 LiteLLM 發佈分離機制。

> **更新（3 月 27 日）：** 請查看 Townhall 更新，包括事件說明、我們已採取的措施，以及後續內容。[了解更多](https://docs.litellm.ai/blog/security-townhall-updates)

> **更新（3 月 27 日）：** 新增 [已驗證的安全版本](#verified-safe-versions) 區段，提供所有經審核的 PyPI 與 Docker 發佈版的 SHA-256 檢查碼。

> **更新（3 月 26 日）：** 新增 `checkmarx[.]zone` 至 [入侵指標](#indicators-of-compromise-iocs)

> **更新（3 月 25 日）：** 新增社群貢獻的腳本，用於掃描 GitHub Actions 與 GitLab CI 管線中是否使用了受影響版本。請參閱 [如何檢查您是否受影響](#how-to-check-if-you-are-affected)。感謝 [@Zach Fury](https://www.linkedin.com/in/fryware/) 提供這些腳本。

## 重點摘要； {#tldr}
- 受影響的 PyPI 套件為 **litellm==1.82.7** 與 **litellm==1.82.8**。這些套件於 2026 年 3 月 24 日 UTC 10:39 起上線，持續約 40 分鐘後遭 PyPI 隔離。
- 我們相信此入侵源自於我們 CI/CD 安全掃描工作流程中使用的 [Trivy 依賴項](https://www.aquasec.com/blog/trivy-supply-chain-attack-what-you-need-to-know/)。
- 使用官方 LiteLLM Proxy Docker 映像檔的客戶未受影響。該部署路徑在 requirements.txt 中固定依賴版本，且不依賴受影響的 PyPI 套件。
- ~~我們已暫停所有新的 LiteLLM 發佈，直到完成更廣泛的供應鏈審查並確認發佈路徑安全。~~ **更新：** 我們現在已透過新的 [CI/CD v2](https://docs.litellm.ai/blog/ci-cd-v2-improvements) 管線發佈了 LiteLLM 的全新**安全**版本（v1.83.0），該管線加入了隔離環境、更強的安全閘道，以及更安全的 LiteLLM 發佈分離機制。我們也已驗證程式碼庫是安全的，且未將惡意程式碼推送到 `main`。

## 概覽 {#overview}

LiteLLM AI Gateway 正在調查一起疑似供應鏈攻擊，涉及未經授權的 PyPI 套件發佈。目前證據顯示，一名維護者的 PyPI 帳戶可能已遭入侵，並被用來散布惡意程式碼。

目前我們認為此事件可能與更廣泛的 [Trivy 安全入侵](https://www.aquasec.com/blog/trivy-supply-chain-attack-what-you-need-to-know/) 有關；據報導，遭竊的憑證被用來未經授權存取 LiteLLM 發佈管線。

此調查仍在進行中。以下細節在我們確認更多發現後可能會變更。

## 已確認受影響版本 {#confirmed-affected-versions}

以下發佈到 PyPI 的 LiteLLM 版本受到影響：

- **v1.82.7**：在 LiteLLM AI Gateway `proxy_server.py` 中包含惡意負載
- **v1.82.8**：包含 `litellm_init.pth`，以及在 LiteLLM AI Gateway `proxy_server.py` 中包含惡意負載

如果您安裝或執行了這兩個版本中的任一版本，請立即查看以下建議。

注意：這些版本已從 PyPI 移除。

## 發生了什麼事 {#what-happened}

初步證據顯示，攻擊者繞過官方 CI/CD 工作流程，直接將惡意套件上傳到 PyPI。

這些受影響版本似乎包含一個憑證竊取程式，設計目的為：

- 透過掃描以下項目蒐集機密：
  - 環境變數
  - SSH 金鑰
  - 雲端提供者憑證（AWS、GCP、Azure）
  - Kubernetes 權杖
  - 資料庫密碼
- 透過對 `POST` 的 `models.litellm.cloud` 請求加密並外洩資料，該網域**不是**官方 BerriAI / LiteLLM 網域

## 受影響對象 {#who-is-affected}

如果以下**任何**情況為真，您可能受影響：

- 您在 **2026 年 3 月 24 日** **UTC 10:39 到 UTC 16:00** 之間，透過 `pip` 安裝或升級 LiteLLM
- 您執行 `pip install litellm` 時未固定版本，並收到 **v1.82.7** 或 **v1.82.8**
- 您在此時間窗內建置了一個包含 `pip install litellm` 但未固定版本的 Docker 映像檔
- 您專案中的依賴項以傳遞方式將 LiteLLM 拉入，且未固定版本
  （例如透過 AI 代理程式框架、MCP 伺服器或 LLM 協調工具）

如果以下**任何**情況為真，您**不**受影響：

**LiteLLM AI Gateway/Proxy 使用者：** 使用官方 LiteLLM Proxy Docker 映像檔的客戶未受影響。該部署路徑在 requirements.txt 中固定依賴版本，且不依賴受影響的 PyPI 套件。

- 您正在使用 **LiteLLM Cloud**
- 您正在使用官方 LiteLLM AI Gateway Docker 映像檔：`ghcr.io/berriai/litellm`
- 您使用的是 **v1.82.6 或更早版本**，且未在受影響期間升級
- 您是從 GitHub 儲存庫以原始碼安裝 LiteLLM，而該儲存庫**未**遭入侵

### 如何檢查您是否受影響 {#how-to-check-if-you-are-affected}

<Tabs>
<TabItem value="sdk" label="SDK">

```bash
pip show litellm
```
</TabItem>
<TabItem value="proxy" label="PROXY">

前往 Proxy base url，並檢查已安裝 LiteLLM 的版本。

![Proxy 版本檢查](../../img/security_update_march_2026/proxy_version.png)
</TabItem>
<TabItem value="github" label="GitHub Actions">

掃描 GitHub 組織中的所有儲存庫，尋找安裝了受影響版本的工作流程作業。

**需求：** Python 3 與 `requests`（`pip install requests`）。

**設定：**

```bash
export GITHUB_TOKEN="your-github-pat"
```

**執行：**

```bash
python find_litellm_github.py
```

將腳本中的 `ORG` 變數設定為您的 GitHub 組織名稱。

兩個腳本預設都只掃描 **今天** 的作業。若在其他日期執行，請調整 `WINDOW_START` 與 `WINDOW_END` 常數，以涵蓋 **2026 年 3 月 24 日**（事件日期）。

<details>
<summary>查看完整腳本（find_litellm_github.py）</summary>

```python
#!/usr/bin/env python3
"""
Scan all GitHub Actions jobs in a GitHub org that ran between
0800-1244 UTC today and identify any that installed litellm 1.82.7 or 1.82.8.

Adjust WINDOW_START / WINDOW_END to cover March 24, 2026 if running later.
"""

import io
import os
import re
import sys
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import requests

GITHUB_URL   = "https://api.github.com"
ORG          = "your-org"  # <-- set to your GitHub organization
TOKEN        = os.environ.get("GITHUB_TOKEN", "")

TODAY        = datetime.now(timezone.utc).date()
WINDOW_START = datetime(TODAY.year, TODAY.month, TODAY.day,  8,  0, 0, tzinfo=timezone.utc)
WINDOW_END   = datetime(TODAY.year, TODAY.month, TODAY.day, 12, 44, 0, tzinfo=timezone.utc)

TARGET_VERSIONS = {"1.82.7", "1.82.8"}
VERSION_PATTERN = re.compile(r"litellm[=\-](\d+\.\d+\.\d+)", re.IGNORECASE)

SESSION = requests.Session()
SESSION.headers.update({
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
})


def get_paginated(url, params=None):
    params = dict(params or {})
    params.setdefault("per_page", 100)
    page = 1
    while True:
        params["page"] = page
        resp = SESSION.get(url, params=params, timeout=30)
        if resp.status_code == 404:
            return
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict):
            items = next((v for v in data.values() if isinstance(v, list)), [])
        else:
            items = data
        if not items:
            break
        yield from items
        if len(items) < params["per_page"]:
            break
        page += 1


def parse_ts(ts_str):
    if not ts_str:
        return None
    return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))


def get_repos():
    repos = []
    for r in get_paginated(f"{GITHUB_URL}/orgs/{ORG}/repos", {"type": "all"}):
        repos.append({"id": r["id"], "name": r["name"], "full_name": r["full_name"]})
    return repos


def get_runs_in_window(repo_full_name):
    created_filter = (
        f"{WINDOW_START.strftime('%Y-%m-%dT%H:%M:%SZ')}"
        f"..{WINDOW_END.strftime('%Y-%m-%dT%H:%M:%SZ')}"
    )
    url = f"{GITHUB_URL}/repos/{repo_full_name}/actions/runs"
    runs = []
    for run in get_paginated(url, {"created": created_filter, "per_page": 100}):
        ts = parse_ts(run.get("run_started_at") or run.get("created_at"))
        if ts and WINDOW_START <= ts <= WINDOW_END:
            runs.append(run)
    return runs


def get_jobs_for_run(repo_full_name, run_id):
    url = f"{GITHUB_URL}/repos/{repo_full_name}/actions/runs/{run_id}/jobs"
    jobs = []
    for job in get_paginated(url, {"filter": "all"}):
        ts = parse_ts(job.get("started_at"))
        if ts and WINDOW_START <= ts <= WINDOW_END:
            jobs.append(job)
    return jobs


def fetch_job_log(repo_full_name, job_id):
    url = f"{GITHUB_URL}/repos/{repo_full_name}/actions/jobs/{job_id}/logs"
    resp = SESSION.get(url, timeout=60, allow_redirects=True)
    if resp.status_code in (403, 404, 410):
        return ""
    resp.raise_for_status()

    content_type = resp.headers.get("Content-Type", "")
    if "zip" in content_type or resp.content[:2] == b"PK":
        try:
            with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
                parts = []
                for name in sorted(zf.namelist()):
                    with zf.open(name) as f:
                        parts.append(f.read().decode("utf-8", errors="replace"))
                return "\n".join(parts)
        except zipfile.BadZipFile:
            pass
    return resp.text


def check_job(repo_full_name, job):
    job_id   = job["id"]
    job_name = job["name"]
    run_id   = job["run_id"]
    started  = job.get("started_at", "")

    log_text = fetch_job_log(repo_full_name, job_id)
    if not log_text:
        return None

    found_versions = set()
    context_lines  = []
    for line in log_text.splitlines():
        m = VERSION_PATTERN.search(line)
        if m:
            ver = m.group(1)
            if ver in TARGET_VERSIONS:
                found_versions.add(ver)
                context_lines.append(line.strip())

    if not found_versions:
        return None

    return {
        "repo":       repo_full_name,
        "run_id":     run_id,
        "job_id":     job_id,
        "job_name":   job_name,
        "started_at": started,
        "versions":   sorted(found_versions),
        "context":    context_lines[:10],
        "job_url":    job.get("html_url", f"https://github.com/{repo_full_name}/actions/runs/{run_id}"),
    }


def main():
    if not TOKEN:
        print("ERROR: Set GITHUB_TOKEN environment variable.", file=sys.stderr)
        sys.exit(1)

    print(f"Time window : {WINDOW_START.isoformat()} -> {WINDOW_END.isoformat()}")
    print(f"Hunting for : litellm {', '.join(sorted(TARGET_VERSIONS))}")
    print()

    print(f"Fetching repositories for org '{ORG}'...")
    repos = get_repos()
    print(f"  Found {len(repos)} repositories")
    print()

    jobs_to_check = []

    print("Scanning workflow runs for time window...")
    for repo in repos:
        full_name = repo["full_name"]
        try:
            runs = get_runs_in_window(full_name)
        except requests.HTTPError as e:
            print(f"  WARN: {full_name} - {e}", file=sys.stderr)
            continue
        if not runs:
            continue
        print(f"  {full_name}: {len(runs)} run(s) in window")
        for run in runs:
            try:
                jobs = get_jobs_for_run(full_name, run["id"])
            except requests.HTTPError as e:
                print(f"    WARN: run {run['id']} - {e}", file=sys.stderr)
                continue
            for job in jobs:
                jobs_to_check.append((full_name, job))

    total = len(jobs_to_check)
    print(f"\nFetching logs for {total} job(s)...")
    print()

    hits = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {
            pool.submit(check_job, full_name, job): (full_name, job["id"])
            for full_name, job in jobs_to_check
        }
        done = 0
        for future in as_completed(futures):
            done += 1
            full_name, jid = futures[future]
            try:
                result = future.result()
            except Exception as e:
                print(f"  ERROR {full_name} job {jid}: {e}", file=sys.stderr)
                continue
            if result:
                hits.append(result)
            print(
                f"  [{done}/{total}] {full_name} job {jid}" +
                (f"  *** HIT: litellm {result['versions']} ***" if result else ""),
                flush=True,
            )

    print()
    print("=" * 72)
    print(f"RESULTS: {len(hits)} job(s) installed litellm {' or '.join(sorted(TARGET_VERSIONS))}")
    print("=" * 72)

    if not hits:
        print("No matches found.")
        return

    for h in sorted(hits, key=lambda x: x["started_at"]):
        print()
        print(f"  Repo      : {h['repo']}")
        print(f"  Job       : {h['job_name']} (#{h['job_id']})")
        print(f"  Run ID    : {h['run_id']}")
        print(f"  Started   : {h['started_at']}")
        print(f"  Versions  : litellm {', '.join(h['versions'])}")
        print(f"  URL       : {h['job_url']}")
        print(f"  Log lines :")
        for line in h["context"]:
            print(f"    {line}")


if __name__ == "__main__":
    main()
```

</details>

</TabItem>
<TabItem value="gitlab" label="GitLab CI">

掃描 GitLab 群組（包含子群組）中的所有專案，尋找安裝了受影響版本的 CI/CD 作業。

**需求：** Python 3 與 `requests`（`pip install requests`）。

**設定：**

```bash
export GITLAB_TOKEN="your-gitlab-pat"
```

**執行：**

```bash
python find_litellm_jobs.py
```

將腳本中的 `GROUP_NAME` 變數設定為您的 GitLab 群組名稱。

兩個腳本預設都只掃描 **今天** 的作業。若在其他日期執行，請調整 `WINDOW_START` 與 `WINDOW_END` 常數，以涵蓋 **2026 年 3 月 24 日**（事件日期）。

<details>
<summary>查看完整腳本（find_litellm_jobs.py）</summary>

```python
#!/usr/bin/env python3
"""
Scan all GitLab CI/CD jobs in a GitLab group that ran between
0800-1244 UTC today and identify any that installed litellm 1.82.7 or 1.82.8.

Adjust WINDOW_START / WINDOW_END to cover March 24, 2026 if running later.
"""

import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import requests

GITLAB_URL = "https://gitlab.com"
GROUP_NAME = "YourGroup"  # <-- set to your GitLab group name
TOKEN = os.environ.get("GITLAB_TOKEN", "")

TODAY = datetime.now(timezone.utc).date()
WINDOW_START = datetime(TODAY.year, TODAY.month, TODAY.day, 8, 0, 0, tzinfo=timezone.utc)
WINDOW_END   = datetime(TODAY.year, TODAY.month, TODAY.day, 12, 44, 0, tzinfo=timezone.utc)

TARGET_VERSIONS = {"1.82.7", "1.82.8"}
VERSION_PATTERN = re.compile(r"litellm[=\-](\d+\.\d+\.\d+)", re.IGNORECASE)

HEADERS = {"PRIVATE-TOKEN": TOKEN}
SESSION = requests.Session()
SESSION.headers.update(HEADERS)


def get_paginated(url, params=None):
    params = dict(params or {})
    params.setdefault("per_page", 100)
    page = 1
    while True:
        params["page"] = page
        resp = SESSION.get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        if not data:
            break
        yield from data
        if len(data) < params["per_page"]:
            break
        page += 1


def get_group_id(group_name):
    resp = SESSION.get(f"{GITLAB_URL}/api/v4/groups/{group_name}", timeout=30)
    resp.raise_for_status()
    return resp.json()["id"]


def get_all_projects(group_id):
    projects = []
    for p in get_paginated(
        f"{GITLAB_URL}/api/v4/groups/{group_id}/projects",
        {"include_subgroups": "true", "archived": "false"},
    ):
        projects.append({"id": p["id"], "name": p["path_with_namespace"]})
    return projects


def parse_ts(ts_str):
    if not ts_str:
        return None
    ts_str = ts_str.replace("Z", "+00:00")
    return datetime.fromisoformat(ts_str)


def jobs_in_window(project_id):
    matching = []
    url = f"{GITLAB_URL}/api/v4/projects/{project_id}/jobs"
    params = {"per_page": 100, "scope[]": ["success", "failed", "canceled", "running"]}

    page = 1
    while True:
        params["page"] = page
        resp = SESSION.get(url, params=params, timeout=30)
        if resp.status_code == 403:
            return matching
        resp.raise_for_status()
        jobs = resp.json()
        if not jobs:
            break

        stop_early = False
        for job in jobs:
            ts = parse_ts(job.get("started_at") or job.get("created_at"))
            if ts is None:
                continue
            if ts > WINDOW_END:
                continue
            if ts < WINDOW_START:
                stop_early = True
                continue
            matching.append(job)

        if stop_early or len(jobs) < 100:
            break
        page += 1

    return matching


def fetch_trace(project_id, job_id):
    url = f"{GITLAB_URL}/api/v4/projects/{project_id}/jobs/{job_id}/trace"
    resp = SESSION.get(url, timeout=60)
    if resp.status_code in (403, 404):
        return ""
    resp.raise_for_status()
    return resp.text


def check_job(project_name, project_id, job):
    job_id   = job["id"]
    job_name = job["name"]
    ref      = job.get("ref", "")
    started  = job.get("started_at", job.get("created_at", ""))

    trace = fetch_trace(project_id, job_id)
    if not trace:
        return None

    found_versions = set()
    for match in VERSION_PATTERN.finditer(trace):
        ver = match.group(1)
        if ver in TARGET_VERSIONS:
            found_versions.add(ver)

    if not found_versions:
        return None

    context_lines = []
    for line in trace.splitlines():
        if VERSION_PATTERN.search(line):
            ver_match = VERSION_PATTERN.search(line)
            if ver_match and ver_match.group(1) in TARGET_VERSIONS:
                context_lines.append(line.strip())

    return {
        "project":    project_name,
        "project_id": project_id,
        "job_id":     job_id,
        "job_name":   job_name,
        "ref":        ref,
        "started_at": started,
        "versions":   sorted(found_versions),
        "context":    context_lines[:10],
        "job_url":    f"{GITLAB_URL}/{project_name}/-/jobs/{job_id}",
    }


def main():
    if not TOKEN:
        print("ERROR: Set GITLAB_TOKEN environment variable.", file=sys.stderr)
        sys.exit(1)

    print(f"Time window : {WINDOW_START.isoformat()} -> {WINDOW_END.isoformat()}")
    print(f"Hunting for : litellm {', '.join(sorted(TARGET_VERSIONS))}")
    print()

    print(f"Resolving group '{GROUP_NAME}'...")
    group_id = get_group_id(GROUP_NAME)

    print("Fetching projects...")
    projects = get_all_projects(group_id)
    print(f"  Found {len(projects)} projects")
    print()

    all_jobs_to_check = []

    print("Scanning job listings for time window...")
    for proj in projects:
        try:
            jobs = jobs_in_window(proj["id"])
        except requests.HTTPError as e:
            print(f"  WARN: {proj['name']} - {e}", file=sys.stderr)
            continue
        if jobs:
            print(f"  {proj['name']}: {len(jobs)} job(s) in window")
        for j in jobs:
            all_jobs_to_check.append((proj["name"], proj["id"], j))

    total = len(all_jobs_to_check)
    print(f"\nFetching traces for {total} job(s)...")
    print()

    hits = []
    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {
            pool.submit(check_job, pname, pid, job): (pname, job["id"])
            for pname, pid, job in all_jobs_to_check
        }
        done = 0
        for future in as_completed(futures):
            done += 1
            pname, jid = futures[future]
            try:
                result = future.result()
            except Exception as e:
                print(f"  ERROR checking {pname} job {jid}: {e}", file=sys.stderr)
                continue
            if result:
                hits.append(result)
            print(f"  [{done}/{total}] checked {pname} job {jid}" +
                  (f"  *** HIT: litellm {result['versions']} ***" if result else ""),
                  flush=True)

    print()
    print("=" * 72)
    print(f"RESULTS: {len(hits)} job(s) installed litellm {' or '.join(sorted(TARGET_VERSIONS))}")
    print("=" * 72)

    if not hits:
        print("No matches found.")
        return

    for h in sorted(hits, key=lambda x: x["started_at"]):
        print()
        print(f"  Project   : {h['project']}")
        print(f"  Job       : {h['job_name']} (#{h['job_id']})")
        print(f"  Branch/tag: {h['ref']}")
        print(f"  Started   : {h['started_at']}")
        print(f"  Versions  : litellm {', '.join(h['versions'])}")
        print(f"  URL       : {h['job_url']}")
        print(f"  Log lines :")
        for line in h["context"]:
            print(f"    {line}")


if __name__ == "__main__":
    main()
```

</details>

</TabItem>
</Tabs>

*由社群貢獻的 CI/CD 腳本（[原始 gist](https://gist.github.com/fryz/93ec8d4898ffe5b5ac5706a208823ef3)）。執行前請先審查。*

## 入侵指標（IoCs） {#indicators-of-compromise-iocs}

請檢查受影響系統是否有以下指標：

- 您的 `site-packages` 中存在 `litellm_init.pth`
- 對 `models.litellm[.]cloud` 的對外流量或請求
  此網域**不**隸屬於 LiteLLM
- 對 `checkmarx[.]zone` 的對外流量或請求
  此網域**不**隸屬於 LiteLLM

## 受影響使用者的立即行動 {#immediate-actions-for-affected-users}

如果您安裝或執行了 **v1.82.7** 或 **v1.82.8**，請立即採取以下行動。

### 1. 旋轉所有機密 {#1-rotate-all-secrets}

將受影響系統中存在的任何憑證視為已遭入侵，包括：

- API 金鑰
- 雲端存取金鑰
- 資料庫密碼
- SSH 金鑰
- Kubernetes 權杖
- 儲存在環境變數或組態檔中的任何機密

### 2. 檢查您的檔案系統 {#2-inspect-your-filesystem}

檢查您的 `site-packages` 目錄中是否有名為 `litellm_init.pth` 的檔案：

```bash
find /usr/lib/python3.13/site-packages/ -name "litellm_init.pth"
```

如果存在：

- 立即移除
- 調查主機是否有進一步入侵
- 若您的資安團隊正在進行鑑識，請保留相關證物

### 3. 稽核版本歷史 {#3-audit-version-history}

檢視您的：

- 本機環境
- CI/CD 管線
- Docker 建置
- 部署記錄

確認是否在任何地方安裝了 **v1.82.7** 或 **v1.82.8**。

將 LiteLLM 固定到已知安全的版本，例如 **v1.82.6 或更早版本**，或在稍後公告的已驗證版本。

## 回應與修復 {#response-and-remediation}

LiteLLM AI Gateway 團隊已採取以下步驟：

- 已從 PyPI 移除遭入侵的套件
- 已輪替維護者憑證並建立新的授權維護者
- 已邀請 Google 的 Mandiant 安全團隊協助分析建置與發布鏈的鑑識資料

## 驗證 Docker 映像簽章 {#verify-docker-image-signatures}

自 `v1.83.0-nightly` 起，所有發布到 GHCR 的 LiteLLM Docker 映像都已使用 [cosign](https://docs.sigstore.dev/cosign/overview/) 進行簽署。每個版本都使用在 [commit `0112e53`](https://github.com/BerriAI/litellm/commit/0112e53046018d726492c814b3644b7d376029d0) 中引入的相同金鑰簽署。

**使用固定的 commit hash 驗證（建議）：**

commit hash 在密碼學上不可變，因此這是確認您使用的是原始簽署金鑰的最強方式：

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/0112e53046018d726492c814b3644b7d376029d0/cosign.pub \
  ghcr.io/berriai/litellm:<release-tag>
```

**使用 release 標籤驗證（方便）：**

本儲存庫中的標籤受到保護，並會解析為相同的金鑰。此選項較容易閱讀，但仰賴標籤保護規則：

```bash
cosign verify \
  --key https://raw.githubusercontent.com/BerriAI/litellm/<release-tag>/cosign.pub \
  ghcr.io/berriai/litellm:<release-tag>
```

請將 `<release-tag>` 替換為您正在部署的版本（例如 `v1.83.0-stable`）。

預期輸出：

```
The following checks were performed on each of these signatures:
  - The cosign claims were validated
  - The signatures were verified against the specified public key
```

## 已驗證安全的版本 {#verified-safe-versions}

我們已審查在 v1.78.0 到 v1.82.6 之間發布的每個 LiteLLM 版本，涵蓋 PyPI 與 Docker。每個構件都已透過以下方式驗證：

1. 下載已發布的構件並計算其 SHA-256 摘要
2. 掃描已知的[入侵指標](#indicators-of-compromise-iocs)（IOC）
3. 將構件內容與 BerriAI/litellm 儲存庫中對應的 Git commit 進行比對

**下列列出的所有版本都已確認乾淨。**

<Tabs>
<TabItem value="pypi" label="PyPI 發布版本">

<VersionVerificationTable entries={[
  { version: "1.82.6", sha256: "164a3ef3e19f309e3cabc199bef3d2045212712fefdfa25fc7f75884a5b5b205", gitCommit: "38d477507dad" },
  { version: "1.82.5", sha256: "e1012ab816352215c4e00776dd48b0c68058b537888a8ff82cca62af19e6fb11", gitCommit: "1998c4f3703f" },
  { version: "1.82.4", sha256: "d37c34a847e7952a146ed0e2888a24d3edec7787955c6826337395e755ad5c4b", gitCommit: "cfeafbe38811" },
  { version: "1.82.3", sha256: "609901f6c5a5cf8c24386e4e3f50738bb8a9db719709fd76b208c8ee6d00f7a7", gitCommit: "61409275c8d8" },
  { version: "1.82.2", sha256: "641ed024774fa3d5b4dd9347f0efb1e31fa422fba2a6500aabedee085d1194cb", gitCommit: "f351bbdb3683" },
  { version: "1.82.1", sha256: "a9ec3fe42eccb1611883caaf8b1bf33c9f4e12163f94c7d1004095b14c379eb2", gitCommit: "94b002066e3a" },
  { version: "1.82.0", sha256: "5496b5d4532cccdc7a095c21cbac4042f7662021c57bc1d17be4e39838929e80", gitCommit: "6c6585af568e" },
  { version: "1.81.16", sha256: "d6bcc13acbd26719e07bfa6b9923740e88409cbf1f9d626d85fc9ae0e0eec88c", gitCommit: "678200ee4887" },
  { version: "1.81.15", sha256: "2fa253658702509ce09fe0e172e5a47baaadf697fb0f784c7fd4ff665ae76ae1", gitCommit: "2e819656cee9" },
  { version: "1.81.14", sha256: "6394e61bbdef7121e5e3800349f6b01e9369e7cf611e034f1832750c481abfed", gitCommit: "96bcee0b0af7" },
  { version: "1.81.13", sha256: "ae4aea2a55e85993f5f6dd36d036519422d24812a1a3e8540d9e987f2d7a4304", gitCommit: "cc957a19a560" },
  { version: "1.81.12", sha256: "219cf9729e5ea30c6d3f75aa43fef3c56a717369939a6d717cbad0fd78e3c146", gitCommit: "ba0d541b1982" },
  { version: "1.81.11", sha256: "06a66c24742e082ddd2813c87f40f5c12fe7baa73ce1f9457eaf453dc44a0f65", gitCommit: "231aedeeff7e" },
  { version: "1.81.10", sha256: "9efa1cbe61ac051f6500c267b173d988ff2d511c2eecf1c8f2ee546c0870747c", gitCommit: "7488abece8e7" },
  { version: "1.81.9", sha256: "24ee273bc8a62299fbb754035f83fb7d8d44329c383701a2bd034f4fd1c19084", gitCommit: "a09d3e9162eb" },
  { version: "1.81.8", sha256: "78cca92f36bc6c267c191d1fe1e2630c812bff6daec32c58cade75748c2692f6", gitCommit: "4fea649f519b" },
  { version: "1.81.7", sha256: "58466c88c3289c6a3830d88768cf8f307581d9e6c87861de874d1128bb2de90d", gitCommit: "3f6a281d0f7a" },
  { version: "1.81.6", sha256: "573206ba194d49a1691370ba33f781671609ac77c35347f8a0411d852cf6341a", gitCommit: "8da3a93e6e63" },
  { version: "1.81.5", sha256: "206505c5a0c6503e465154b9c979772be3ede3f5bf746d15b37dca5ae54d239f", gitCommit: "2cc3778761d4" },
  { version: "1.81.3", sha256: "3f60fd8b727587952ad3dd18b68f5fed538d6f43d15bb0356f4c3a11bccb2b92", gitCommit: "f30742fe6e8e" },
]} />

</TabItem>
<TabItem value="docker" label="Docker 映像">

<VersionVerificationTable entries={[
  { version: "1.82.3", sha256: "0a571da849db5f9c3cf3fead2ffbf1df982eebff7e7b38b46dbec3f640dafdbb", gitCommit: "61409275c8d8" },
  { version: "1.82.3-stable", sha256: "0c2b2a0ad3e50af1702fc493ecd07f22a5180b6d1cfb169440b429b40e340e29", gitCommit: "61409275c8d8" },
  { version: "1.82.0-stable", sha256: "71bf7283767ca436edcfa9f1f26c1743487b5fa29736c61c3eb6977776007c42", gitCommit: "97947c254252" },
  { version: "1.81.15", sha256: "303c31af87e7915e7b34d6c4d55a6ac753ef947a5deaa899e9ccfd3d1d58f7c2", gitCommit: "20bf3aa8070a" },
  { version: "1.81.14-stable", sha256: "a34f9758048231817d799b703fb998e40e2a5cbabb89ab95039fc30798f01b3c", gitCommit: "0435375b1271" },
  { version: "1.81.13", sha256: "a876f3f22f9b6fd481c9091c44a8a893d81c172d66dc2749298dcd3dc4a3d6f0", gitCommit: "cc957a19a560" },
  { version: "1.81.12-stable", sha256: "e24022878ccc87f57d808ac9304f18b87b8359e6556746d81cc20a5dc85f423a", gitCommit: "ba0d541b1982" },
  { version: "1.81.9-stable", sha256: "262e53d7702ed82579717faff0b08f7c0b7e9973a6406cfcc0e4af7826327627", gitCommit: "a09d3e9162eb" },
  { version: "1.81.3-stable", sha256: "dff82ccc32fb648927c090607887401c7e8ec814fe7c951beb95fe51073ca02b", gitCommit: "61ed8f9e0355" },
  { version: "1.81.0-stable", sha256: "f4913297d1bb3dc373eb8911a5ac816b597be9b5e08a91636b6c2786dd572aa8", gitCommit: "790a5ce0b323" },
  { version: "1.80.15-stable", sha256: "0b4ec3861e978b4aa254f4070f292cd345496a5fb59c72e1ee21cd6db94b670b", gitCommit: "17c8d8d109b5" },
  { version: "1.80.11-stable", sha256: "4068108d9101cd2affba3924310fd7f34f23d14e36dd4853733898b9e04d81ca", gitCommit: "57e07bddd341" },
  { version: "1.80.8-stable", sha256: "0304c2eb1f3cf54262d1b4e0629487232bab459e95b99a21e5810231d2b27021", gitCommit: "3381d63152f8" },
  { version: "1.80.5-stable", sha256: "a89e173135fff96af4b5b91ea31845164eadcf6497c82adeb64c36a23c8a3d11", gitCommit: "6c49b95a4ab7" },
  { version: "1.80.0-stable", sha256: "a3416f4cd0c896c94a1f526d872ff6c19bee22ff4afcdcc6f9ff690707900176", gitCommit: "98365205acd0" },
  { version: "1.79.3-stable", sha256: "27aae83d6ab6cb0b63bf8179e375ce0e11f5cfef51f2675b0c1e60c6f546dbc1", gitCommit: "c0548542d4a9" },
  { version: "1.79.1-stable", sha256: "7780d29a9543c4ce762430db7dfb0640105f7357fc38e35bf3fb7bbb1e6ba63f", gitCommit: "c217bddb59ba" },
  { version: "1.79.0-stable", sha256: "32bf6ac059a56641e11e4712f63b8467c295f988b6c160dc7229660417ee44bd", gitCommit: "8d495f56a9cc" },
  { version: "1.78.5-stable", sha256: "d5e607648eafa15edc63b0b1a5ed01f8b31a1fa0c80f7d25b252ae18a593ee29", gitCommit: "c471bf1f16c2" },
  { version: "1.78.0-stable", sha256: "7a56b32dc7153763d31c0a056123dc878a598959935d8c7daacb1fca5272c205", gitCommit: "5fde83d9f154" },
]} />

</TabItem>
</Tabs>

## 問題與支援 {#questions-and-support}

如果您認為您的系統可能受到影響，請立即聯絡我們：

- **安全性：** `security@berri.ai`
- **支援：** `support@berri.ai`
- **Slack：** 直接聯絡 LiteLLM 團隊

如需即時更新，請追蹤 [X 上的 LiteLLM (YC W23)](https://x.com/LiteLLM)。
