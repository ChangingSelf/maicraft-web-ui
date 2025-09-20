WebSocket Token使用量监控

系统提供Token使用量实时监控WebSocket端点，支持订阅Token使用量更新推送。

#### Token使用量端点

```
ws://localhost:20914/ws/token-usage
```

**订阅消息:**

```json
{
  "type": "subscribe",
  "update_interval": 0,
  "model_filter": "qwen" // 可选：模型名称过滤器，支持模糊匹配
}
```

**参数说明:**

- `update_interval`: 更新间隔（毫秒），0表示实时推送（每次使用量更新时推送）
- `model_filter`: 可选的模型过滤器，只推送匹配的模型使用量

**推送数据:**

```json
{
  "type": "token_usage_update",
  "timestamp": 1704067200000,
  "data": {
    "model_name": "qwen3-next-80b-a3b-instruct",
    "usage": {
      "model_name": "qwen3-next-80b-a3b-instruct",
      "total_prompt_tokens": 7643119,
      "total_completion_tokens": 572218,
      "total_tokens": 8215337,
      "total_calls": 2300,
      "total_cost": 9.910613,
      "first_call_time": 1757772240.156091,
      "last_call_time": 1758332630.4386134,
      "last_updated": 1758332630.4386134
    },
    "summary": {
      "total_cost": 15.432,
      "total_prompt_tokens": 10000000,
      "total_completion_tokens": 2000000,
      "total_tokens": 12000000,
      "total_calls": 5000,
      "model_count": 3
    }
  }
}
```

**数据说明:**

- `model_name`: 更新的模型名称
- `usage`: 该模型的详细使用量统计
- `summary`: 所有模型的总费用汇总

**获取当前使用量:**

```json
{
  "type": "get_usage",
  "model_name": "qwen3-next-80b-a3b-instruct" // 可选：指定模型，不传则获取所有模型
}
```
