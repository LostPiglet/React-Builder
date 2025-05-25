"use client";
import { useState, useEffect } from "react";
import { X, Info, Copy, Check } from "lucide-react";

export default function FloatingTip() {
  const [isCopied, setIsCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // 从localStorage读取显示状态
  useEffect(() => {
    const savedState = localStorage.getItem("tipVisible");
    if (savedState !== null) {
      setIsVisible(savedState === "true");
    }
  }, []);

  // 保存显示状态到localStorage
  const toggleVisibility = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    localStorage.setItem("tipVisible", String(newState));
  };

  // 复制API密钥
  const copyApiKey = async () => {
    const apiKey = "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";
    try {
      await navigator.clipboard.writeText(apiKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  // 隐藏状态 - 只显示图标按钮
  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 w-10 h-16 bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-l-md shadow-md flex items-center justify-center"
        aria-label="显示提示"
      >
        <Info size={18} className="text-white" />
      </button>
    );
  }

  // 显示状态 - 显示完整提示
  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
      <div className="glass-card border-indigo-200/60 p-5 pr-8 rounded-l-lg shadow-lg w-72">
        {/* 关闭按钮 */}
        <button
          onClick={toggleVisibility}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="关闭提示"
        >
          <X size={16} />
        </button>
        
        <div className="space-y-4">
          {/* 标题 */}
          <div className="flex items-center gap-2 text-indigo-600 font-medium">
            <Info size={16} />
            <h3>测试信息</h3>
          </div>
          
          {/* 内容 */}
          <div className="space-y-3 text-sm text-gray-600">
            <p className="leading-relaxed">
              当前测试使用的是 <span className="text-indigo-600 font-medium">OpenRouter</span> 服务，默认模型为 <span className="text-indigo-600 font-medium">qwen-2.5-72b-instruct</span>
            </p>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">测试用 API Key:</span>
                <button
                  onClick={copyApiKey}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                  aria-label="复制API密钥"
                >
                  {isCopied ? (
                    <>
                      <Check size={12} className="text-green-600" />
                      <span className="text-green-600">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>复制</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50/80 rounded p-2 text-xs font-mono break-all border border-gray-200/50">
                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
              </div>
            </div>
            
            <p className="text-xs text-gray-400">
              点击右上角X按钮可以隐藏此提示
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 