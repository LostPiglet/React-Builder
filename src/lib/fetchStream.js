// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1秒
  maxDelay: 10000, // 10秒
  backoffMultiplier: 2
};

// 获取用户友好的错误消息
function getUserFriendlyErrorMessage(status, error) {
  switch (status) {
    case 401:
      return "❌ API 密钥无效，请检查您的 API Key 是否正确";
    case 403:
      return "❌ 访问被拒绝，请检查您的 API 权限";
    case 429:
      return "⏳ 请求过于频繁，请稍后再试。API 服务器正在限制请求频率";
    case 500:
      return "❌ 服务器内部错误，请稍后重试";
    case 502:
    case 503:
    case 504:
      return "❌ 服务器暂时不可用，请稍后重试";
    default:
      if (error?.message?.includes('Failed to fetch')) {
        return "❌ 网络连接失败，请检查网络连接或 Base URL 是否正确";
      }
      return `❌ 请求失败: ${error?.message || '未知错误'}`;
  }
}

export async function fetchStream({
  prompt,
  baseUrl,
  apiKey,
  modelName,
  onMessage,
  onDone,
  onError,
}) {
  let retryCount = 0;
  
  const attemptRequest = async () => {
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "React Builder Demo",
      },
      body: JSON.stringify({
          model: modelName || "gpt-4",
        messages: [{ role: "user", content: prompt }],
        stream: true,
          temperature: 0.7,
          max_tokens: 2000,
      }),
    });

      // 检查响应状态
      if (!res.ok) {
        const errorMessage = getUserFriendlyErrorMessage(res.status);
        
        // 对于 429 错误，如果还有重试次数，则重试
        if (res.status === 429 && retryCount < RETRY_CONFIG.maxRetries) {
          const delayTime = Math.min(
            RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount),
            RETRY_CONFIG.maxDelay
          );
          
          onMessage?.(`⏳ 请求频率过高，${delayTime / 1000}秒后自动重试 (${retryCount + 1}/${RETRY_CONFIG.maxRetries})...`);
          
          await delay(delayTime);
          retryCount++;
          return attemptRequest();
        }
        
        throw new Error(errorMessage);
      }

      if (!res.body) {
        throw new Error("❌ 响应体为空，请检查 API 配置");
      }

    const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      
      try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith("data:")) continue;
            
            const data = trimmedLine.replace(/^data:\s*/, "");
        if (data === "[DONE]") {
          onDone?.();
          return;
        }
            
        try {
          const json = JSON.parse(data);
          const chunk = json.choices?.[0]?.delta?.content;
              if (chunk) {
                onMessage?.(chunk);
              }
              
              // 检查是否有错误
              if (json.error) {
                throw new Error(`API 错误: ${json.error.message || '未知错误'}`);
              }
            } catch (parseError) {
              // 忽略 JSON 解析错误，继续处理下一行
              console.warn('JSON 解析错误:', parseError);
            }
      }
    }
      } finally {
        reader.releaseLock();
      }
      
      onDone?.();
      
    } catch (error) {
      console.error('fetchStream 错误:', error);
      
      // 对于网络错误，如果还有重试次数，则重试
      if (error.name === 'TypeError' && error.message.includes('fetch') && retryCount < RETRY_CONFIG.maxRetries) {
        const delayTime = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount),
          RETRY_CONFIG.maxDelay
        );
        
        onMessage?.(`🔄 网络连接失败，${delayTime / 1000}秒后自动重试 (${retryCount + 1}/${RETRY_CONFIG.maxRetries})...`);
        
        await delay(delayTime);
        retryCount++;
        return attemptRequest();
  }
      
      // 如果是我们自定义的错误消息，直接使用
      if (error.message.startsWith('❌') || error.message.startsWith('⏳')) {
        onError?.(new Error(error.message));
      } else {
        onError?.(new Error(getUserFriendlyErrorMessage(null, error)));
      }
    }
  };
  
  return attemptRequest();
}
