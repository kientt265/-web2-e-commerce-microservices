import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { chatService } from '../../services/api.ts';
import type { Conversation, Message } from '../../types/index.ts';

function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [userId, setUserId] = useState('user1');
  const socketRef = React.useRef<any>(null);

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

    const socket = io('http://localhost/socket.io', {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token: 'your-secret-key' },
    });
    socketRef.current = socket;
    socket.emit('join_conversation', activeConversation.conversation_id);

    // Thêm listener cho message_sent
    socket.on('message_sent', ({ success, message }) => {
      if (success) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('message_sent');
      socket.off('new_message');
      socket.disconnect();
    };
  }, [activeConversation]);

  // Cập nhật hàm sendMessage
  const sendMessage = () => {
    if (!socketRef.current || !activeConversation || !content.trim() || !userId) return;

    const newMessage = {
      conversation_id: activeConversation.conversation_id,
      sender_id: userId,
      content,
    };

    socketRef.current.emit('send_message', newMessage);

    // Thêm tin nhắn tạm thời vào UI
    const tempMessage: Message = {
      message_id: 'temp-' + Date.now(),
      ...newMessage,
      sent_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages((prev) => [...prev, tempMessage]);
    setContent('');
    console.log('Send message susscessfully');
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