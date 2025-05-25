"use client";
import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import { SendHorizontal, Sparkles, Command } from "lucide-react";

const InputBox = forwardRef(function InputBox({ onSubmit, disabled = false }, ref) {
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    clearInput: () => {
      setPrompt("");
      autoResize();
      textareaRef.current?.focus();
    },
    focusInput: () => {
      textareaRef.current?.focus();
    }
  }));

  // 自动调整textarea高度
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'; // 最大高度150px
    }
  };

  useEffect(() => {
    autoResize();
  }, [prompt]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && !disabled) {
      onSubmit(prompt);
      setPrompt("");
    }
  };

  const handleKeyDown = (e) => {
    // Enter 提交（但不是 Shift + Enter）
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Shift + Enter 换行（默认行为，不需要特殊处理）
    // Ctrl/Cmd + Enter 也可以提交（保留备用选项）
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickPrompt = (quickPrompt) => {
    setPrompt(quickPrompt);
    textareaRef.current?.focus();
  };

  const quickPrompts = [
    "生成一个倒计时组件",
    "创建一个待办事项列表",
    "制作一个卡片轮播组件",
    "生成一个天气卡片",
  ];

  return (
    <div className="w-full space-y-6" role="region" aria-labelledby="input-section-title">
      <h2 id="input-section-title" className="sr-only">
        组件生成输入区域
      </h2>
      
      {/* 主输入框 */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`glass-card p-3 sm:p-4 transition-all duration-300 ${
            focused
              ? "ring-4 ring-indigo-500/20 border-indigo-500/30 shadow-xl shadow-indigo-500/10"
              : "hover:shadow-lg"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            {/* 装饰图标 */}
            <div className="flex-shrink-0 p-2.5 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
              <Sparkles size={18} className="sm:w-5 sm:h-5" />
            </div>

            {/* 输入框 */}
            <textarea
              ref={textareaRef}
              className="flex-1 px-3 sm:px-4 py-3 sm:py-4 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base sm:text-lg disabled:cursor-not-allowed resize-none overflow-hidden min-h-[52px]"
              placeholder="描述您想要的 React 组件..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              disabled={disabled}
              aria-label="组件描述输入框"
              aria-describedby="input-helper-text"
              maxLength={500}
              onKeyDown={handleKeyDown}
              rows={1}
            />

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={!prompt.trim() || disabled}
              className="btn-primary flex-shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3"
              aria-label="生成组件"
            >
              <span className="hidden sm:inline">生成</span>
              <SendHorizontal size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* 字符计数和提示 */}
        {prompt && (
          <div className="absolute -bottom-6 right-0 flex items-center gap-4 text-xs text-gray-400">
            <span id="input-helper-text">
              {prompt.length}/500 字符
            </span>
            {prompt.length > 450 && (
              <span className="text-amber-500 font-medium">
                接近字符限制
              </span>
            )}
          </div>
        )}
      </form>

      {/* 快速提示区域 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Command size={14} />
          <span>快速开始</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {quickPrompts.map((quickPrompt, index) => (
            <button
              key={index}
              onClick={() => handleQuickPrompt(quickPrompt)}
              disabled={disabled}
              className="btn-secondary text-sm p-3 text-left transition-all duration-300 hover:scale-105 active-scale disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              aria-label={`快速选择: ${quickPrompt}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-indigo-500" aria-hidden="true">⚡</span>
                <span className="truncate">{quickPrompt}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 帮助文字 */}
      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 backdrop-blur-sm rounded-xl p-4 border border-blue-100/50">
        <div className="flex items-start gap-3">
          <span className="text-blue-500 mt-0.5" role="img" aria-label="提示">
            💡
          </span>
          <div className="text-sm text-gray-600 leading-relaxed">
            <p className="font-medium text-gray-700 mb-1">生成建议：</p>
            <ul className="space-y-1 text-gray-600">
              <li>• 详细描述组件功能和样式需求</li>
              <li>• 可以指定颜色、布局、交互效果</li>
              <li>• 支持响应式设计和现代 UI 风格</li>
              <li>• 示例：&ldquo;创建一个深色主题的音乐播放器卡片&rdquo;</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 键盘快捷键提示 */}
      <div className="hidden sm:block text-center text-xs text-gray-400">
        按 <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">Enter</kbd> 提交 • 
        按 <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">Shift + Enter</kbd> 换行 • 
        按 <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">Esc</kbd> 清空
      </div>
    </div>
  );
});

export default InputBox;
