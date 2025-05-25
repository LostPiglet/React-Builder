"use client";
import { useState, useEffect, useRef } from 'react';

export default function StreamingText({ 
  text = '', 
  speed = 30,
  className = "",
  isComplete = false
}) {
  const [displayedText, setDisplayedText] = useState('');
  const intervalRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    // 清除之前的定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // 如果没有文本，重置状态
    if (!text) {
      setDisplayedText('');
      indexRef.current = 0;
      return;
    }

    // 如果文本长度减少了（新的请求），重置
    if (text.length < displayedText.length) {
      setDisplayedText('');
      indexRef.current = 0;
    }

    // 开始打字效果
    const startTyping = () => {
      intervalRef.current = setInterval(() => {
        const currentIndex = indexRef.current;
        
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          indexRef.current = currentIndex + 1;
        } else {
          // 已经显示完所有文本
          clearInterval(intervalRef.current);
        }
      }, speed);
    };

    // 如果当前显示的文本少于总文本，继续打字
    if (displayedText.length < text.length) {
      // 如果已经显示了一些文本，从当前位置继续
      if (displayedText.length > 0) {
        indexRef.current = displayedText.length;
      }
      startTyping();
    }

    // 清理函数
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, displayedText]);

  // 如果标记为完成但还没显示完，立即显示全部
  useEffect(() => {
    if (isComplete && displayedText !== text && text) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setDisplayedText(text);
      indexRef.current = text.length;
    }
  }, [isComplete, text, displayedText]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const isTyping = !isComplete && displayedText.length < text.length && text.length > 0;

  return (
    <span className={className}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-0.5 h-4 bg-indigo-600 ml-0.5 animate-pulse" 
              aria-hidden="true" />
      )}
    </span>
  );
} 