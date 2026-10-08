# 💸 取得每日支出、用量指標 {#-get-daily-spend-usage-metrics}

此頁原本描述的 `GET /daily_metrics` 端點已從 proxy 中移除。每日支出與用量現在由 `GET /user/daily/activity` 提供，會回傳每日支出、token 數量與請求數，並依模型、模型群組、提供者、端點、API 金鑰與 MCP server 分解。請參閱 [每日支出明細 API](./cost_tracking#daily-spend-breakdown-api) 章節以取得完整回應結構，並參閱 [Swagger 參考](https://docs.litellm.ai/api-reference/#/Budget%20%26%20Spend%20Tracking/get_user_daily_activity_user_daily_activity_get) 以查看所有參數。

## 請求格式 {#request-format}
```shell
curl -X GET "http://0.0.0.0:4000/user/daily/activity?start_date=2025-03-20&end_date=2025-03-27" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

可選查詢參數：`model`、`api_key` 和 `user_id` 會篩選結果（非管理員呼叫者必須傳入自己的 `user_id`），`page` 和 `page_size`（預設 50，最大 1000）會分頁顯示，`timezone`（相對 UTC 的分鐘偏移）與 `include_current_utc_day` 一起控制每日區塊的對齊方式。

## 回應格式 {#response-format}
```json
{
    "results": [
        {
            "date": "2025-03-27",
            "metrics": {
                "spend": 0.0177072,
                "prompt_tokens": 111,
                "completion_tokens": 1711,
                "total_tokens": 1822,
                "api_requests": 11,
                "successful_requests": 11,
                "failed_requests": 0
            },
            "breakdown": {
                "models": {"{{openai_small}}": {"metrics": {"spend": 1.82e-05, "...": "..."}, "metadata": {}}},
                "providers": {"openai": {"metrics": {"...": "..."}, "metadata": {}}},
                "api_keys": {"3126b6eaf1...": {"metrics": {"...": "..."}, "metadata": {"key_alias": "my-key", "team_id": null}}}
            }
        }
    ],
    "metadata": {
        "total_spend": 0.7274667,
        "total_prompt_tokens": 280990,
        "total_completion_tokens": 376674,
        "total_tokens": 657664,
        "total_api_requests": 14,
        "total_successful_requests": 14,
        "total_failed_requests": 0
    }
}
```

如需個別請求記錄，請使用 [`GET /spend/logs`](./cost_tracking#-spend-logs-api---individual-transaction-logs)。
