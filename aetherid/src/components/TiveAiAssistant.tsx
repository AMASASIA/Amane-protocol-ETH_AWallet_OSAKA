import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  CornerDownLeft,
  Bot,
  User,
  Zap,
  CheckCircle2,
  RefreshCw,
  Layers,
  Grid3X3,
  Share2,
  FilePlus,
  Shield,
  FileSpreadsheet,
  Globe,
  Sliders,
  Terminal,
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';

export interface TiveActionRequest {
  action: string;
  target?: string;
  message: string;
}

interface TiveAiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onExecuteAction: (action: string, target?: string) => void;
  currentContext: {
    viewMode: string;
    totalCertificates: number;
    selectedCount: number;
    activeSharesCount: number;
  };
}

interface Message {
  id: string;
  sender: 'user' | 'tive';
  text: string;
  actionExecuted?: string;
  timestamp: string;
}

export const TiveAiAssistant: React.FC<TiveAiAssistantProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  onExecuteAction,
  currentContext,
}) => {
  const t = translations[language];
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'tive',
      text:
        language === 'ja'
          ? 'こんにちは！TiveAI コントローラーです。画面切り替え、DID/SBT/TBAのフィルタ・詳細確認、選択的開示共有の作成、統合APIのテストなど、Webアプリ内の操作を自然言語で瞬時に実行できます。何を行いますか？'
          : 'Hello! I am your TiveAI Sovereign In-App Controller. I can switch layouts, filter DIDs/SBTs/TBAs, inspect credentials, launch selective share presentations, or run unified API tests. How can I help you operate the wallet?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (userPrompt?: string) => {
    const promptToSend = userPrompt || input.trim();
    if (!promptToSend || isLoading) return;

    setInput('');
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/tive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          language,
          currentContext,
        }),
      });

      if (!res.ok) throw new Error('API request failed');

      const data = await res.json();
      const actionName = data.action && data.action !== 'none' ? `${data.action}${data.target ? ` -> ${data.target}` : ''}` : undefined;

      const aiMsg: Message = {
        id: `tive-${Date.now()}`,
        sender: 'tive',
        text: data.message || 'Operation executed successfully.',
        actionExecuted: actionName,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Execute app action if detected
      if (data.action && data.action !== 'none') {
        if (data.action === 'set_language') {
          if (data.target === 'ja' || data.target === 'en') {
            onLanguageChange(data.target);
          }
        } else {
          onExecuteAction(data.action, data.target);
        }
      }
    } catch (err) {
      console.warn('TiveAI local fallback triggered:', err);
      // Fallback local execution
      const lower = promptToSend.toLowerCase();
      let fallbackText = '';
      let actionToRun = 'none';
      let targetToRun = '';

      if (lower.includes('grid') || lower.includes('グリッド')) {
        actionToRun = 'switch_view';
        targetToRun = 'grid';
        fallbackText = language === 'ja' ? 'グリッド表示に切り替えました。' : 'Switched to Grid Matrix view.';
      } else if (lower.includes('cascade') || lower.includes('3d') || lower.includes('カスケード')) {
        actionToRun = 'switch_view';
        targetToRun = 'cascade';
        fallbackText = language === 'ja' ? '3Dカスケード表示に切り替えました。' : 'Switched to 3D Cascade view.';
      } else if (lower.includes('share') || lower.includes('共有')) {
        actionToRun = 'open_modal';
        targetToRun = 'share';
        fallbackText = language === 'ja' ? '選択的開示共有を開きました。' : 'Opened Selective Share wizard.';
      } else if (lower.includes('sbt')) {
        actionToRun = 'filter_credentials';
        targetToRun = 'SBT';
        fallbackText = language === 'ja' ? 'SBTのみを抽出しました。' : 'Filtered to show Soulbound Tokens (SBT).';
      } else if (lower.includes('api') || lower.includes('skill')) {
        actionToRun = 'open_modal';
        targetToRun = 'api_skill';
        fallbackText = language === 'ja' ? '統合API & Skill仕様を開きました。' : 'Opened Unified API & Skill specification.';
      } else {
        fallbackText = language === 'ja' ? 'コマンドを受信しました。クイックアクションから直接操作も可能です。' : 'Command processed. You can also click the quick action chips below.';
      }

      if (actionToRun !== 'none') {
        onExecuteAction(actionToRun, targetToRun);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `fallback-${Date.now()}`,
          sender: 'tive',
          text: fallbackText,
          actionExecuted: actionToRun !== 'none' ? `${actionToRun} -> ${targetToRun}` : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: t.actionSwitchGrid, icon: Grid3X3, command: language === 'ja' ? 'グリッド表示にして' : 'Switch to Grid View' },
    { label: t.actionSwitchCascade, icon: Layers, command: language === 'ja' ? '3Dカスケード表示にして' : 'Switch to 3D Cascade Deck' },
    { label: t.actionFilterSbt, icon: Shield, command: language === 'ja' ? 'SBT（ソウルバウンド）のみ表示' : 'Filter by Soulbound Tokens' },
    { label: t.actionInspectCore, icon: Bot, command: language === 'ja' ? 'AIエージェントのDID詳細を見せて' : 'Inspect Autonomous Agent Core DID' },
    { label: t.actionOpenShare, icon: Share2, command: language === 'ja' ? '選択的開示共有を作成' : 'Open Selective Share presentation' },
    { label: t.actionOpenMint, icon: FilePlus, command: language === 'ja' ? '新規証明書を発行' : 'Mint new credential' },
    { label: t.actionTestApi, icon: Terminal, command: language === 'ja' ? 'AmaneとAWalletの統合APIを開いて' : 'Open Unified Amane & AWallet API Spec' },
    {
      label: language === 'ja' ? 'Englishに切り替え' : '日本語に切り替え',
      icon: Globe,
      command: language === 'ja' ? 'Switch language to English' : '言語を日本語にして',
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-zinc-900 to-black border border-zinc-700/80 shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle monochrome silver gradient line on top */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-white/80 to-transparent" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {t.tiveTitle}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/10 text-zinc-200 border border-white/20">
                  {t.tiveAiBadge}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                {t.tiveSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onLanguageChange(language === 'en' ? 'ja' : 'en')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'JA' : 'EN'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Action Chips Horizontal Carousel */}
        <div className="px-4 py-2.5 bg-zinc-950/40 border-b border-zinc-800/80 overflow-x-auto flex items-center gap-2 scrollbar-none">
          <span className="text-[11px] font-medium text-zinc-400 shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3 text-zinc-300" />
            {t.tiveQuickActionsTitle}:
          </span>
          {quickPrompts.map((q, idx) => {
            const Icon = q.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(q.command)}
                disabled={isLoading}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 hover:border-zinc-500 transition-all active:scale-95 disabled:opacity-50"
              >
                <Icon className="w-3 h-3 text-zinc-400" />
                <span>{q.label}</span>
              </button>
            );
          })}
        </div>

        {/* Chat / Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-[260px] max-h-[420px]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-semibold ${
                  m.sender === 'user'
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-white" />}
              </div>

              <div
                className={`max-w-[82%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-white text-zinc-950 font-medium rounded-tr-none shadow-md'
                    : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none shadow-inner'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>

                {m.actionExecuted && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center gap-1.5 text-[11px] font-mono text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{m.actionExecuted}</span>
                  </div>
                )}

                <div
                  className={`text-[10px] mt-1 text-right ${
                    m.sender === 'user' ? 'text-zinc-600' : 'text-zinc-500'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl shrink-0 bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center justify-center">
                <Bot className="w-4 h-4 animate-spin text-white" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-zinc-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-300" />
                <span>{t.tiveThinking}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-700/80 rounded-2xl p-1.5 focus-within:border-white transition-all shadow-inner"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.tiveInputPlaceholder}
              disabled={isLoading}
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all disabled:opacity-40 disabled:hover:bg-white active:scale-95 shadow"
            >
              <span>{t.tiveExecute}</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2 px-1">
            <span>Powered by Gemini & Sovereign AI State Engine</span>
            <span>Shortcut: ⌘K or Ctrl+K</span>
          </div>
        </div>
      </div>
    </div>
  );
};
