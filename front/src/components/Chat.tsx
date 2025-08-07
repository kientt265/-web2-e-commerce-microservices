import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { chatService } from '../../services/api.ts';
import type { Conversation, Message } from '../../types/index.ts';
import { useLocation } from 'react-router-dom';


function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const socketRef = React.useRef<any>(null);
  const location = useLocation();
  const userId1 = location.state;
  const userId = userId1.user_id;


  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await chatService.getAllConversations();
        setConversations(data);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };
    fetchConversations();
  }, []);

  // Kết hợp messages từ API và real-time
  

  // Load tin nhắn cũ khi chọn conversation
  const handleGetMessages = async (conversationId: string) => {
    try {
      console.log('[Chat] 📥 Fetching message history...');
      const historicalMessages = await chatService.getMessages(conversationId);
      setMessages(historicalMessages);
      console.log(`[Chat] ✅ Loaded ${historicalMessages.length} historical messages`);
    } catch (error) {
      console.error('[Chat] ❌ Failed to fetch messages:', error);
    }
  };

  // Socket effect để handle real-time messages
  useEffect(() => {
    if (!activeConversation) return;

    const socket = io('http://localhost:3002', {
      path: '/socket.io',
      transports: ['websocket'],
      auth: {token: 'your-secret-key'},
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] ✅ Connected successfully');
      socket.emit('join_conversation', activeConversation.conversation_id);
    });

    // Listen for new messages
    socket.on('new_message', (message: Message) => {
      console.log('[Socket] 📩 Real-time message received:', message);
      setMessages(prev => {
        // Kiểm tra xem tin nhắn đã tồn tại chưa
        const messageExists = prev.some(msg => msg.message_id === message.message_id);
        if (messageExists) {
          console.log('[Chat] ⚠️ Duplicate message detected:', message.message_id);
          return prev;
        }
        return [...prev, message];
      });
    });

    // Cleanup
    return () => {
      socket.disconnect();
      setMessages([]); // Clear messages when changing conversation
    };
  }, [activeConversation]);

  const sendMessage = () => {
    if (!socketRef.current || !activeConversation || !content.trim() || !userId) {
        console.warn('[Chat] ⚠️ Cannot send message: Missing required data', {
            socketConnected: !!socketRef.current,
            hasActiveConversation: !!activeConversation,
            hasContent: !!content.trim(),
            hasUserId: !!userId
        });
        return;
    }

    const newMessage = {
        conversation_id: activeConversation.conversation_id, 
        sender_id: userId, 
        content: content.trim(),
    };

    console.log('[Chat] 📤 Attempting to send message:', newMessage);
    socketRef.current.emit('send_message', newMessage);
    setContent('');
  };

  // Click handler cho conversation
  const handleConversationClick = async (conv: Conversation) => {
    setActiveConversation(conv);
    await handleGetMessages(conv.conversation_id); // Load historical messages
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-100 border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Conversations</h2>
        </div>
        <div className="divide-y">
          {conversations.map((conv) => (
            <div
              key={conv.conversation_id}
              className={`p-4 cursor-pointer hover:bg-gray-200 ${
                activeConversation?.conversation_id === conv.conversation_id
                  ? 'bg-gray-200'
                  : ''
              }`}
              onClick={() => {
                setActiveConversation(conv);
                handleGetMessages(conv.conversation_id);
              }}
            >
              <h3 className="font-semibold">{conv.name}</h3>
              <p className="text-sm text-gray-500 truncate">
                {conv.last_message?.content || 'No messages yet'}
              </p>
              <p className="text-xs text-gray-400">
                {conv.last_message
                  ? new Date(conv.last_message.sent_at).toLocaleDateString()
                  : ''}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">{activeConversation.name}</h2>
              <p className="text-sm text-gray-500">
                {activeConversation.member_count} members
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg) => (
                <div 
                  key={`${msg.message_id}-${msg.sent_at}`}
                  className={`mb-4 flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`rounded-lg p-3 max-w-[70%] ${
                    msg.sender_id === userId ? 'bg-blue-500 text-white' : 'bg-gray-100'
                  }`}>
                    <div className="text-sm">{msg.content}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(msg.sent_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded-lg px-4 py-2"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a message"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  onClick={sendMessage}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;