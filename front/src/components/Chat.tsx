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
  const userId = location.state;


  useEffect(() => {
    // Fetch conversations
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

  useEffect(() => {
    if (!activeConversation) return;

    console.log('[Socket] 🔄 Attempting to connect to socket server...');
    
  const socket = io('http://localhost', {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token: 'your-secret-key' },
    });
    
    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
        console.log('[Socket] ✅ Connected successfully | Socket ID:', socket.id);
        socket.emit('join_conversation', activeConversation.conversation_id);
    });

    socket.on('connect_error', (error) => {
        console.error('[Socket] ❌ Connection failed:', error.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('[Socket] 🔌 Disconnected:', reason);
    });


    socket.on('message_sent', ({ success, message }) => {
        console.log('[Socket] 📤 Message sent status:', success, message);
        if (success) {
            setMessages((prev) => [...prev, message]);
        }
    });

    socket.on('new_message', (message: Message) => {
        console.log('[Socket] 📩 New message received:', message);
        setMessages((prev) => [...prev, message]);
    });

  

    return () => {
        console.log('[Socket] 👋 Cleaning up socket connection...');
        socket.off('connect');
        socket.off('connect_error');
        socket.off('message_sent');
        socket.off('new_message');
        socket.off('error');
        socket.disconnect();
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
        conversation_id: activeConversation.conversation_id, // Should be a valid UUID from database
        sender_id: userId, // Should be a valid UUID from authentication
        content: content.trim(),
    };

    console.log('[Chat] 📤 Attempting to send message:', newMessage);
    socketRef.current.emit('send_message', newMessage);
    setContent('');
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
              onClick={() => setActiveConversation(conv)}
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
                <div key={msg.message_id} className="mb-4">
                  <div className="bg-blue-100 rounded-lg p-3 inline-block">
                    {msg.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(msg.sent_at).toLocaleTimeString()}
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