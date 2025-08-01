import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }, // Thay bằng token từ login
});

function Chat() {
  type Message = { message_id: string; content: string }; 
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [conversationId, setConversationId] = useState('YOUR_CONVERSATION_ID');

  useEffect(() => {
    socket.emit('join_conversation', conversationId);

    socket.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('new_message');
    };
  }, [conversationId]);

  const sendMessage = () => {
    socket.emit('send_message', {
      conversation_id: conversationId,
      content,
    });
    setContent('');
  };

  return (
    <div>
      <h1>Chat</h1>
      <div>
        {messages.map((msg) => (
          <div key={msg.message_id}>{msg.content}</div>
        ))}
      </div>
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;