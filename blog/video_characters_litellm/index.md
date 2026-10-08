---
slug: video_characters_api
title: "新增 Video Characters、Edit 與 Extension API 支援"
date: 2026-03-16T10:00:00
authors:
  - sameer
  - krrish
  - ishaan-alt
description: "LiteLLM 現在支援在多次影片生成之間建立、擷取及管理可重複使用的 video characters。"
tags: [videos, characters, proxy, routing]
hide_table_of_contents: false
---

LiteLLM 現在支援影片 character、edit 與 extension API。

{/* truncate */}

## 有哪些新功能 {#whats-new}

四個新的影片 character 作業端點：
- **建立 character** - 上傳影片以建立可重複使用的資產
- **取得 character** - 擷取 character 中繼資料
- **編輯影片** - 修改已生成的影片
- **延伸影片** - 以 character 一致性延續片段

**可用於：** LiteLLM v1.83.0+

## 快速範例 {#quick-example}

```python
import litellm

# Create character from video
character = litellm.avideo_create_character(
    name="Luna",
    video=open("luna.mp4", "rb"),
    custom_llm_provider="openai",
    model="sora-2"
)
print(f"Character: {character.id}")

# Use in generation
video = litellm.avideo(
    model="sora-2",
    prompt="Luna dances through a magical forest.",
    characters=[{"id": character.id}],
    seconds="8"
)

# Get character info
fetched = litellm.avideo_get_character(
    character_id=character.id,
    custom_llm_provider="openai"
)

# Edit with character preserved
edited = litellm.avideo_edit(
    video_id=video.id,
    prompt="Add warm golden lighting"
)

# Extend sequence
extended = litellm.avideo_extension(
    video_id=video.id,
    prompt="Luna waves goodbye",
    seconds="5"
)
```

## 透過 Proxy {#via-proxy}

```bash
# Create character
curl -X POST "http://localhost:4000/v1/videos/characters" \
  -H "Authorization: Bearer sk-litellm-key" \
  -F "video=@luna.mp4" \
  -F "name=Luna"

# Get character
curl -X GET "http://localhost:4000/v1/videos/characters/char_abc123def456" \
  -H "Authorization: Bearer sk-litellm-key"

# Edit video
curl -X POST "http://localhost:4000/v1/videos/edits" \
  -H "Authorization: Bearer sk-litellm-key" \
  -H "Content-Type: application/json" \
  -d '{
    "video": {"id": "video_xyz789"},
    "prompt": "Add warm golden lighting and enhance colors"
  }'

# Extend video
curl -X POST "http://localhost:4000/v1/videos/extensions" \
  -H "Authorization: Bearer sk-litellm-key" \
  -H "Content-Type: application/json" \
  -d '{
    "video": {"id": "video_xyz789"},
    "prompt": "Luna waves goodbye and walks into the sunset",
    "seconds": "5"
  }'
```

## 受管理的 Character IDs {#managed-character-ids}

LiteLLM 會自動將提供者與模型中繼資料編碼進 character IDs：

**發生什麼事：**
```
Upload character "Luna" with model "sora-2" on OpenAI
  ↓
LiteLLM creates: char_abc123def456 (contains provider + model_id)
  ↓
When you reference it later, LiteLLM decodes automatically
  ↓
Router knows exactly which deployment to use
```

**幕後運作：**
- Character ID 格式：`character_<base64_encoded_metadata>`
- 中繼資料包含：provider、model_id、original_character_id
- 對您而言是透明的 - 只要使用 ID，LiteLLM 會處理路由
