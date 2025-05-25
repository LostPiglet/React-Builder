"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Settings2,
  ChevronDown,
  ChevronUp,
  Key,
  Link,
  Save,
  Check,
  AlertCircle,
  Cpu,
  Globe,
} from "lucide-react";

export default function SettingPanel({ onConfigChange }) {
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("");
  const [provider, setProvider] = useState("openrouter");
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // 预设的模型配置
  const modelPresets = useMemo(() => ({
    openrouter: {
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      models: [
        "qwen/qwen-2.5-72b-instruct",
        "anthropic/claude-3-opus",
        "anthropic/claude-3-sonnet",
        "openai/gpt-4",
        "openai/gpt-4-turbo",
        "openai/gpt-3.5-turbo",
        "google/gemini-pro",
        "meta-llama/llama-3-70b-instruct",
      ]
    },
    openai: {
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      models: [
        "gpt-4",
        "gpt-4-turbo",
        "gpt-4o",
        "gpt-3.5-turbo",
      ]
    },
    custom: {
      name: "自定义",
      baseUrl: "",
      models: []
    }
  }), []);

  /* 初始化读取本地存储 */
  useEffect(() => {
    const u = localStorage.getItem("rb-baseUrl");
    const k = localStorage.getItem("rb-apiKey");
    const m = localStorage.getItem("rb-modelName");
    const p = localStorage.getItem("rb-provider") || "openrouter";
    
    if (u) setBaseUrl(u);
    if (k) setApiKey(k);
    if (m) setModelName(m);
    setProvider(p);
    
    // 如果没有存储的模型名，设置默认值
    if (!m && modelPresets[p]?.models[0]) {
      setModelName(modelPresets[p].models[0]);
    }
    
    if (u && k && (m || modelPresets[p]?.models[0])) {
      onConfigChange({ 
        baseUrl: u, 
        apiKey: k, 
        modelName: m || modelPresets[p].models[0]
      });
    }
  }, [onConfigChange, modelPresets]);

  // 当提供商变化时自动更新URL和模型
  useEffect(() => {
    if (provider !== "custom" && modelPresets[provider]) {
      setBaseUrl(modelPresets[provider].baseUrl);
      if (modelPresets[provider].models[0]) {
        setModelName(modelPresets[provider].models[0]);
      }
    }
  }, [provider, modelPresets]);

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!baseUrl.trim()) {
      newErrors.baseUrl = "请输入 Base URL";
    } else if (!validateUrl(baseUrl)) {
      newErrors.baseUrl = "请输入有效的 URL 格式";
    }
    
    if (!apiKey.trim()) {
      newErrors.apiKey = "请输入 API Key";
    } else if (apiKey.length < 10) {
      newErrors.apiKey = "API Key 长度至少需要10个字符";
    } else if (provider === "openrouter" && !apiKey.startsWith("sk-or-")) {
      newErrors.apiKey = "OpenRouter API Key 应该以 'sk-or-' 开头";
    }

    if (!modelName.trim()) {
      newErrors.modelName = "请选择模型";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const testConnection = async () => {
    if (!validateForm()) {
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
      const cleanApiKey = apiKey.trim();
      
      // 构建请求头
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cleanApiKey}`,
      };

      // 为OpenRouter添加必要的请求头
      if (cleanBaseUrl.includes('openrouter.ai')) {
        headers["HTTP-Referer"] = window.location.href;
        headers["X-Title"] = "React Builder";
      }

      const response = await fetch(`${cleanBaseUrl}/models`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        setTestResult({ success: true, message: "✅ API 连接测试成功！" });
      } else {
        const errorText = await response.text();
        setTestResult({ 
          success: false, 
          message: `❌ 连接失败: ${response.status} ${response.statusText}` 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `❌ 连接失败: ${error.message}` 
      });
    } finally {
      setTesting(false);
    }
  };

  const save = () => {
    if (!validateForm()) {
      return;
    }

    localStorage.setItem("rb-baseUrl", baseUrl);
    localStorage.setItem("rb-apiKey", apiKey);
    localStorage.setItem("rb-modelName", modelName);
    localStorage.setItem("rb-provider", provider);
    onConfigChange({ baseUrl, apiKey, modelName, provider });
    setSaved(true);
    setErrors({});
    setTestResult(null);
    setTimeout(() => setSaved(false), 3000);
  };

  const isConfigured = baseUrl && apiKey && modelName && Object.keys(errors).length === 0;

  return (
    <div className="w-full" role="region" aria-labelledby="settings-title">
      {/* 切换按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className="group w-full flex items-center justify-between p-4 sm:p-6 glass-card hover:bg-white/80 transition-all duration-300 hover:shadow-lg active-scale focus-visible-ring"
        aria-expanded={open}
        aria-controls="settings-content"
        aria-describedby="settings-description"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
            <Settings2 size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="text-left">
            <h3 id="settings-title" className="font-semibold text-gray-800 text-base sm:text-lg">
              AI 模型配置
            </h3>
            <p id="settings-description" className="text-sm text-gray-500 mt-0.5">
              配置您的 API 密钥、端点和模型
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 配置状态指示器 */}
          {isConfigured && (
        <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
              <span className="text-xs text-green-600 font-medium hidden sm:inline">
                已配置
              </span>
            </div>
          )}
          
          {/* 展开图标 */}
          {open ? (
            <ChevronUp
              className="text-gray-400 group-hover:text-indigo-600 transition-colors"
              size={20}
              aria-hidden="true"
            />
          ) : (
            <ChevronDown
              className="text-gray-400 group-hover:text-indigo-600 transition-colors"
              size={20}
              aria-hidden="true"
            />
          )}
        </div>
      </button>

      {/* 设置面板内容 */}
      <div
        id="settings-content"
        className={`transition-all duration-500 ${
          open ? "max-h-[800px] opacity-100 mt-4" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="glass-card overflow-hidden p-6 sm:p-8 space-y-6 sm:space-y-8">
          <div className="space-y-6">
            {/* 提供商选择和模型名称 - 一行显示 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* 提供商选择 */}
              <div className="space-y-3">
                <label 
                  htmlFor="provider-input"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  <Globe size={16} className="text-indigo-600" />
                  AI 提供商
                  <span className="text-red-500" aria-label="必填项">*</span>
                </label>
                <div className="relative">
                  <select
                    id="provider-input"
                    className={`input-field appearance-none ${
                      errors.provider ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''
                    }`}
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      if (errors.provider) {
                        setErrors(prev => ({ ...prev, provider: null }));
                      }
                    }}
                    aria-describedby={errors.provider ? "provider-error" : "provider-help"}
                    aria-invalid={!!errors.provider}
                  >
                    {Object.entries(modelPresets).map(([key, preset]) => (
                      <option key={key} value={key}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                        errors.provider ? "bg-red-500" :
                        provider ? "bg-green-500" : "bg-gray-300"
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                {errors.provider ? (
                  <div id="provider-error" className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={14} />
                    {errors.provider}
                  </div>
                ) : (
                  <div id="provider-help" className="text-xs text-gray-500">
                    选择 AI 服务提供商
                  </div>
                )}
              </div>

              {/* 模型选择 */}
              <div className="space-y-3">
                <label 
                  htmlFor="model-name-input"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  <Cpu size={16} className="text-indigo-600" />
                  模型名称
                  <span className="text-red-500" aria-label="必填项">*</span>
                </label>
                <div className="relative">
                  {provider === "custom" ? (
                    <input
                      id="model-name-input"
                      type="text"
                      className={`input-field ${
                        errors.modelName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''
                      }`}
                      placeholder="gpt-4"
                      value={modelName}
                      onChange={(e) => {
                        setModelName(e.target.value);
                        if (errors.modelName) {
                          setErrors(prev => ({ ...prev, modelName: null }));
                        }
                      }}
                      aria-describedby={errors.modelName ? "model-name-error" : "model-name-help"}
                      aria-invalid={!!errors.modelName}
                    />
                  ) : (
                    <select
                      id="model-name-input"
                      className={`input-field appearance-none ${
                        errors.modelName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''
                      }`}
                      value={modelName}
                      onChange={(e) => {
                        setModelName(e.target.value);
                        if (errors.modelName) {
                          setErrors(prev => ({ ...prev, modelName: null }));
                        }
                      }}
                      aria-describedby={errors.modelName ? "model-name-error" : "model-name-help"}
                      aria-invalid={!!errors.modelName}
      >
                      <option value="">选择模型</option>
                      {modelPresets[provider]?.models.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                        errors.modelName ? "bg-red-500" :
                        modelName ? "bg-green-500" : "bg-gray-300"
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                {errors.modelName ? (
                  <div id="model-name-error" className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={14} />
                    {errors.modelName}
                  </div>
                ) : (
                  <div id="model-name-help" className="text-xs text-gray-500">
                    {provider === "custom" ? "输入模型名称" : "从可用模型中选择"}
                  </div>
                )}
              </div>
            </div>

          {/* Base URL 输入 */}
            <div className="space-y-3">
              <label 
                htmlFor="base-url-input"
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
              <Link size={16} className="text-indigo-600" />
              Base URL
                <span className="text-red-500" aria-label="必填项">*</span>
            </label>
            <div className="relative">
              <input
                  id="base-url-input"
                  type="url"
                  className={`input-field ${
                    errors.baseUrl ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''
                  }`}
                  placeholder="https://api.openai.com/v1"
                value={baseUrl}
                  onChange={(e) => {
                    setBaseUrl(e.target.value);
                    if (errors.baseUrl) {
                      setErrors(prev => ({ ...prev, baseUrl: null }));
                    }
                  }}
                  aria-describedby={errors.baseUrl ? "base-url-error" : "base-url-help"}
                  aria-invalid={!!errors.baseUrl}
                  disabled={provider !== "custom"}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      errors.baseUrl ? "bg-red-500" :
                      baseUrl && validateUrl(baseUrl) ? "bg-green-500" : "bg-gray-300"
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </div>
              {errors.baseUrl ? (
                <div id="base-url-error" className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle size={14} />
                  {errors.baseUrl}
                </div>
              ) : (
                <div id="base-url-help" className="text-xs text-gray-500">
                  {provider !== "custom" ? "自动设置为选择的提供商" : "输入自定义 API 端点"}
            </div>
              )}
          </div>

          {/* API Key 输入 */}
            <div className="space-y-3">
              <label 
                htmlFor="api-key-input"
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
              <Key size={16} className="text-indigo-600" />
              API Key
                <span className="text-red-500" aria-label="必填项">*</span>
            </label>
            <div className="relative">
              <input
                  id="api-key-input"
                type="password"
                  className={`input-field ${
                    errors.apiKey ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''
                  }`}
                placeholder="sk-..."
                value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (errors.apiKey) {
                      setErrors(prev => ({ ...prev, apiKey: null }));
                    }
                  }}
                  aria-describedby={errors.apiKey ? "api-key-error" : "api-key-help"}
                  aria-invalid={!!errors.apiKey}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      errors.apiKey ? "bg-red-500" :
                      apiKey && apiKey.length >= 10 ? "bg-green-500" : "bg-gray-300"
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </div>
              {errors.apiKey ? (
                <div id="api-key-error" className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle size={14} />
                  {errors.apiKey}
                </div>
              ) : (
                <div id="api-key-help" className="text-xs text-gray-500">
                  您的密钥将安全存储在本地浏览器中
                </div>
              )}
            </div>
          </div>

          {/* 测试和保存按钮 */}
          <div className="space-y-3">
            {/* 测试连接按钮 */}
            <button
              onClick={testConnection}
              disabled={!baseUrl || !apiKey || !modelName || testing}
              className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                baseUrl && apiKey && modelName && !testing
                  ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-lg shadow-blue-600/25"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {testing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  测试连接中...
                </>
              ) : (
                <>
                  <Globe size={18} />
                  测试 API 连接
                </>
              )}
            </button>

            {/* 测试结果显示 */}
            {testResult && (
              <div className={`flex items-center gap-3 text-sm px-4 py-3 rounded-xl border ${
                testResult.success 
                  ? "text-green-600 bg-green-50/80 border-green-200/50" 
                  : "text-red-600 bg-red-50/80 border-red-200/50"
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  testResult.success ? "bg-green-500" : "bg-red-500"
                }`} />
                <span>{testResult.message}</span>
              </div>
            )}

            {/* 保存按钮 */}
            <button
              onClick={save}
              disabled={!baseUrl || !apiKey || !modelName}
              className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium transition-all duration-300 ${
                saved
                  ? "bg-green-600 text-white shadow-lg shadow-green-600/25"
                  : baseUrl && apiKey && modelName
                  ? "btn-primary hover:scale-105"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              aria-describedby="save-button-status"
            >
              {saved ? (
                <>
                  <Check size={18} />
                  配置已保存
                </>
              ) : (
                <>
                  <Save size={18} />
                  保存配置
                </>
              )}
            </button>
          </div>

          {/* 状态提示 */}
          {isConfigured && !saved && (
            <div className="flex items-center gap-3 text-sm text-green-600 bg-green-50/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-green-200/50">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
              <span>配置完成，可以开始生成组件</span>
            </div>
          )}

          {/* 帮助信息 */}
          <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 backdrop-blur-sm rounded-xl p-4 border border-amber-100/50">
            <div className="flex items-start gap-3">
              <div className="text-sm text-gray-600 leading-relaxed min-w-0">
                <p className="font-medium text-gray-700 mb-2">配置说明：</p>
                <ul className="space-y-1.5 text-gray-600">
                  <li>• 支持 OpenAI、OpenRouter 等兼容 OpenAI API 的服务</li>
                  <li>• <strong>OpenRouter API Key</strong> 以 'sk-or-' 开头，请从 openrouter.ai 获取</li>
                  <li>• API Key 仅存储在您的浏览器本地，不会上传到服务器</li>
                  <li>• 建议先点击"测试 API 连接"验证配置是否正确</li>
                  <li>• 配置保存后即可开始使用 AI 生成功能</li>
                  <li>• 自定义选项可以使用任何兼容的 API 端点</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
