# ✨ Secret Detection/Redaction（僅限 Enterprise） {#-secret-detectionredaction-enterprise-only}
❓ 使用此功能可將傳送至 LLM 的請求中的 API 金鑰、Secrets 予以遮罩。 

範例：如果您想在下列請求中遮罩 `OPENAI_API_KEY` 的值

#### 傳入請求  {#incoming-request}

```json
{
    "messages": [
        {
            "role": "user",
            "content": "Hey, how's it going, API_KEY = 'sk_1234567890abcdef'",
        }
    ]
}
```

#### Moderation 後的請求 {#request-after-moderation}

```json
{
    "messages": [
        {
            "role": "user",
            "content": "Hey, how's it going, API_KEY = '[REDACTED]'",
        }
    ]
}
```

**使用方式**

**步驟 1** 將這段加入您的 config.yaml 

```yaml
guardrails:
  - guardrail_name: "my-custom-name"
    litellm_params:
      guardrail: "hide-secrets"  # supported values: "aporia", "lakera", .. 
      mode: "pre_call"
```

**步驟 2** 以 `--detailed_debug` 執行 litellm proxy 以查看伺服器記錄

```
litellm --config config.yaml --detailed_debug
```

**步驟 3** 用請求測試

送出此請求
```shell
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "fake-claude-endpoint",
    "messages": [
      {
        "role": "user",
        "content": "what is the value of my open ai key? openai_api_key=sk-1234998222"
      }
    ],
    "guardrails": ["my-custom-name"]
}'
```


預期在您的 litellm 伺服器記錄中看到以下警告

```shell
LiteLLM Proxy:WARNING: secret_detection.py:88 - Detected and redacted secrets in message: ['Secret Keyword']
```


您也可以看到從 litellm 傳送到 API 提供者的原始請求（`--detailed_debug`）。
```json
POST Request Sent from LiteLLM:
curl -X POST \
https://api.groq.com/openai/v1/ \
-H 'Authorization: Bearer gsk_mySVchjY********************************************' \
-d {
  "model": "llama3-8b-8192",
  "messages": [
    {
      "role": "user",
      "content": "what is the time today, openai_api_key=[REDACTED]"
    }
  ],
  "stream": false,
  "extra_body": {}
}
```

## 針對每個專案（API 金鑰/團隊）開啟/關閉 {#turn-onoff-per-project-api-keyteam}

[**請見此處**](./quick_start.md#-control-guardrails-per-project-api-key)

## 控制 secret detectors {#control-secret-detectors}

LiteLLM 使用 [`detect-secrets`](https://github.com/Yelp/detect-secrets) 函式庫進行 secret detection。請參閱[預設執行的所有 plugins](#default-config-used)

### 使用方式 {#usage}

以下說明如何控制每個請求執行哪些 plugins。若開發人員抱怨 secret detection 影響回應品質，這會很有用。

**1. 設定 config.yaml**

```yaml
guardrails:
  - guardrail_name: "hide-secrets"
    litellm_params:
      guardrail: "hide-secrets"  # supported values: "aporia", "lakera"
      mode: "pre_call"
      detect_secrets_config: {
         "plugins_used": [
          {"name": "SoftlayerDetector"},
          {"name": "StripeDetector"},
          {"name": "NpmDetector"}
        ]
      }
```

**2. 啟動 proxy**

使用 `--detailed_debug` 執行可取得更詳細的記錄。僅限開發環境使用。 

```bash
litellm --config /path/to/config.yaml --detailed_debug
```

**3. 測試！**

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "fake-claude-endpoint",
    "messages": [
      {
        "role": "user",
        "content": "what is the value of my open ai key? openai_api_key=sk-1234998222"
      }
    ],
    "guardrails": ["hide-secrets"]
}'
```

**預期記錄**

請在您的記錄中尋找這項內容，以確認您的變更如預期般運作。

```
No secrets detected on input.
```

### 使用的預設設定 {#default-config-used}

```
_default_detect_secrets_config = {
    "plugins_used": [
        {"name": "SoftlayerDetector"},
        {"name": "StripeDetector"},
        {"name": "NpmDetector"},
        {"name": "IbmCosHmacDetector"},
        {"name": "DiscordBotTokenDetector"},
        {"name": "BasicAuthDetector"},
        {"name": "AzureStorageKeyDetector"},
        {"name": "ArtifactoryDetector"},
        {"name": "AWSKeyDetector"},
        {"name": "CloudantDetector"},
        {"name": "IbmCloudIamDetector"},
        {"name": "JwtTokenDetector"},
        {"name": "MailchimpDetector"},
        {"name": "SquareOAuthDetector"},
        {"name": "PrivateKeyDetector"},
        {"name": "TwilioKeyDetector"},
        {
            "name": "AdafruitKeyDetector",
            "path": _custom_plugins_path + "/adafruit.py",
        },
        {
            "name": "AdobeSecretDetector",
            "path": _custom_plugins_path + "/adobe.py",
        },
        {
            "name": "AgeSecretKeyDetector",
            "path": _custom_plugins_path + "/age_secret_key.py",
        },
        {
            "name": "AirtableApiKeyDetector",
            "path": _custom_plugins_path + "/airtable_api_key.py",
        },
        {
            "name": "AlgoliaApiKeyDetector",
            "path": _custom_plugins_path + "/algolia_api_key.py",
        },
        {
            "name": "AlibabaSecretDetector",
            "path": _custom_plugins_path + "/alibaba.py",
        },
        {
            "name": "AsanaSecretDetector",
            "path": _custom_plugins_path + "/asana.py",
        },
        {
            "name": "AtlassianApiTokenDetector",
            "path": _custom_plugins_path + "/atlassian_api_token.py",
        },
        {
            "name": "AuthressAccessKeyDetector",
            "path": _custom_plugins_path + "/authress_access_key.py",
        },
        {
            "name": "BittrexDetector",
            "path": _custom_plugins_path + "/beamer_api_token.py",
        },
        {
            "name": "BitbucketDetector",
            "path": _custom_plugins_path + "/bitbucket.py",
        },
        {
            "name": "BeamerApiTokenDetector",
            "path": _custom_plugins_path + "/bittrex.py",
        },
        {
            "name": "ClojarsApiTokenDetector",
            "path": _custom_plugins_path + "/clojars_api_token.py",
        },
        {
            "name": "CodecovAccessTokenDetector",
            "path": _custom_plugins_path + "/codecov_access_token.py",
        },
        {
            "name": "CoinbaseAccessTokenDetector",
            "path": _custom_plugins_path + "/coinbase_access_token.py",
        },
        {
            "name": "ConfluentDetector",
            "path": _custom_plugins_path + "/confluent.py",
        },
        {
            "name": "ContentfulApiTokenDetector",
            "path": _custom_plugins_path + "/contentful_api_token.py",
        },
        {
            "name": "DatabricksApiTokenDetector",
            "path": _custom_plugins_path + "/databricks_api_token.py",
        },
        {
            "name": "DatadogAccessTokenDetector",
            "path": _custom_plugins_path + "/datadog_access_token.py",
        },
        {
            "name": "DefinedNetworkingApiTokenDetector",
            "path": _custom_plugins_path + "/defined_networking_api_token.py",
        },
        {
            "name": "DigitaloceanDetector",
            "path": _custom_plugins_path + "/digitalocean.py",
        },
        {
            "name": "DopplerApiTokenDetector",
            "path": _custom_plugins_path + "/doppler_api_token.py",
        },
        {
            "name": "DroneciAccessTokenDetector",
            "path": _custom_plugins_path + "/droneci_access_token.py",
        },
        {
            "name": "DuffelApiTokenDetector",
            "path": _custom_plugins_path + "/duffel_api_token.py",
        },
        {
            "name": "DynatraceApiTokenDetector",
            "path": _custom_plugins_path + "/dynatrace_api_token.py",
        },
        {
            "name": "DiscordDetector",
            "path": _custom_plugins_path + "/discord.py",
        },
        {
            "name": "DropboxDetector",
            "path": _custom_plugins_path + "/dropbox.py",
        },
        {
            "name": "EasyPostDetector",
            "path": _custom_plugins_path + "/easypost.py",
        },
        {
            "name": "EtsyAccessTokenDetector",
            "path": _custom_plugins_path + "/etsy_access_token.py",
        },
        {
            "name": "FacebookAccessTokenDetector",
            "path": _custom_plugins_path + "/facebook_access_token.py",
        },
        {
            "name": "FastlyApiKeyDetector",
            "path": _custom_plugins_path + "/fastly_api_token.py",
        },
        {
            "name": "FinicityDetector",
            "path": _custom_plugins_path + "/finicity.py",
        },
        {
            "name": "FinnhubAccessTokenDetector",
            "path": _custom_plugins_path + "/finnhub_access_token.py",
        },
        {
            "name": "FlickrAccessTokenDetector",
            "path": _custom_plugins_path + "/flickr_access_token.py",
        },
        {
            "name": "FlutterwaveDetector",
            "path": _custom_plugins_path + "/flutterwave.py",
        },
        {
            "name": "FrameIoApiTokenDetector",
            "path": _custom_plugins_path + "/frameio_api_token.py",
        },
        {
            "name": "FreshbooksAccessTokenDetector",
            "path": _custom_plugins_path + "/freshbooks_access_token.py",
        },
        {
            "name": "GCPApiKeyDetector",
            "path": _custom_plugins_path + "/gcp_api_key.py",
        },
        {
            "name": "GitHubTokenCustomDetector",
            "path": _custom_plugins_path + "/github_token.py",
        },
        {
            "name": "GitLabDetector",
            "path": _custom_plugins_path + "/gitlab.py",
        },
        {
            "name": "GitterAccessTokenDetector",
            "path": _custom_plugins_path + "/gitter_access_token.py",
        },
        {
            "name": "GoCardlessApiTokenDetector",
            "path": _custom_plugins_path + "/gocardless_api_token.py",
        },
        {
            "name": "GrafanaDetector",
            "path": _custom_plugins_path + "/grafana.py",
        },
        {
            "name": "HashiCorpTFApiTokenDetector",
            "path": _custom_plugins_path + "/hashicorp_tf_api_token.py",
        },
        {
            "name": "HerokuApiKeyDetector",
            "path": _custom_plugins_path + "/heroku_api_key.py",
        },
        {
            "name": "HubSpotApiTokenDetector",
            "path": _custom_plugins_path + "/hubspot_api_key.py",
        },
        {
            "name": "HuggingFaceDetector",
            "path": _custom_plugins_path + "/huggingface.py",
        },
        {
            "name": "IntercomApiTokenDetector",
            "path": _custom_plugins_path + "/intercom_api_key.py",
        },
        {
            "name": "JFrogDetector",
            "path": _custom_plugins_path + "/jfrog.py",
        },
        {
            "name": "JWTBase64Detector",
            "path": _custom_plugins_path + "/jwt.py",
        },
        {
            "name": "KrakenAccessTokenDetector",
            "path": _custom_plugins_path + "/kraken_access_token.py",
        },
        {
            "name": "KucoinDetector",
            "path": _custom_plugins_path + "/kucoin.py",
        },
        {
            "name": "LaunchdarklyAccessTokenDetector",
            "path": _custom_plugins_path + "/launchdarkly_access_token.py",
        },
        {
            "name": "LinearDetector",
            "path": _custom_plugins_path + "/linear.py",
        },
        {
            "name": "LinkedInDetector",
            "path": _custom_plugins_path + "/linkedin.py",
        },
        {
            "name": "LobDetector",
            "path": _custom_plugins_path + "/lob.py",
        },
        {
            "name": "MailgunDetector",
            "path": _custom_plugins_path + "/mailgun.py",
        },
        {
            "name": "MapBoxApiTokenDetector",
            "path": _custom_plugins_path + "/mapbox_api_token.py",
        },
        {
            "name": "MattermostAccessTokenDetector",
            "path": _custom_plugins_path + "/mattermost_access_token.py",
        },
        {
            "name": "MessageBirdDetector",
            "path": _custom_plugins_path + "/messagebird.py",
        },
        {
            "name": "MicrosoftTeamsWebhookDetector",
            "path": _custom_plugins_path + "/microsoft_teams_webhook.py",
        },
        {
            "name": "NetlifyAccessTokenDetector",
            "path": _custom_plugins_path + "/netlify_access_token.py",
        },
        {
            "name": "NewRelicDetector",
            "path": _custom_plugins_path + "/new_relic.py",
        },
        {
            "name": "NYTimesAccessTokenDetector",
            "path": _custom_plugins_path + "/nytimes_access_token.py",
        },
        {
            "name": "OktaAccessTokenDetector",
            "path": _custom_plugins_path + "/okta_access_token.py",
        },
        {
            "name": "OpenAIApiKeyDetector",
            "path": _custom_plugins_path + "/openai_api_key.py",
        },
        {
            "name": "PlanetScaleDetector",
            "path": _custom_plugins_path + "/planetscale.py",
        },
        {
            "name": "PostmanApiTokenDetector",
            "path": _custom_plugins_path + "/postman_api_token.py",
        },
        {
            "name": "PrefectApiTokenDetector",
            "path": _custom_plugins_path + "/prefect_api_token.py",
        },
        {
            "name": "PulumiApiTokenDetector",
            "path": _custom_plugins_path + "/pulumi_api_token.py",
        },
        {
            "name": "PyPiUploadTokenDetector",
            "path": _custom_plugins_path + "/pypi_upload_token.py",
        },
        {
            "name": "RapidApiAccessTokenDetector",
            "path": _custom_plugins_path + "/rapidapi_access_token.py",
        },
        {
            "name": "ReadmeApiTokenDetector",
            "path": _custom_plugins_path + "/readme_api_token.py",
        },
        {
            "name": "RubygemsApiTokenDetector",
            "path": _custom_plugins_path + "/rubygems_api_token.py",
        },
        {
            "name": "ScalingoApiTokenDetector",
            "path": _custom_plugins_path + "/scalingo_api_token.py",
        },
        {
            "name": "SendbirdDetector",
            "path": _custom_plugins_path + "/sendbird.py",
        },
        {
            "name": "SendGridApiTokenDetector",
            "path": _custom_plugins_path + "/sendgrid_api_token.py",
        },
        {
            "name": "SendinBlueApiTokenDetector",
            "path": _custom_plugins_path + "/sendinblue_api_token.py",
        },
        {
            "name": "SentryAccessTokenDetector",
            "path": _custom_plugins_path + "/sentry_access_token.py",
        },
        {
            "name": "ShippoApiTokenDetector",
            "path": _custom_plugins_path + "/shippo_api_token.py",
        },
        {
            "name": "ShopifyDetector",
            "path": _custom_plugins_path + "/shopify.py",
        },
        {
            "name": "SlackDetector",
            "path": _custom_plugins_path + "/slack.py",
        },
        {
            "name": "SnykApiTokenDetector",
            "path": _custom_plugins_path + "/snyk_api_token.py",
        },
        {
            "name": "SquarespaceAccessTokenDetector",
            "path": _custom_plugins_path + "/squarespace_access_token.py",
        },
        {
            "name": "SumoLogicDetector",
            "path": _custom_plugins_path + "/sumologic.py",
        },
        {
            "name": "TelegramBotApiTokenDetector",
            "path": _custom_plugins_path + "/telegram_bot_api_token.py",
        },
        {
            "name": "TravisCiAccessTokenDetector",
            "path": _custom_plugins_path + "/travisci_access_token.py",
        },
        {
            "name": "TwitchApiTokenDetector",
            "path": _custom_plugins_path + "/twitch_api_token.py",
        },
        {
            "name": "TwitterDetector",
            "path": _custom_plugins_path + "/twitter.py",
        },
        {
            "name": "TypeformApiTokenDetector",
            "path": _custom_plugins_path + "/typeform_api_token.py",
        },
        {
            "name": "VaultDetector",
            "path": _custom_plugins_path + "/vault.py",
        },
        {
            "name": "YandexDetector",
            "path": _custom_plugins_path + "/yandex.py",
        },
        {
            "name": "ZendeskSecretKeyDetector",
            "path": _custom_plugins_path + "/zendesk_secret_key.py",
        },
        {"name": "Base64HighEntropyString", "limit": 3.0},
        {"name": "HexHighEntropyString", "limit": 3.0},
    ]
}
```
