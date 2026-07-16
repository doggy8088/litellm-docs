import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# SSL、HTTP Proxy 安全設定 {#ssl-http-proxy-security-settings}

如果您處於使用較舊 TTS bundle、且使用較舊加密的環境，請遵循本指南。預設情況下，LiteLLM 會使用 certifi CA bundle 進行 SSL 驗證，這與大多數現代伺服器相容。 不過，如果您需要停用 SSL 驗證或使用自訂 CA bundle，可以依照下列步驟進行。

請注意，環境變數的優先順序高於 SDK 中的設定。

LiteLLM 使用 HTTPX 進行網路請求，除非另有指定。

## 1. 自訂 CA Bundle {#1-custom-ca-bundle}

您可以使用 `SSL_CERT_FILE` 環境變數，或將字串傳遞給 ssl_verify 設定，來設定自訂 CA bundle 檔案路徑。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm
litellm.ssl_verify = "client.pem"
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
litellm_settings:
  ssl_verify: "client.pem"
```

</TabItem>  
<TabItem value="env_var" label="Environment Variables">

```bash
export SSL_CERT_FILE="client.pem"
```
</TabItem>
</Tabs>

## 2. 停用 SSL 驗證 {#2-disable-ssl-verification}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm
litellm.ssl_verify = False
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
litellm_settings:
  ssl_verify: false
```

</TabItem>  
<TabItem value="env_var" label="Environment Variables">

```bash
export SSL_VERIFY="False"
```
</TabItem>
</Tabs>

## 3. 較低的安全設定 {#3-lower-security-settings}

`ssl_security_level` 可讓您為 SSL 連線設定較低的安全等級。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm
litellm.ssl_security_level = "DEFAULT@SECLEVEL=1"
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
litellm_settings:
  ssl_security_level: "DEFAULT@SECLEVEL=1"
```
</TabItem>
<TabItem value="env_var" label="Environment Variables">

```bash
export SSL_SECURITY_LEVEL="DEFAULT@SECLEVEL=1"
```
</TabItem>
</Tabs>

## 4. 憑證驗證 {#4-certificate-authentication}

`SSL_CERTIFICATE` 環境變數或 `ssl_certificate` 屬性可用來設定用戶端憑證，以驗證用戶端與伺服器之間的身分。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm
litellm.ssl_certificate = "/path/to/certificate.pem"
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
litellm_settings:
  ssl_certificate: "/path/to/certificate.pem"
```
</TabItem>
<TabItem value="env_var" label="Environment Variables">

```bash
export SSL_CERTIFICATE="/path/to/certificate.pem"
```

</TabItem>
</Tabs>

## 5. 設定 ECDH 曲線以提升 SSL/TLS 效能 {#5-configure-ecdh-curve-for-ssltls-performance}

`ssl_ecdh_curve` 設定可讓您設定 SSL/TLS 金鑰交換所使用的橢圓曲線 Diffie-Hellman（ECDH）曲線。這對於停用後量子密碼學（PQC）以提升在不需要 PQC 的環境中的效能特別有用。

**使用情境：** 某些 OpenSSL 3.x 系統預設會啟用 PQC，這可能會降低 TLS 握手速度。將 ECDH 曲線設定為 `X25519` 會停用 PQC，並可大幅提升連線效能。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm
litellm.ssl_ecdh_curve = "X25519"  # Disables PQC for better performance
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
litellm_settings:
  ssl_ecdh_curve: "X25519"
```

</TabItem>  
<TabItem value="env_var" label="Environment Variables">

```bash
export SSL_ECDH_CURVE="X25519"
```

</TabItem>
</Tabs>

**常見有效曲線：**

- `X25519` - 現代、快速的曲線（建議用於停用 PQC）
- `prime256v1` - NIST P-256 曲線
- `secp384r1` - NIST P-384 曲線
- `secp521r1` - NIST P-521 曲線

**注意：** 如果提供了無效的曲線名稱，或您的 Python/OpenSSL 版本不支援此功能，LiteLLM 會記錄警告並繼續使用預設曲線。

## 6. 使用 HTTP_PROXY 環境變數 {#6-use-http_proxy-environment-variable}

httpx 和 aiohttp 這兩個函式庫都會從環境變數使用 `urllib.request.getproxies`。在用戶端初始化之前，您可以透過設定以下環境變數來設定 proxy（以及可選的 SSL_CERT_FILE）：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm
litellm.aiohttp_trust_env = True
```

```bash
export HTTPS_PROXY='http://username:password@proxy_uri:port'
```
</TabItem>

<TabItem value="proxy" label="PROXY">

```bash
export HTTPS_PROXY='http://username:password@proxy_uri:port'
export AIOHTTP_TRUST_ENV='True'
```
</TabItem>
</Tabs>
## 7. 依服務設定 SSL 驗證 {#7-per-service-ssl-verification}

LiteLLM 允許您針對特定服務或提供者呼叫覆寫 SSL 驗證設定。當不同服務（例如內部防護欄與公開 LLM 提供者）需要不同的 CA 憑證時，這非常有用。

### Bedrock（SDK） {#bedrock-sdk}
您可以直接在 `completion` 呼叫中傳遞 `ssl_verify`。

```python
import litellm

response = litellm.completion(
    model="bedrock/anthropic.claude-3-sonnet-20240229-v1:0",
    messages=[{"role": "user", "content": "hi"}],
    ssl_verify="path/to/bedrock_cert.pem" # Or False to disable
)
```

### AIM Guardrail（Proxy） {#aim-guardrail-proxy}
您可以在 `config.yaml` 中，針對每個防護欄設定 `ssl_verify`。

```yaml
guardrails:
  - guardrail_name: aim-protected-app
    litellm_params:
      guardrail: aim
      ssl_verify: "/path/to/aim_cert.pem" # Use specific cert for AIM
```

### Cato Networks Guardrail（Proxy） {#cato-networks-guardrail-proxy}
您可以在 `config.yaml` 中，針對每個防護欄設定 `ssl_verify`。

```yaml
guardrails:
  - guardrail_name: cato-protected-app
    litellm_params:
      guardrail: cato_networks
      ssl_verify: "/path/to/cato_cert.pem" # Use specific cert for AIM
```

### 優先順序邏輯 {#priority-logic}
LiteLLM 依下列優先順序解析 `ssl_verify`：
1. **明確參數**：在 `completion()` 或防護欄設定中傳入。
2. **環境變數**：`SSL_VERIFY` 環境變數。
3. **全域設定**：`litellm.ssl_verify` 設定。
4. **系統標準**：`SSL_CERT_FILE` 環境變數。
