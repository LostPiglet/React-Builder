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
      // 清理 baseUrl，移除末尾的斜杠
      const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
      // 清理 apiKey，移除前后空格
      const cleanApiKey = apiKey.trim();
      
      // 构建请求头
      const headers = {
        "Content-Type": "application/json",
      };
      
      // 根据不同API提供商设置不同的认证头
      if (cleanBaseUrl.includes('openrouter.ai')) {
        // OpenRouter认证头格式
        headers["Authorization"] = `Bearer ${cleanApiKey}`;
      } else {
        // 标准Bearer认证头
        headers["Authorization"] = `Bearer ${cleanApiKey}`;
      }

      // 为OpenRouter添加必要的请求头
      if (cleanBaseUrl.includes('openrouter.ai')) {
        // 正确的头部名称是"HTTP-Referer"
        headers["HTTP-Referer"] = window.location.origin;
        headers["X-Title"] = "React Builder";
        // 添加额外的OpenRouter推荐头部
        headers["X-Original-Domain"] = window.location.origin;
      }

      // 准备请求体
      const requestBody = {
        model: modelName || "gpt-4",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      };
      
      // 如果是OpenRouter，添加额外的参数
      if (cleanBaseUrl.includes('openrouter.ai')) {
        requestBody.route = "fallback"; // 使用fallback路由确保高可用性
        requestBody.transforms = ["middle-out"]; // 更好的流式处理支持
      }
      
      console.log("发送请求到:", `${cleanBaseUrl}/chat/completions`);
      console.log("请求头:", JSON.stringify(headers));
      console.log("API Key (前5位):", cleanApiKey.substring(0, 5) + "...");
      
      const res = await fetch(`${cleanBaseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      // 检查响应状态
      if (!res.ok) {
        // 尝试获取错误详情
        let errorDetails = '';
        let errorJson = null;
        try {
          const errorText = await res.text();
          try {
            errorJson = JSON.parse(errorText);
            errorDetails = errorJson.error?.message || errorText;
          } catch (parseError) {
            // 如果不是JSON，使用原始文本
            errorDetails = errorText;
          }
        } catch (e) {
          errorDetails = `无法获取错误详情: ${e.message}`;
        }
        
        console.error(`API请求失败: ${res.status} ${res.statusText}`, errorDetails);
        
        // 记录更多调试信息
        console.log("完整请求信息:", {
          url: `${cleanBaseUrl}/chat/completions`,
          headers: headers,
          status: res.status,
          statusText: res.statusText,
          errorDetails: errorDetails
        });
        
        let errorMessage = getUserFriendlyErrorMessage(res.status);
        
        // 为401错误添加更具体的提示
        if (res.status === 401) {
          if (cleanBaseUrl.includes('openrouter.ai')) {
            errorMessage = "❌ OpenRouter API 密钥无效。请确保：\n" +
                          "• API Key 以 'sk-or-' 开头\n" +
                          "• 在 OpenRouter 官网验证密钥是否有效\n" +
                          "• 检查是否有足够的余额或配额\n" +
                          "• 确认您已经在 OpenRouter 账户设置中添加了本站域名";
                          
            // 如果错误详情中包含特定信息，提供更精确的错误提示
            if (errorDetails.includes("No auth credentials found")) {
              errorMessage = "❌ OpenRouter 无法识别您的认证凭据。请确保：\n" +
                            "• API Key 格式正确，以 'sk-or-' 开头\n" +
                            "• 复制粘贴时没有多余的空格\n" +
                            "• 在OpenRouter网站验证API Key是否有效";
            } else if (errorDetails.includes("invalid")) {
              errorMessage = "❌ OpenRouter API 密钥无效。请从OpenRouter网站重新获取有效的API Key";
            }
          } else {
            errorMessage = "❌ API 密钥无效，请检查您的 API Key 是否正确";
          }
        }
        
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
