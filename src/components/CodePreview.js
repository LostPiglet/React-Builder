"use client";
import React, { useState, useEffect, useRef } from "react";
import { LiveProvider, LiveEditor, LiveError, LivePreview } from "react-live";
import { 
  Eye, 
  Code, 
  Copy, 
  Check, 
  Download,
  RefreshCw 
} from "lucide-react";

// 自定义亮色主题
const lightTheme = {
  plain: {
    color: "#24292f",
    backgroundColor: "transparent",
    fontSize: "14px",
    fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
  },
  styles: [
    {
      types: ["comment"],
      style: {
        color: "#6a737d",
        fontStyle: "italic",
      },
    },
    {
      types: ["string", "inserted"],
      style: {
        color: "#032f62",
      },
    },
    {
      types: ["number"],
      style: {
        color: "#005cc5",
      },
    },
    {
      types: ["builtin", "char", "constant", "function"],
      style: {
        color: "#6f42c1",
      },
    },
    {
      types: ["punctuation", "selector"],
      style: {
        color: "#24292f",
      },
    },
    {
      types: ["variable"],
      style: {
        color: "#e36209",
      },
    },
    {
      types: ["class-name", "attr-name"],
      style: {
        color: "#6f42c1",
      },
    },
    {
      types: ["tag", "deleted"],
      style: {
        color: "#22863a",
      },
    },
    {
      types: ["operator"],
      style: {
        color: "#d73a49",
      },
    },
    {
      types: ["boolean"],
      style: {
        color: "#005cc5",
      },
    },
    {
      types: ["keyword"],
      style: {
        color: "#d73a49",
        fontWeight: "bold",
      },
    },
    {
      types: ["doctype"],
      style: {
        color: "#6a737d",
        fontStyle: "italic",
      },
    },
  ],
};

export default function CodePreview({ code }) {
  const [activeTab, setActiveTab] = useState("preview");
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const boxRef = useRef(null);

  /* 自动滚动到预览区 */
  useEffect(() => {
    boxRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [code]);

  /* 监听键盘切换标签事件 */
  useEffect(() => {
    const handleSwitchTab = (e) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };

    window.addEventListener('switchTab', handleSwitchTab);
    return () => window.removeEventListener('switchTab', handleSwitchTab);
  }, []);

  /* 为LivePreview添加基础样式 */
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .react-live-preview {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
      }
      .react-live-preview * {
        box-sizing: border-box;
      }
      .react-live-preview h1, .react-live-preview h2, .react-live-preview h3 {
        margin: 0 0 1rem 0;
        font-weight: 600;
        color: #1f2937;
      }
      .react-live-preview h1 { font-size: 1.875rem; }
      .react-live-preview h2 { font-size: 1.5rem; }
      .react-live-preview h3 { font-size: 1.25rem; }
      .react-live-preview p {
        margin: 0 0 1rem 0;
        color: #374151;
      }
      .react-live-preview ul, .react-live-preview ol {
        margin: 0 0 1rem 0;
        padding-left: 1.5rem;
      }
      .react-live-preview li {
        margin: 0.5rem 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem;
        border-radius: 0.375rem;
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
      }
      .react-live-preview li > * {
        flex-shrink: 0;
      }
      .react-live-preview li > span,
      .react-live-preview li > div:first-child {
        flex: 1;
        margin-right: 0.5rem;
      }
      .react-live-preview button {
        background-color: #3b82f6;
        color: white;
        border: none;
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        margin-left: 0.5rem;
      }
      .react-live-preview button:hover {
        background-color: #2563eb;
        transform: translateY(-1px);
      }
      .react-live-preview button:active {
        transform: translateY(0);
      }
      .react-live-preview button.danger {
        background-color: #ef4444;
      }
      .react-live-preview button.danger:hover {
        background-color: #dc2626;
      }
      .react-live-preview input[type="text"], 
      .react-live-preview input[type="email"], 
      .react-live-preview input[type="password"],
      .react-live-preview textarea {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        margin: 0.25rem 0;
        transition: border-color 0.2s;
      }
      .react-live-preview input:focus,
      .react-live-preview textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      .react-live-preview form {
        margin: 1rem 0;
      }
      .react-live-preview .card {
        background: white;
        border-radius: 0.5rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin: 1rem 0;
      }
      .react-live-preview .flex {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .react-live-preview .grid {
        display: grid;
        gap: 1rem;
      }
      .react-live-preview .space-y-4 > * + * {
        margin-top: 1rem;
      }
      .react-live-preview .text-center {
        text-align: center;
      }
      .react-live-preview .text-lg {
        font-size: 1.125rem;
      }
      .react-live-preview .font-bold {
        font-weight: 700;
      }
      .react-live-preview .text-gray-600 {
        color: #6b7280;
      }
      .react-live-preview .text-green-600 {
        color: #059669;
      }
      .react-live-preview .text-red-600 {
        color: #dc2626;
      }
      .react-live-preview .bg-green-100 {
        background-color: #dcfce7;
      }
      .react-live-preview .bg-red-100 {
        background-color: #fecaca;
      }
      .react-live-preview .rounded {
        border-radius: 0.375rem;
      }
      .react-live-preview .p-4 {
        padding: 1rem;
      }
      .react-live-preview .m-2 {
        margin: 0.5rem;
      }
      .react-live-preview .mt-4 {
        margin-top: 1rem;
      }
      .react-live-preview .mb-4 {
        margin-bottom: 1rem;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const copyCode = async () => {
    try {
      // 复制时移除render调用，只保留组件定义
      const cleanCode = code.replace(/\n\nrender\(<.*?\/>\);?$/g, '').trim();
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  const downloadCode = () => {
    // 下载时也移除render调用
    const cleanCode = code.replace(/\n\nrender\(<.*?\/>\);?$/g, '').trim();
    const blob = new Blob([cleanCode], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "component.jsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const refreshPreview = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const tabs = [
    { id: "preview", label: "预览效果", icon: Eye, shortcut: "1" },
    { id: "code", label: "源代码", icon: Code, shortcut: "2" },
  ];

  // 为代码编辑器显示准备的代码（移除render调用）
  const displayCode = code.replace(/\n\nrender\(<.*?\/>\);?$/g, '').trim();

  return (
    <LiveProvider
      code={code}
      noInline={true}
      scope={{ React, useState, useEffect, useRef }}
      theme={lightTheme}
    >
      <div
        ref={boxRef}
        className="glass-card overflow-hidden transition-all duration-500"
        role="region"
        aria-labelledby="preview-title"
      >
        {/* 增强的标题栏 */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
              <h3 id="preview-title" className="text-lg sm:text-xl font-semibold text-gray-800">
                组件已生成
              </h3>
            </div>
            {/* 代码统计 */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 bg-white/60 px-3 py-1.5 rounded-full">
              <span>{displayCode.split('\n').length} 行</span>
              <span>{displayCode.length} 字符</span>
            </div>
          </div>
          
          {/* 操作按钮组 */}
          <div className="flex items-center gap-2">
            <button
              onClick={refreshPreview}
              disabled={isRefreshing}
              className="btn-secondary flex items-center gap-2 text-sm px-3 py-2"
              aria-label="刷新预览"
              title="刷新预览"
            >
              <RefreshCw 
                size={14} 
                className={isRefreshing ? "animate-spin" : ""} 
              />
              <span className="hidden sm:inline">刷新</span>
            </button>
            
            <button
              onClick={downloadCode}
              className="btn-secondary flex items-center gap-2 text-sm px-3 py-2"
              aria-label="下载代码"
              title="下载为 JSX 文件"
            >
              <Download size={14} />
              <span className="hidden sm:inline">下载</span>
            </button>
            
            <button
              onClick={copyCode}
              className="btn-secondary flex items-center gap-2 text-sm px-3 py-2"
              aria-label="复制代码"
              title="复制到剪贴板"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-green-600" />
                  <span className="text-green-600 hidden sm:inline">已复制</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span className="hidden sm:inline">复制</span>
                </>
              )}
            </button>
            

          </div>
        </div>

        {/* 增强的选项卡 */}
        <div className="flex border-b border-white/20 bg-white/30">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium transition-all duration-300 relative ${
                  activeTab === tab.id
                    ? "text-indigo-600 bg-white/50"
                    : "text-gray-600 hover:text-gray-800 hover:bg-white/30"
                }`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                tabIndex={activeTab === tab.id ? 0 : -1}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 bg-gray-100/80 text-xs rounded text-gray-500">
                  {tab.shortcut}
                </kbd>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* 内容区域 */}
        <div className="max-h-[600px] overflow-auto">
          {/* 预览面板 */}
          {activeTab === "preview" && (
            <div 
              id="preview-panel"
              className="p-6 sm:p-8 bg-gradient-to-br from-gray-50 to-white min-h-[300px]"
              role="tabpanel"
              aria-labelledby="preview-tab"
            >
              <div className="w-full h-full flex items-center justify-center min-h-[300px]">
                <div className="w-full max-w-4xl mx-auto">
                  {isRefreshing ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="flex items-center gap-3 text-gray-500">
                        <RefreshCw size={20} className="animate-spin" />
                        <span>刷新中...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fade-in-scale flex items-center justify-center">
                      <div className="w-full flex justify-center">
                  <LivePreview />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 代码面板 */}
          {activeTab === "code" && (
            <div 
              id="code-panel"
              className="relative bg-gray-50/50"
              role="tabpanel"
              aria-labelledby="code-tab"
            >
              <LiveEditor
                code={displayCode}
                className="text-sm leading-relaxed"
                style={{
                  padding: "24px",
                  minHeight: "400px",
                  lineHeight: "1.6",
                  border: "1px solid #e1e8ed",
                  borderRadius: "0px",
                }}
                onChange={() => {}} // 只读模式
              />
              
              {/* 代码统计覆盖层 */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-3 py-1.5 rounded-lg border border-gray-200/50 shadow-sm">
                {displayCode.split('\n').length} 行 • {displayCode.length} 字符
              </div>
            </div>
          )}
        </div>

        {/* 错误显示 */}
        <LiveError className="p-4 bg-red-50/90 backdrop-blur-sm text-red-600 border-t border-red-200 text-sm" />

        {/* 增强的状态栏 */}
        <div className="px-4 sm:px-6 py-3 bg-white/30 border-t border-white/20 text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true" />
              <span>React Live Preview</span>
            </div>
            <div className="hidden sm:block">
              {activeTab === "preview" ? "实时预览模式" : "代码查看模式"}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-gray-400">
              按 1/2 快速切换标签
            </div>
            <div className="flex items-center gap-1">
            <span>运行正常</span>
            </div>
          </div>
        </div>
      </div>
    </LiveProvider>
  );
}
