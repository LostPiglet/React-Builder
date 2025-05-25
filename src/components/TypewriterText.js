"use client";
import { useState, useEffect } from 'react';

export default function TypewriterText({ 
  text, 
  speed = 50, 
  onComplete = () => {},
  className = "" 
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (text && text.length > 0) {
      setIsTyping(true);
      setCurrentIndex(0);
      setDisplayedText('');
    }
  }, [text]);

  useEffect(() => {
    if (!text || !isTyping) return;

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentIndex >= text.length) {
      setIsTyping(false);
      onComplete();
    }
  }, [currentIndex, text, speed, isTyping, onComplete]);

  // 如果文本变化，立即更新到新文本（处理流式更新）
  useEffect(() => {
    if (text && text.length > displayedText.length && !isTyping) {
      // 如果有新内容添加，继续打字
      setIsTyping(true);
    }
  }, [text, displayedText.length, isTyping]);

  return (
    <span className={className}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-0.5 h-4 bg-indigo-600 ml-1 animate-pulse" />
      )}
    </span>
  );
} 