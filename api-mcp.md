### 7.1 获取工具元数据列表

```
GET /api/mcp/tools
```

**功能描述:**
获取所有可用MCP工具的元数据信息，包括工具名称、描述和参数模式。

**响应示例:**

```json
{
  "isSuccess": true,
  "message": "获取工具元数据成功",
  "data": {
    "tools": [
      {
        "name": "move",
        "description": "移动到指定位置",
        "inputSchema": {
          "type": "object",
          "properties": {
            "position": {
              "type": "object",
              "properties": {
                "x": { "type": "number", "description": "目标X坐标" },
                "y": { "type": "number", "description": "目标Y坐标" },
                "z": { "type": "number", "description": "目标Z坐标" }
              },
              "required": ["x", "y", "z"]
            }
          },
          "required": ["position"]
        }
      },
      {
        "name": "mine_block",
        "description": "挖掘指定类型的方块",
        "inputSchema": {
          "type": "object",
          "properties": {
            "name": { "type": "string", "description": "方块名称，如 'stone', 'iron_ore'" },
            "count": { "type": "integer", "description": "挖掘数量", "default": 1 },
            "digOnly": { "type": "boolean", "description": "是否只挖掘不收集", "default": false }
          },
          "required": ["name"]
        }
      }
    ],
    "total": 15
  },
  "timestamp": 1704067200000
}
```

### 7.2 调用工具

```
POST /api/mcp/tools/call
```

**功能描述:**
直接调用指定的MCP工具，支持异步执行和中断处理。

**请求体:**

```json
{
  "tool_name": "move",
  "arguments": {
    "position": {
      "x": 123.5,
      "y": 64.0,
      "z": -456.8
    }
  }
}
```

**请求参数说明:**

- `tool_name` (string, 必需): 要调用的工具名称
- `arguments` (object, 必需): 工具调用参数，结构根据工具的inputSchema定义

**响应示例 (成功):**

```json
{
  "isSuccess": true,
  "message": "工具调用成功",
  "data": {
    "tool_name": "move",
    "arguments": {
      "position": {
        "x": 123.5,
        "y": 64.0,
        "z": -456.8
      }
    },
    "result": {
      "content": [
        {
          "type": "text",
          "text": "成功移动到位置 (123.5, 64.0, -456.8)"
        }
      ],
      "structured_content": null,
      "is_error": false,
      "data": {
        "success": true,
        "target_position": {
          "x": 123.5,
          "y": 64.0,
          "z": -456.8
        },
        "distance": 5.2,
        "duration": 2.3
      }
    }
  },
  "timestamp": 1704067200000
}
```
