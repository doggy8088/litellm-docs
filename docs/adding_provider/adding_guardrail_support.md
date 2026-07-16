# 將 Guardrail 支援新增至端點 {#adding-guardrail-support-to-endpoints}

本指南說明如何為新的 LiteLLM 端點（例如 Chat Completions、Responses API 等）新增 guardrail 翻譯支援。

## 何時要新增 Guardrail 支援 {#when-to-add-guardrail-support}

在以下情況下新增 guardrail 支援：
- 您正在建立新的 LiteLLM 端點（例如新的 API 格式）
- 您想為不支援 guardrails 的既有端點啟用 guardrails
- 您需要針對特定訊息格式的自訂文字擷取邏輯

## 目錄結構 {#directory-structure}

Guardrail 處理器遵循以下結構：

```
litellm/llms/{provider}/{endpoint}/guardrail_translation/
├── __init__.py          # Exports handler and registers call types
├── handler.py           # Main handler implementation
└── README.md            # Documentation (optional but recommended)
```

### 範例結構 {#example-structures}

**OpenAI Chat Completions：**
```
litellm/llms/openai/chat/guardrail_translation/
├── __init__.py
├── handler.py
└── README.md
```

**OpenAI Responses API：**
```
litellm/llms/openai/responses/guardrail_translation/
├── __init__.py
├── handler.py
└── README.md
```

**Anthropic Messages：**
```
litellm/llms/anthropic/chat/guardrail_translation/
├── __init__.py
└── handler.py
```

## 逐步實作 {#step-by-step-implementation}

### 步驟 1：建立處理器類別 {#step-1-create-the-handler-class}

建立 `handler.py`，其繼承自 `BaseTranslation`：

```python
"""
{Provider} {Endpoint} Handler for Unified Guardrails

This module provides guardrail translation support for {Provider}'s {Endpoint} format.
"""

import asyncio
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Tuple, Union, cast

from litellm._logging import verbose_proxy_logger
from litellm.llms.base_llm.guardrail_translation.base_translation import BaseTranslation

if TYPE_CHECKING:
    from litellm.integrations.custom_guardrail import CustomGuardrail
    from litellm.types.utils import ModelResponse  # Or appropriate response type


class MyEndpointHandler(BaseTranslation):
    """
    Handler for processing {Endpoint} with guardrails.

    This class provides methods to:
    1. Process input (pre-call hook)
    2. Process output response (post-call hook)
    """

    async def process_input_messages(
        self,
        data: dict,
        guardrail_to_apply: "CustomGuardrail",
    ) -> Any:
        """
        Process input by applying guardrails to text content.
        
        Args:
            data: Request data dictionary
            guardrail_to_apply: The guardrail instance to apply
            
        Returns:
            Modified data with guardrails applied
        """
        # Your implementation here
        pass

    async def process_output_response(
        self,
        response: Any,  # Use appropriate response type
        guardrail_to_apply: "CustomGuardrail",
    ) -> Any:
        """
        Process output response by applying guardrails to text content.
        
        Args:
            response: API response object
            guardrail_to_apply: The guardrail instance to apply
            
        Returns:
            Modified response with guardrails applied
        """
        # Your implementation here
        pass
```

### 步驟 2：實作核心方法 {#step-2-implement-core-methods}

#### A. 處理輸入訊息 {#a-process-input-messages}

從輸入中擷取文字、套用 guardrails，並映射回去：

```python
async def process_input_messages(
    self,
    data: dict,
    guardrail_to_apply: "CustomGuardrail",
) -> Any:
    """Process input messages by applying guardrails to text content."""
    # 1. Get input data from request
    messages = data.get("messages")  # or appropriate field
    if messages is None:
        return data

    # 2. Extract text and create tasks
    tasks = []
    task_mappings: List[Tuple[int, Optional[int]]] = []
    
    for msg_idx, message in enumerate(messages):
        await self._extract_input_text_and_create_tasks(
            message=message,
            msg_idx=msg_idx,
            tasks=tasks,
            task_mappings=task_mappings,
            guardrail_to_apply=guardrail_to_apply,
        )

    # 3. Run all guardrail tasks in parallel
    if tasks:
        responses = await asyncio.gather(*tasks)

        # 4. Map responses back to original structure
        await self._apply_guardrail_responses_to_input(
            messages=messages,
            responses=responses,
            task_mappings=task_mappings,
        )

    return data
```

#### B. 處理輸出回應 {#b-process-output-response}

從回應中擷取文字、套用 guardrails，並更新：

```python
async def process_output_response(
    self,
    response: "ModelResponse",
    guardrail_to_apply: "CustomGuardrail",
) -> Any:
    """Process output response by applying guardrails to text content."""
    # 1. Check if response has text to process
    if not self._has_text_content(response):
        return response

    # 2. Extract text and create tasks
    tasks = []
    task_mappings: List[Tuple[int, Optional[int]]] = []
    
    for idx, item in enumerate(response.choices):  # or appropriate field
        await self._extract_output_text_and_create_tasks(
            item=item,
            idx=idx,
            tasks=tasks,
            task_mappings=task_mappings,
            guardrail_to_apply=guardrail_to_apply,
        )

    # 3. Run all guardrail tasks in parallel
    if tasks:
        responses = await asyncio.gather(*tasks)

        # 4. Update response with guardrailed text
        await self._apply_guardrail_responses_to_output(
            response=response,
            responses=responses,
            task_mappings=task_mappings,
        )

    return response
```

### 步驟 3：建立輔助方法 {#step-3-create-helper-methods}

實作用於文字擷取與映射的輔助方法：

```python
async def _extract_input_text_and_create_tasks(
    self,
    message: Dict[str, Any],
    msg_idx: int,
    tasks: List,
    task_mappings: List[Tuple[int, Optional[int]]],
    guardrail_to_apply: "CustomGuardrail",
) -> None:
    """Extract text content from a message and create guardrail tasks."""
    content = message.get("content")
    if content is None:
        return

    if isinstance(content, str):
        # Simple string content
        tasks.append(guardrail_to_apply.apply_guardrail(text=content))
        task_mappings.append((msg_idx, None))
    elif isinstance(content, list):
        # List content (e.g., multimodal)
        for content_idx, content_item in enumerate(content):
            if isinstance(content_item, dict):
                text_str = content_item.get("text")
                if text_str:
                    tasks.append(guardrail_to_apply.apply_guardrail(text=text_str))
                    task_mappings.append((msg_idx, int(content_idx)))

async def _apply_guardrail_responses_to_input(
    self,
    messages: List[Dict[str, Any]],
    responses: List[str],
    task_mappings: List[Tuple[int, Optional[int]]],
) -> None:
    """Apply guardrail responses back to input messages."""
    for task_idx, guardrail_response in enumerate(responses):
        msg_idx, content_idx = task_mappings[task_idx]
        
        if content_idx is None:
            # String content
            messages[msg_idx]["content"] = guardrail_response
        else:
            # List content
            messages[msg_idx]["content"][content_idx]["text"] = guardrail_response

def _has_text_content(self, response: Any) -> bool:
    """Check if response has any text content to process."""
    # Implement based on your response structure
    return True  # or appropriate logic
```

### 步驟 4：註冊處理器 {#step-4-register-the-handler}

建立 `__init__.py` 以使用呼叫類型註冊處理器：

```python
"""My Endpoint handler for Unified Guardrails."""

from litellm.llms.{provider}/{endpoint}/guardrail_translation.handler import (
    MyEndpointHandler,
)
from litellm.types.utils import CallTypes

guardrail_translation_mappings = {
    CallTypes.my_endpoint: MyEndpointHandler,
    CallTypes.amy_endpoint: MyEndpointHandler,  # async version if applicable
}

__all__ = ["guardrail_translation_mappings"]
```

**重要：** 請確保您的 `CallTypes` 已在 `litellm/types/utils.py` 中定義。

### 步驟 5：新增文件 {#step-5-add-documentation}

建立 `README.md`，包含使用範例與格式詳細資訊：

```markdown
# {Provider} {Endpoint} Guardrail Translation Handler

Handler for processing {Provider}'s {Endpoint} with guardrails.

## Overview

This handler processes {Endpoint} input/output by:
1. Extracting text from messages/responses
2. Applying guardrails to text content
3. Mapping guardrailed text back to original structure

## Data Format

### Input Format
```json
{
  "field": "value",
  "messages": [...]
}
```

### 輸出格式 {#output-format}
```json
{
  "field": "value",
  "output": [...]
}
```

## 使用方式 {#usage}

當將 guardrails 與此端點搭配使用時，系統會自動發現並套用該處理器。

```bash
curl -X POST 'http://localhost:4000/{my_endpoint}' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer your-api-key' \
-d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}],
    "guardrails": ["test"]
}'

```
## 擴充 {#extension}

覆寫以下方法以自訂行為：
- `_extract_input_text_and_create_tasks()`：自訂文字擷取
- `_apply_guardrail_responses_to_input()`：自訂回應映射
- `_has_text_content()`：自訂內容偵測
```

### Step 6: Add Unit Tests

Create comprehensive tests in `tests/test_litellm/llms/{provider}/{endpoint}/`:

```python
"""
Unit tests for {Provider} {Endpoint} Guardrail Translation Handler
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath("../../../../../.."))

from litellm.integrations.custom_guardrail import CustomGuardrail
from litellm.llms import get_guardrail_translation_mapping
from litellm.llms.{provider}.{endpoint}.guardrail_translation.handler import (
    MyEndpointHandler,
)
from litellm.types.utils import CallTypes


class MockGuardrail(CustomGuardrail):
    """Mock guardrail for testing"""
    
    async def apply_guardrail(self, text: str) -> str:
        return f"{text} [GUARDRAILED]"


class TestHandlerDiscovery:
    """Test that the handler is properly discovered"""
    
    def test_handler_discovered(self):
        handler_class = get_guardrail_translation_mapping(CallTypes.my_endpoint)
        assert handler_class == MyEndpointHandler


class TestInputProcessing:
    """Test input processing functionality"""
    
    @pytest.mark.asyncio
    async def test_process_simple_input(self):
        handler = MyEndpointHandler()
        guardrail = MockGuardrail(guardrail_name="test")
        
        data = {"messages": [{"role": "user", "content": "Hello"}]}
        result = await handler.process_input_messages(data, guardrail)
        
        assert result["messages"][0]["content"] == "Hello [GUARDRAILED]"


class TestOutputProcessing:
    """Test output processing functionality"""
    
    @pytest.mark.asyncio
    async def test_process_simple_output(self):
        handler = MyEndpointHandler()
        guardrail = MockGuardrail(guardrail_name="test")
        
        # Create mock response
        response = create_mock_response()
        result = await handler.process_output_response(response, guardrail)
        
        # Assert guardrail was applied
        assert "GUARDRAILED" in get_response_text(result)
```

## 支援 {#support}

如有問題或發生問題：
- 檢查既有的處理器實作以取得範例
- 檢閱基礎翻譯類別文件
- 在 GitHub 上建立 issue，並加上 `guardrails` 標籤
