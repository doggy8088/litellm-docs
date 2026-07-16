import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 圖片 URL 處理  {#image-url-handling}

<Image img={require('../../img/image_handling.png')}  style={{ width: '900px', height: 'auto' }} />

有些 LLM API 不支援圖片的 URL，但支援 base-64 字串。 

對於這些情況，LiteLLM 會：

1. 偵測是否傳入了 URL
2. 檢查該 LLM API 是否支援 URL
3. 否則，將下載 base64 
4. 向提供者傳送 base64 字串。 

LiteLLM 也會將此結果快取於記憶體中，以降低後續請求的延遲。 

記憶體快取的限制為 1MB。
