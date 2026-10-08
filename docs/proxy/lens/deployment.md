---
title: "Deployment"
description: "將 ClickHouse 和 Lens worker 新增至您的 LiteLLM 閘道。"
slug: "/proxy/lens/deployment"
---

# 部署 {#deployment}

import AgentDeployPrompt from '@site/src/components/AgentDeployPrompt';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 設定 Lens {#quick-start}

Lens 與 LiteLLM 並行執行。worker 會調查已記錄的活動，ClickHouse 儲存追蹤記錄，而 PostgreSQL 儲存調查結果和設定。worker 只需要存取 LiteLLM，不需要提供者金鑰或資料庫憑證

![LiteLLM Lens 架構：您的代理程式將 LLM 請求和追蹤記錄傳送到 LiteLLM，LiteLLM 將追蹤記錄儲存在 ClickHouse 中；Lens worker 會向 LiteLLM 輪詢以進行調查。](/img/lens-architecture.svg)

| Component | 它的功能 | 我們使用的內容 |
| --- | --- | --- |
| LiteLLM proxy | 接收追蹤記錄，提供 Lens UI 和 API | [`ghcr.io/berriai/litellm`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 並已啟用 [追蹤](#configure-an-existing-proxy) |
| ClickHouse (new) | 儲存追蹤記錄和請求日誌 | [`clickhouse/clickhouse-server:26.9.6.6`](https://hub.docker.com/r/clickhouse/clickhouse-server/tags?name=26.9.6.6) |
| Lens worker (new) | 在您的基礎架構上執行調查。它透過 HTTPS 向 LiteLLM 輪詢，且不需要資料庫存取權或提供者金鑰 | [`ghcr.io/berriai/litellm-lens-worker-dev`](https://github.com/BerriAI/litellm/pkgs/container/litellm-lens-worker-dev)、[`deploy/lens/compose.yaml`](https://github.com/BerriAI/litellm/blob/main/deploy/lens/compose.yaml) |
| PostgreSQL | 儲存 lenses、調查結果和金鑰 | 您現有的 LiteLLM 資料庫，或來自本機追蹤堆疊的 PostgreSQL |

請在下方選擇您的起點。新的安裝可以使用 Docker Compose 啟動全部四個服務。現有使用者可以保留其部署，僅新增所需的服務。如果已安裝 Lens，請前往 [升級](#upgrade-litellm-and-the-worker)

從相同的原始碼提交點建置 LiteLLM 及其 worker，並使用相同的發行識別

<Tabs groupId="lens-install" queryString="install">
<TabItem value="compose" label="新的本機安裝" default>

現有的追蹤堆疊會啟動 LiteLLM、PostgreSQL 和 ClickHouse。從相同的 checkout 建置其獨立的 Lens worker，然後透過儀表板將其連接

#### 1. 建置並啟動 LiteLLM {#1-build-and-start-litellm}

安裝 [支援 Compose 的 Docker](https://docs.docker.com/compose/install/) 和 Git。執行：

```bash
git clone https://github.com/BerriAI/litellm.git
cd litellm
export LITELLM_RELEASE_TAG="sha-$(git rev-parse HEAD)"
export LENS_WORKER_IMAGE="litellm-lens-worker:${LITELLM_RELEASE_TAG}"
export OPENAI_API_KEY='sk-...'
docker build --build-arg LITELLM_RELEASE_TAG="$LITELLM_RELEASE_TAG" \
  -f deploy/lens/Dockerfile -t "$LENS_WORKER_IMAGE" .
export LITELLM_MASTER_KEY="${LITELLM_MASTER_KEY:-sk-$(openssl rand -hex 16)}"
docker compose -f docker/docker-compose.tracing.yml up -d --build
```

在啟動前，將 `sk-...` 替換為您的 OpenAI 金鑰，或在 `docker/tracing-config.yaml` 中設定其他提供者。第一次建置需要幾分鐘。兩個映像都會從相同的 checkout 在本機建置

開啟 [http://localhost:4002/ui/](http://localhost:4002/ui/)，並使用您的 `LITELLM_MASTER_KEY` 以 `admin` 身分登入

#### 2. 連接 worker {#2-connect-the-worker}

前往 **Lens > Investigations > Connect worker**，選擇分析模型和每月預算，然後按 **Get install command**。展開 **Using Docker Compose or Helm?** 並複製 worker token

![為 Docker Compose 或 Helm 複製私有 worker token](/img/lens/worker-install.png)

在相同的終端機中，於 gateway 的 Docker 網路上啟動 worker：

```bash
export LITELLM_URL=http://litellm:4000
export LENS_WORKER_TOKEN='<paste-your-worker-token>'
docker compose -f docker/docker-compose.tracing.yml -f deploy/lens/compose.yaml up -d
```

當儀表板顯示 **Worker connected** 時，請 [傳送您的第一個追蹤記錄](./first-trace.md)。請將 token 保密，並將其保存供重新啟動和升級時使用

此堆疊適用於本機評估。它會繫結至 localhost，並使用開發資料庫憑證。對於代管安裝，請使用您正常的 ingress、私有憑證和資料庫備份。請保留兩個資料庫磁碟區；升級時不要使用 `docker compose down -v`

</TabItem>
<TabItem value="existing" label="既有 LiteLLM">

保留您現有的 LiteLLM 安裝與 PostgreSQL 資料庫。若要進行新的 Lens 設定，請使用支援 Lens 的原始碼部署。請記錄用來建置您執行中 gateway 的確切原始碼提交點和 `LITELLM_RELEASE_TAG`；worker 需要兩者相符

無需切換部署工具或啟動第二個 proxy。請保留您的設定、`DATABASE_URL`、`LITELLM_MASTER_KEY` 和 `LITELLM_SALT_KEY`。如果您的 proxy 在沒有 PostgreSQL 的情況下執行，請在啟用 Lens 前 [連接資料庫](../virtual_keys.md#setup)

如果您已使用 Compose，請將 [worker 服務](https://github.com/BerriAI/litellm/blob/main/deploy/lens/compose.yaml) 新增至現有專案，並將 `LENS_WORKER_IMAGE` 設為相符的 worker。請保留現有的資料庫磁碟區和專案名稱；新的安裝配方會建立全新的資料庫和金鑰

#### 1. 啟用追蹤儲存 {#1-enable-trace-storage}

如果追蹤已可正常運作，請跳至 worker。否則，請在 LiteLLM 可存取的位置執行 ClickHouse：

```bash
docker run -d --name litellm-clickhouse --restart unless-stopped \
  -e CLICKHOUSE_USER=default \
  -e CLICKHOUSE_PASSWORD='<clickhouse-password>' \
  -e CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT=1 \
  -v clickhouse_data:/var/lib/clickhouse \
  -p 8123:8123 \
  clickhouse/clickhouse-server:26.9.6.6
```

使用 `CLICKHOUSE_URL=http://default:<clickhouse-password>@<clickhouse-host>:8123` [啟用追蹤](#configure-an-existing-proxy)，然後重新啟動 LiteLLM。請將 ClickHouse 連接埠僅限您的 proxy 可存取

#### 2. 準備相符的 worker 映像 {#2-prepare-the-matching-worker-image}

公開原始碼 worker 使用 `ghcr.io/berriai/litellm-lens-worker-dev:sha-<full-commit>`。它們支援 amd64，並會在 Lens 相關變更時發佈。僅在其提交點和 `sha-<full-commit>` 發行識別與您的 gateway 相符時才使用。請確認該確切映像存在：

```bash
docker buildx imagetools inspect \
  'ghcr.io/berriai/litellm-lens-worker-dev:sha-<full-commit>'
```

如果該映像無法取得、您的 gateway 使用不同的發行識別，或您需要原生 arm64，請切換到 gateway 的確切原始碼修訂版，並在那裡建置 worker：

```bash
export LITELLM_RELEASE_TAG='<gateway-release-identity>'
export LENS_WORKER_IMAGE='<your-registry>/litellm-lens-worker:<your-image-tag>'
docker build --build-arg LITELLM_RELEASE_TAG="$LITELLM_RELEASE_TAG" \
  -f deploy/lens/Dockerfile -t "$LENS_WORKER_IMAGE" .
```

對於另一台 Docker 主機或代管服務，請將映像發佈到該主機可拉取的 registry。將 gateway 上的 `LENS_WORKER_IMAGE` 設定為該映像，最好使用 digest，然後透過您正常的部署流程重新啟動。請保留 gateway 現有的發行識別；變更它不會讓不同的 worker 變得相容

#### 3. 連接 worker {#3-connect-the-worker}

開啟 **Lens > Investigations > Connect worker**，選擇分析模型和每月預算，然後按 **Get install command**。將其執行在具有相符映像且可連接到您的 proxy 的 Docker 主機上。等待 **Worker connected**，然後 [傳送您的第一個追蹤記錄](./first-trace.md)

<details>
<summary>獨立映像、Render，以及僅 worker 的 Compose</summary>

在 Render 或其他容器主機上，使用相符的獨立 worker 映像。將 `LITELLM_URL` 設為您的 proxy 可達的 base URL，不包含 `/v1`，並將 `LENS_WORKER_TOKEN` 設為在設定中從 **Using Docker Compose or Helm?** 複製的 token。worker 需要對 LiteLLM 的對外連線，且不需要對外連接埠

對於僅 worker 的 Compose，請下載 [`deploy/lens/compose.yaml`](https://github.com/BerriAI/litellm/blob/main/deploy/lens/compose.yaml) 並使用私有的 `.env` 檔案：

```bash
LENS_WORKER_IMAGE=<matching-worker-image>
LITELLM_URL=https://your-litellm-proxy
LENS_WORKER_TOKEN=<paste-your-worker-token>
```

執行 `docker compose up -d`。升級時，請將 `LENS_WORKER_IMAGE` 與您的 gateway 保持一致

</details>

</TabItem>
<TabItem value="helm" label="Kubernetes (Helm)">

使用位於 [`helm/litellm`](https://github.com/BerriAI/litellm/tree/main/helm/litellm) 的元件化原始碼 chart，並與您的 gateway 使用相同的 checkout。該 chart 包含可選的 worker；PostgreSQL 和 ClickHouse 則分別設定。對於新的安裝，請先部署 LiteLLM 及其資料庫連線。對於既有的安裝，請保留您的 release、values 和資料庫

設定 [ClickHouse 追蹤](#configure-an-existing-proxy)，然後開啟 **Lens > Investigations > Connect worker** 並取得 worker token。如果您使用不同的 chart 或自行管理 Kubernetes manifests，您可以保留該設定，改為部署獨立的 worker 映像

將 token 儲存在名為 `litellm-lens-worker` 的 Secret 中，key 為 `token`，且位於與 LiteLLM 相同的 namespace。使用您現有的 secret manager，或將 `token=<paste-your-worker-token>` 儲存在私有檔案中並建立該 Secret：

```bash
kubectl -n litellm create secret generic litellm-lens-worker \
  --from-env-file=/path/to/private/lens-worker.env
```

依照 **既有 LiteLLM** 的說明建置或選擇 worker 映像。將其 repository 和 digest 新增到您現有的 Helm values 中：

```yaml title="values.yaml"
lensWorker:
  enabled: true
  image:
    repository: <your-worker-image-repository>
    digest: sha256:<matching-worker-image-digest>
  tokenSecret:
    name: litellm-lens-worker
    key: token
```

請在 `values.yaml` 中保留您現有的元件映像覆寫和資料庫設定。它們必須指定與 worker 相同原始碼提交點和發行識別所建置的映像。從該原始碼 checkout 中，使用您現有的 release 名稱和 namespace：

```bash
helm upgrade --install litellm ./helm/litellm \
  --namespace litellm -f values.yaml
```

該 chart 會使用您選取的映像，並將 worker 連接至後端。**Connect worker** 會提供與您在 values 中選定、以 digest 鎖定的相同映像。worker 的 digest 必須與 gateway 的原始碼提交點和發行識別相符。請保留 values 和 Secret 以供未來升級使用。`lensWorker.replicaCount` 控制同時進行的調查；`lensWorker.image.repository`、`lensWorker.image.digest` 和 `lensWorker.url` 支援私有 registry 和外部 proxy

</TabItem>
</Tabs>

### 升級 LiteLLM 和 worker {#upgrade-litellm-and-the-worker}

您可以自行決定何時升級。發布新版本不會更新既有容器。請從相同的來源 commit 和發行識別建立 LiteLLM 與 worker；PostgreSQL 和 ClickHouse 有各自的版本，不需要隨著每次 LiteLLM 發布一併升級

檢查變更、備份資料庫、暫停排程中的調查，並在升級前讓進行中的調查完成。請保留您的設定、資料庫 volume、master key、salt key，以及 worker token。Worker 設定只需執行一次；每個版本不需要新的 token

<Tabs groupId="lens-upgrade">
<TabItem value="compose" label="Docker Compose" default>

對於本機追蹤堆疊，請在變更來源 checkout 之前先停止 worker：

```bash
docker compose -f docker/docker-compose.tracing.yml -f deploy/lens/compose.yaml stop lens-worker
```

選取新的來源修訂版本，並重複執行 **New local installation** 中的建置命令。請保留相同的 Compose 專案、資料庫 volume，以及已儲存的 worker token。等 gateway 準備好後，使用兩個 Compose 檔案啟動 worker：

```bash
docker compose -f docker/docker-compose.tracing.yml -f deploy/lens/compose.yaml up -d
```

這樣會在保留資料庫的同時更新 LiteLLM 與 worker。請勿重新產生金鑰或執行 `down -v`

如果您將 worker 加入自己的 Compose 專案，請連同 gateway 映像一併更新其明確指定的映像。如果 Compose 只管理 worker，請先單獨升級 LiteLLM，更新 `LENS_WORKER_IMAGE`，然後執行 `docker compose pull` 和 `docker compose up -d`

</TabItem>
<TabItem value="standalone" label="Docker 或託管 worker">

在進行中的調查完成後停止 worker，然後使用您平常的部署流程升級 LiteLLM。以從升級後 gateway 的來源 commit 和發行識別建置的映像重新建立 worker。請在升級前，讓該映像可在 Docker 主機上使用，或放在可存取的 registry 中

對於使用 `docker run` 啟動的 worker，請使用您已儲存的安裝命令搭配新的映像參照，並在替換後的容器連線成功後移除已停止的容器。請保留其 proxy URL、token 和執行階段選項。對於 Render 或其他容器主機，請更新既有 worker 服務的映像參照並重新部署，並保留其環境設定

</TabItem>
<TabItem value="helm" label="Helm">

請使用所選 gateway checkout 的來源 chart。請在現有 values 中更新您的元件與 worker 映像覆寫；保留 release 名稱、namespace 與 token Secret。請保持 worker 暫停，直到所有 LiteLLM pod 都完成升級，然後從您的 values 還原 worker 數量：

```bash
helm upgrade litellm ./helm/litellm \
  --namespace litellm -f values.yaml \
  --set lensWorker.replicaCount=0 --wait

kubectl -n litellm wait --for=delete pod \
  -l app.kubernetes.io/instance=litellm,app.kubernetes.io/component=lens-worker \
  --timeout=120s

helm upgrade litellm ./helm/litellm \
  --namespace litellm -f values.yaml --wait
```

此 chart 會使用您在 values 中選擇的相符映像。將 worker 以 digest 鎖定，可即使 registry tag 變更，也能在重新啟動時維持所選映像。第一個 Helm 指令會在 gateway 和後端更新時暫停調查。請等候舊的 worker pod 停止，然後最後一個指令會使用相同的 token 重新啟動它們。如果您的 pod selector 與 `litellm` 不同，請在其中使用您自己的 release 名稱。調查恢復後，請避免讓不同的 LiteLLM 版本對同一份 Lens 資料執行

請在您的 values 中同時更新映像 tag 與 digest，確保任何元件都不會停留在較舊的建置版本。worker 的 digest 會優先於其 tag。自訂 chart 與分開管理的 worker 部署必須透過其正常部署流程更新兩者的映像版本

</TabItem>
</Tabs>

在任何升級之後，請在儀表板中確認 **Worker connected**，執行一次調查，並還原您先前暫停的任何排程。gateway 會在分派工作前檢查相容性。過時的 worker 會停留並顯示升級訊息，不會影響佇列中的調查；請更新其映像以恢復工作

每小時的開發部署會從同一個選定的 commit 建置 gateway 與 worker

若要從來源進行開發，請使用 `make lens-dev`。自訂容器建置必須讓兩個元件使用相同的 checkout 與發行識別；請遵循 [來源建置指示](https://github.com/BerriAI/litellm/blob/main/deploy/lens/README.md#release-compatibility)。沒有該識別的建置會拒絕 worker 設定，而不是建議不相關的映像

### 使用 coding agent 部署 {#deploy-with-a-coding-agent}

<AgentDeployPrompt prompt={`依照 https://docs.litellm.ai/docs/proxy/lens/deployment 在這台機器上部署 LiteLLM Lens

1. 如果已有 LiteLLM proxy 在執行，請保留它及其 PostgreSQL 資料庫。否則請依照 New local installation，從相同的 checkout 與發行識別建置 gateway 與 worker。
2. 對於既有的 proxy，請使用 Existing LiteLLM 分頁設定 ClickHouse tracing。使用 LiteLLM key 檢查 POST /v1/traces 與 GET /v1/traces。
3. 請我開啟 Lens > Investigations > Connect worker，選擇模型與預算，並取得 worker token。對於本機堆疊，請使用兩個 Compose 檔案啟動 worker。對於既有 proxy，請確認其產生的命令會指定可用且相符的映像，然後執行它。
4. 確認儀表板顯示 "Worker connected"。未來升級時，請讓 LiteLLM 與 worker 保持在相同的來源 commit 與發行識別上。

絕不要列印或提交金鑰、worker token 或密碼。若要取代既有容器、資料庫或設定，請先詢問我。`} />

## 設定既有的 proxy {#configure-an-existing-proxy}

將以下內容加入 `config.yaml`：

```yaml
general_settings:
  tracing:
    store:
      type: clickhouse
```

將 `CLICKHOUSE_URL` 設定為您的 proxy 可連線的 ClickHouse HTTP 位址。`CLICKHOUSE_DATABASE` 預設為 `litellm`。您可以設定 `CLICKHOUSE_READER_URL` 以使用獨立的唯讀帳號；否則讀取會使用 `CLICKHOUSE_URL`。

調查也需要 PostgreSQL、已設定的分析模型，以及已連線的 Lens worker。請保持 proxy 與 worker 版本相容。部署細節請參閱 [tracing 設定](https://github.com/BerriAI/litellm/blob/main/docker/tracing-config.yaml) 與 [worker 設定指南](https://github.com/BerriAI/litellm/blob/main/deploy/lens/README.md)。
