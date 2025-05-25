"use client";
import { useEffect } from "react";

export default function KeyboardHandler({ onTabSwitch, onClearInput }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 检查是否在输入框中，如果是则不响应1/2快捷键
      const isInInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true';
      
      // 1/2 切换预览标签 (只在不在输入框中时响应)
      if (!isInInput && (e.key === '1' || e.key === '2')) {
        e.preventDefault();
        const tab = e.key === '1' ? 'preview' : 'code';
        onTabSwitch?.(tab);
      }
      
      // Esc 键清空输入框
      if (e.key === 'Escape') {
        const input = document.querySelector('input[aria-label="组件描述输入框"]');
        if (input && document.activeElement === input) {
          e.preventDefault();
          onClearInput?.();
        }
      }
      
      // Ctrl/Cmd + K 聚焦到输入框
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('input[aria-label="组件描述输入框"]');
        if (input) {
          input.focus();
        }
      }
      
      // Ctrl/Cmd + Enter 提交表单
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const submitButton = document.querySelector('button[aria-label="生成组件"]');
        if (submitButton && !submitButton.disabled) {
          submitButton.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onTabSwitch, onClearInput]);

  return null; // 这是一个纯逻辑组件，不渲染任何UI
} 