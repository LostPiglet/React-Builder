"use client";

import { useState, useRef, useCallback } from "react";
import InputBox from "@/components/InputBox";
import SettingPanel from "@/components/SettingPanel";
import CodePreview from "@/components/CodePreview";
import KeyboardHandler from "@/components/KeyboardHandler";
import StreamingText from "@/components/StreamingText";
import FloatingTip from "@/components/FloatingTip";
import { fetchStream } from "@/lib/fetchStream";

export default function Home() {
  const [cfg, setCfg] = useState({ baseUrl: "", apiKey: "", modelName: "" });
  const [streamText, setStreamText] = useState("");
  const [componentCode, setComponentCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamComplete, setStreamComplete] = useState(false);
  const inputRef = useRef(null);
  const lastRequestTime = useRef(0);

  // 防抖延迟（毫秒）
  const DEBOUNCE_DELAY = 1000;

  // 提取 JSX 代码块并处理用于预览
  const extractCode = (text) => {
    const parts = text.split("```");
    if (parts.length < 3) return null;
    let code = parts[1].replace(/^(\s*jsx|\s*js)?\s*/i, "").trim();

    // 格式化代码
    code = code
      .replace(/;\s*(?=[^\n])/g, ";\n")
      .replace(/}\s*(?=[^\n])/g, "}\n")
      .replace(/>\s*</g, ">\n<");

    // 清理不需要的导入和导出语句
    code = code
      .replace(/import\s.*?from\s+['"].*?['"];?/g, "")
      .replace(/export\s+default\s+/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "")
      .replace(/^\s*[A-Za-z_$][\w$]*\s*;?$/gm, "")
      .trim();

    // 提取组件名
    const fnMatch = code.match(/function\s+([A-Z]\w*)\s*\(/);
    const arrowMatch = code.match(/const\s+([A-Z]\w*)\s*=\s*\(/);
    const componentName = fnMatch?.[1] || arrowMatch?.[1];

    // 确保代码以组件定义开始，并在最后渲染组件（用于LivePreview）
    if (componentName) {
      // 移除任何现有的createRoot调用
      code = code.replace(/const\s+root\s*=\s*createRoot\(.*?\);\s*root\.render\(<.*?\/>\);?/g, '').trim();
      
      // 为LivePreview添加render调用（不使用createRoot）
      if (!code.includes('render(')) {
        code += `\n\nrender(<${componentName} />);`;
      }
    }

    return code;
  };

  const handleSubmit = useCallback(async (prompt) => {
    // 检查配置
    if (!cfg.baseUrl || !cfg.apiKey || !cfg.modelName) {
      setError("请先填写并保存 Base URL、API Key 和模型名称！");
      return;
    }

    // 防抖检查
    const now = Date.now();
    if (now - lastRequestTime.current < DEBOUNCE_DELAY) {
      setError(`请等待 ${Math.ceil((DEBOUNCE_DELAY - (now - lastRequestTime.current)) / 1000)} 秒后再试`);
      return;
    }
    lastRequestTime.current = now;

    // 清除之前的错误和结果
    setError(null);
    setStreamText("");
    setComponentCode(null);
    setLoading(true);
    setStreamComplete(false);

    const systemPrompt = `
你是一个 React 项目开发助手，用户会输入生成页面的指令。请你只返回一个完整的 JSX 函数组件，要求如下：
- 只输出一个 JSX 组件，用 \`\`\`jsx 包裹
- 不要输出任何解释、标题、注释
- 使用 const XXX = () => {} 的函数式写法
- 组件名请以大写字母开头（如 Countdown、Timer）
- 不包含 import/export 语句
- 保证结构完整，可直接渲染
- 请务必使用 Markdown 标准格式返回代码：使用三反引号jsx，代码内容换行，勿写在反引号后，JSX 标签需完整闭合，不要压缩在一行中
  `.trim();

    const fullPrompt = `${systemPrompt}\n\n用户指令：${prompt.trim()}`;

    try {
      await fetchStream({
        prompt: fullPrompt,
        baseUrl: cfg.baseUrl,
        apiKey: cfg.apiKey,
        modelName: cfg.modelName,
        onMessage: (chunk) => {
          setStreamText((prev) => {
            const next = prev + chunk;
            const code = extractCode(next);
            if (code) {
              setComponentCode((oldCode) => oldCode ?? code);
            }
            return next;
          });
        },
        onDone: () => {
          setLoading(false);
          setStreamComplete(true);
        },
        onError: (err) => {
          console.error('请求错误:', err);
          setError(err.message);
          setLoading(false);
          setStreamComplete(true);
        },
      });
    } catch (err) {
      console.error('提交错误:', err);
      setError("提交请求时发生未知错误，请稍后重试");
      setLoading(false);
      setStreamComplete(true);
    }
  }, [cfg.baseUrl, cfg.apiKey, cfg.modelName]);

  const handleTabSwitch = (tab) => {
    // 创建一个自定义事件来切换CodePreview的标签
    const event = new CustomEvent('switchTab', { detail: { tab } });
    window.dispatchEvent(event);
  };

  const handleClearInput = () => {
    if (inputRef.current) {
      inputRef.current.clearInput();
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <>
      <KeyboardHandler onTabSwitch={handleTabSwitch} onClearInput={handleClearInput} />
      <FloatingTip />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* 优化的背景装饰 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* 主要装饰球 */}
          <div
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-40 animate-float"
            style={{
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.3), rgba(147, 51, 234, 0.2), transparent)",
              filter: "blur(40px)",
            }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-40 animate-float"
            style={{
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2), transparent)",
              filter: "blur(40px)",
              animationDelay: "3s",
            }}
          />
          
          {/* 次要装饰元素 */}
          <div
            className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full opacity-20 animate-bounce-subtle"
            style={{
              background: "linear-gradient(45deg, rgba(99, 102, 241, 0.2), rgba(147, 51, 234, 0.1))",
              filter: "blur(20px)",
              animationDelay: "1s",
            }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full opacity-25 animate-bounce-subtle"
            style={{
              background: "linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.1))",
              filter: "blur(15px)",
              animationDelay: "2s",
            }}
          />
        </div>

        {/* 主要内容区域 */}
        <main className="relative">
          <div className="container-fluid section-spacing">
            {/* 标题区域 - 改进的响应式设计 */}
            <header className="text-center space-y-6 sm:space-y-8 fade-in mb-16 sm:mb-20">
              {/* Logo图标 */}
              <div className="flex justify-center mb-6 sm:mb-8">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl shadow-xl hover-lift animate-bounce-subtle"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  }}
                  role="img"
                  aria-label="React Builder Logo"
                >
                  <span className="text-2xl sm:text-3xl" role="img" aria-label="工具图标">
                    🛠️
                  </span>
                </div>
              </div>
              
              {/* 主标题 */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-gradient">
                React Builder
              </h1>
              
              {/* 副标题 */}
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-4">
                使用自然语言描述，AI 为您自动生成现代化的 React 组件
              </p>
              
              {/* 特性标签 */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-8 px-4">
                {['AI 驱动', '实时预览', '代码导出', '响应式设计'].map((feature, index) => (
                  <span
                    key={feature}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-100/80 backdrop-blur-sm rounded-full border border-indigo-200/50 fade-in-delay-1"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </header>

            {/* 内容区域 - 改进的网格布局 */}
            <div className="space-y-8 sm:space-y-12">
              {/* 设置面板 */}
              <section className="fade-in-delay-1" aria-labelledby="settings-heading">
                <h2 id="settings-heading" className="sr-only">API 配置设置</h2>
                <SettingPanel onConfigChange={setCfg} />
              </section>

              {/* 输入框 */}
              <section className="fade-in-delay-2" aria-labelledby="input-heading">
                <h2 id="input-heading" className="sr-only">组件生成输入</h2>
                <InputBox ref={inputRef} onSubmit={handleSubmit} disabled={loading} />
              </section>

              {/* 错误提示区域 */}
              {error && (
                <section className="fade-in-delay-3" aria-labelledby="error-heading">
                  <h2 id="error-heading" className="sr-only">错误信息</h2>
                  <div className="glass-card p-6 sm:p-8 border-red-200/50">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-3 h-3 bg-red-500 rounded-full mt-1" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-red-800 mb-2">
                          请求失败
                        </h3>
                        <div className="text-red-700 leading-relaxed mb-4">
                          {error}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={clearError}
                            className="btn-secondary text-sm"
                          >
                            关闭
                          </button>
                          {error.includes('429') && (
                            <div className="text-sm text-gray-600">
                              💡 建议：等待几分钟后再试，或检查 API 额度限制
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 生成过程显示区域 */}
              <section className="fade-in-delay-3" aria-labelledby="generation-heading">
                <h2 id="generation-heading" className="sr-only">AI 生成过程</h2>
                <div className="glass-card p-6 sm:p-8 min-h-[140px]">
                  {/* 状态指示器 */}
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                        loading ? 'bg-yellow-500 animate-pulse' : 
                        streamText ? 'bg-green-500' : 
                        error ? 'bg-red-500' : 'bg-gray-400'
                      }`}
                      aria-hidden="true"
                    />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                      {loading ? 'AI 生成中' : 
                       streamText ? 'AI 生成完成' : 
                       error ? '生成失败' : 'AI 生成过程'}
                    </h3>
                    {loading && (
                      <div className="flex items-center gap-2 ml-auto">
                        <div className="flex space-x-1" aria-hidden="true">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 内容显示 */}
                  <div className="text-gray-700 leading-relaxed">
                    {loading || streamText ? (
                      <div className="space-y-4">
                        {loading && !streamText && (
                          <div className="flex items-center gap-4 py-4">
                            <span className="text-indigo-600 font-medium">
                              AI 正在思考中，请稍候...
                            </span>
                          </div>
                        )}
                        
                        {streamText && (
                          <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
                            <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              AI 回复 {streamComplete && <span className="text-green-600">• 完成</span>}
                            </div>
                            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                                             <StreamingText 
                                 text={streamText}
                                 speed={40}
                                 isComplete={streamComplete}
                                 className="text-gray-800"
                               />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 italic text-lg mb-2">
                          🚀 准备就绪
                        </div>
                        <p className="text-gray-500">
                          输入您的组件描述，开始生成 React 组件
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* 代码预览区域 */}
              {componentCode && (
                <section className="fade-in-delay-4" aria-labelledby="preview-heading">
                  <h2 id="preview-heading" className="sr-only">生成的组件预览</h2>
                  <CodePreview code={componentCode} />
                </section>
              )}
            </div>
          </div>
        </main>

        {/* 页脚 */}
        <footer className="relative mt-20 py-8 text-center text-gray-500 text-sm border-t border-gray-200/50">
          <div className="container-fluid">
            <p>
              Powered by AI • Built with ❤️ using React & Next.js
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
