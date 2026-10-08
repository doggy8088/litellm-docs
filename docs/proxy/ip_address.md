# ✨ IP 位址篩選 {#-ip-address-filtering}

<EnterpriseFeature />

限制哪些 IP 可以呼叫 proxy 端點。

```yaml
general_settings:
  allowed_ips: ["192.168.1.1"]
```

**預期回應**（如果 IP 未列出）

```bash
{
    "error": {
        "message": "Access forbidden: IP address not allowed.",
        "type": "auth_error",
        "param": "None",
        "code": 403
    }
}
```
