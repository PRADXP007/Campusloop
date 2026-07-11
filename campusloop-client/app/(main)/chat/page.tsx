'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import type { Conversation, Message } from '@/types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { getSocket } from '@/lib/socket';

function ConversationItemSkeleton() {
  return (
    <div className="p-4 flex gap-3 animate-pulse border-b border-slate-100">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2 py-0.5">
        <div className="flex justify-between items-center">
          <div className="h-3 bg-slate-200/80 rounded w-24" />
          <div className="h-2.5 bg-slate-200/80 rounded w-8" />
        </div>
        <div className="h-3 bg-slate-200/60 rounded w-36" />
        <div className="h-2 bg-slate-150 rounded w-20" />
      </div>
    </div>
  );
}

function MessageBubbleSkeleton({ isOwn }: { isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-pulse w-full`}>
      <div className="max-w-[70%] space-y-1.5 w-full">
        <div
          className={`h-10 w-48 rounded-2xl ${
            isOwn
              ? 'bg-blue-100/50 rounded-tr-none ml-auto'
              : 'bg-slate-200/50 rounded-tl-none'
          }`}
        />
        <div className={`h-2 bg-slate-200/40 rounded w-10 ${isOwn ? 'ml-auto' : ''}`} />
      </div>
    </div>
  );
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversationId');
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingConversationsRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  const fetchConversations = useCallback(async (showLoading = false) => {
    if (showLoading) setConversationsLoading(true);
    try {
      const { data } = await api.get('/chat/conversations');
      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch {
      if (showLoading) toast.error('Could not load inbox');
    } finally {
      if (showLoading) setConversationsLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (id: string, showLoading = false) => {
    if (showLoading) setMessagesLoading(true);
    try {
      const { data } = await api.get(`/chat/conversations/${id}/messages`);
      if (data.success) {
        setMessages(data.messages || []);
        fetchConversations(false);
      }
    } catch {
      if (showLoading) toast.error('Could not load messages');
    } finally {
      if (showLoading) setMessagesLoading(false);
    }
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations(true);
    pollingConversationsRef.current = setInterval(() => {
      fetchConversations(false);
    }, 8000);

    return () => {
      if (pollingConversationsRef.current) clearInterval(pollingConversationsRef.current);
    };
  }, [fetchConversations]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId, true);
    } else {
      setMessages([]);
    }
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (conversationId) {
      socket.emit('join_conversation', { conversationId });

      socket.on('receive_message', (newMessage: Message) => {
        if (newMessage.conversation === conversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMessage._id || (m._id.startsWith('temp-') && m.content === newMessage.content))) {
              return prev.map((m) => (m._id.startsWith('temp-') && m.content === newMessage.content ? newMessage : m));
            }
            return [...prev, newMessage];
          });
          fetchConversations(false);
        }
      });

      socket.on('user_typing', ({ userId, isTyping: remoteIsTyping }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [userId]: remoteIsTyping,
        }));
      });

      return () => {
        socket.emit('leave_conversation', { conversationId });
        socket.off('receive_message');
        socket.off('user_typing');
        setTypingUsers({});
      };
    }
  }, [conversationId, fetchConversations]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    scrollToBottom(messagesLoading ? 'auto' : 'smooth');
  }, [messages, messagesLoading]);

  const getRecipient = (conv: Conversation) => {
    return conv.participants.find((p) => p._id !== user?._id);
  };

  const handleSelectConversation = (id: string) => {
    router.push(`/chat?conversationId=${id}`);
  };

  const handleClearActiveConversation = () => {
    router.push('/chat');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    const socket = getSocket();
    if (!socket || !conversationId) return;

    socket.emit('typing', { conversationId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { conversationId });
    }, 2000);
  };

  const handleInputBlur = () => {
    const socket = getSocket();
    if (socket && conversationId) {
      socket.emit('stop_typing', { conversationId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !conversationId) return;

    const content = messageText.trim();
    setMessageText('');

    const tempId = 'temp-' + Date.now();
    const optimisticMessage: Message = {
      _id: tempId,
      conversation: conversationId,
      sender: user?._id || '',
      content,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    const socket = getSocket();
    if (socket) {
      socket.emit('stop_typing', { conversationId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit('send_message', { conversationId, content });
    } else {
      setIsSending(true);
      try {
        const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, { content });
        if (data.success && data.message) {
          setMessages((prev) => prev.map((m) => (m._id === tempId ? data.message : m)));
          fetchConversations(false);
        }
      } catch {
        toast.error('Failed to send message');
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleBlockRecipient = async () => {
    if (!activeRecipient) return;
    if (!confirm(`Block ${activeRecipient.name}? You will no longer see their posts, marketplace listings, or messages.`)) return;
    try {
      await api.post(`/users/${activeRecipient._id}/block`);
      toast.success(`${activeRecipient.name} blocked successfully.`);
      router.push('/chat');
      fetchConversations(true);
    } catch {
      toast.error('Could not block user.');
    }
  };

  const handleReportRecipient = async () => {
    if (!activeRecipient) return;
    const reason = prompt(`Why are you reporting ${activeRecipient.name}? (e.g. scammer, inappropriate content, harassment)`);
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Report reason is required.');
      return;
    }

    try {
      await api.post(`/users/${activeRecipient._id}/report`, { reason: reason.trim() });
      toast.success('Report submitted. We will review this account.');
    } catch {
      toast.error('Could not submit report.');
    }
  };

  const formatTime = (dStr: string) => {
    try {
      const date = new Date(dStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDateLabel = (dStr: string) => {
    try {
      const d = new Date(dStr);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) return 'Today';
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const activeConv = conversations.find((c) => c._id === conversationId);
  const activeRecipient = activeConv ? getRecipient(activeConv) : null;

  const filteredConversations = conversations.filter((c) => {
    const r = getRecipient(c);
    return r?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="py-4">
      <div className="flex h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] min-h-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* LEFT PANEL - Conversations List */}
      <div
        className={`w-full md:w-80 flex-shrink-0 flex flex-col min-h-0 border-r border-slate-100 bg-white transition-all duration-300 ${
          conversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-slate-100">
          <h1 className="text-lg font-bold text-slate-900 mb-3">Messages</h1>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
            />
          </div>
        </div>

        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              }
            }
          }}
          initial="hidden"
          animate="show"
          className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-thin"
        >
          {conversationsLoading ? (
            <div className="flex flex-col">
              <ConversationItemSkeleton />
              <ConversationItemSkeleton />
              <ConversationItemSkeleton />
              <ConversationItemSkeleton />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-xs text-slate-400 font-medium">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = getRecipient(conv);
              if (!other) return null;
              const isSelected = conv._id === conversationId;
              const lastMsg = conv.lastMessage;
              const isUnread =
                lastMsg && lastMsg.sender !== user?._id && !lastMsg.read;

              return (
                <motion.button
                  key={conv._id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } }
                  }}
                  onClick={() => handleSelectConversation(conv._id)}
                  className={`w-full text-left p-4 flex gap-3 hover:bg-slate-50/60 transition-colors relative cursor-pointer border-l-4 ${
                    isSelected ? 'bg-blue-50/30 border-l-blue-600 pl-3' : 'border-l-transparent pl-3'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200/50 flex items-center justify-center font-semibold text-slate-700 overflow-hidden flex-shrink-0 relative">
                    {other.avatar ? (
                      <Image src={other.avatar} alt={other.name} width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      other.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-1.5 mb-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {other.name}
                        </span>
                        {other.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                      {lastMsg && (
                        <span className="text-[9.5px] text-slate-400 flex-shrink-0 font-medium">
                          {formatDateLabel(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${isUnread ? 'text-blue-600 font-semibold' : 'text-slate-500 font-medium'}`}>
                      {lastMsg ? lastMsg.content : 'No messages yet'}
                    </p>
                    <p className="text-[9.5px] text-slate-455 truncate mt-0.5 font-medium uppercase tracking-wide">
                      {other.college?.name || 'Campus'}
                    </p>
                  </div>
                  {isUnread && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-blue-600 text-white text-[8px] font-bold w-4.5 h-4.5 rounded-full shadow-sm shadow-blue-500/20 animate-pulse">
                      1
                    </div>
                  )}
                </motion.button>
              );
            })
          )}
        </motion.div>
      </div>

      {/* RIGHT PANEL - Active Conversation Chat room with slide transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={conversationId || 'empty'}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className={`flex-1 flex flex-col min-h-0 bg-slate-50/20 ${
            !conversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConv && activeRecipient ? (
            <>
              {/* Chat Room Header */}
              <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-3">
                <button
                  onClick={handleClearActiveConversation}
                  className="md:hidden p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors active-press"
                  title="Back to Inbox"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200/50 flex items-center justify-center font-semibold text-slate-700 overflow-hidden flex-shrink-0">
                  {activeRecipient.avatar ? (
                    <Image src={activeRecipient.avatar} alt={activeRecipient.name} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    activeRecipient.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-semibold text-sm text-slate-900 truncate">{activeRecipient.name}</h2>
                    {activeRecipient.isVerified && <VerifiedBadge size="sm" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                    {activeRecipient.college?.name && `${activeRecipient.college.name}`}
                    {activeRecipient.department && ` · ${activeRecipient.department}`}
                    {activeRecipient.year && ` · Year ${activeRecipient.year}`}
                  </p>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleBlockRecipient}
                    className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all cursor-pointer"
                  >
                    Block
                  </button>
                  <button
                    onClick={handleReportRecipient}
                    className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-all cursor-pointer"
                  >
                    Report
                  </button>
                </div>
              </div>

              {/* Suspicious warning banner */}
              {activeRecipient.isSuspicious && (
                <div className="bg-amber-50 border-b border-amber-100 text-amber-800 px-4 py-2.5 text-xs font-medium flex items-center gap-2 animate-pulse relative z-10">
                  <span className="text-sm">⚠️</span>
                  <span>Caution: This account has been flagged for suspicious activity. Do not share personal bank details or advance payments.</span>
                </div>
              )}

              {/* Chat Room Messages List with Stagger sequential reveal */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.04,
                    }
                  }
                }}
                initial="hidden"
                animate="show"
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/10 scrollbar-thin"
              >
                {messagesLoading ? (
                  <div className="flex flex-col gap-4">
                    <MessageBubbleSkeleton isOwn={false} />
                    <MessageBubbleSkeleton isOwn={true} />
                    <MessageBubbleSkeleton isOwn={false} />
                    <MessageBubbleSkeleton isOwn={true} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                      <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-slate-900">Start the conversation!</p>
                    <p className="text-[10px] text-slate-400 mt-1.5 max-w-[240px] font-medium leading-relaxed">
                      Say hello to start discussing the listing details with the seller.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isOwn = msg.sender === user?._id;
                    const prevMsg = index > 0 ? messages[index - 1] : null;

                    const showDateBadge =
                      !prevMsg ||
                      new Date(msg.createdAt).toDateString() !==
                        new Date(prevMsg.createdAt).toDateString();

                    return (
                      <motion.div 
                        key={msg._id} 
                        variants={{
                          hidden: { opacity: 0, y: 15, scale: 0.96 },
                          show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 22 } }
                        }}
                        className="space-y-2"
                      >
                        {showDateBadge && (
                          <div className="flex justify-center py-2 animate-in fade-in duration-200">
                            <span className="bg-white border border-slate-100 text-[10px] text-slate-500 font-semibold px-3 py-1 rounded-full shadow-sm">
                              {formatDateLabel(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[75%] space-y-1">
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed break-words border ${
                                isOwn
                                  ? 'bg-blue-600 border-blue-600 text-white rounded-tr-none shadow-sm'
                                  : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'
                              }`}
                            >
                              {msg.content}
                            </div>
                            <div className={`flex items-center gap-1.5 text-[9.5px] font-medium text-slate-400 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <span>{formatTime(msg.createdAt)}</span>
                              {isOwn && (
                                <span>
                                  {msg.read ? (
                                    <span className="text-blue-650 font-bold" title="Read">✓✓</span>
                                  ) : (
                                    <span className="text-slate-400" title="Sent">✓</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                {activeRecipient && typingUsers[activeRecipient._id] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex justify-start text-[11px] text-slate-400 font-semibold px-4 py-1.5 bg-white/40 border border-slate-100 rounded-xl max-w-max gap-1 items-center"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="ml-1">{activeRecipient.name} is typing...</span>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </motion.div>

              {/* Chat Room Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white">
                <div className="flex gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 focus-within:bg-white transition-all">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    disabled={isSending}
                    className="flex-1 bg-transparent px-3 text-xs text-slate-900 focus:outline-none placeholder-slate-400 disabled:opacity-50 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || isSending}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer flex-shrink-0 active-press"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4.5 h-4.5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/10">
              <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Campus Messages</h2>
              <p className="text-xs text-slate-400 mt-2 max-w-[280px] leading-relaxed font-medium">
                Select a conversation from the active chats list, or chat with a seller directly from their product details page.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center text-[var(--color-text-muted)]">
        <div className="w-7 h-7 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Loading inbox stream...</span>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
