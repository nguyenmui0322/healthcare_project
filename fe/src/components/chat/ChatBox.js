// src/components/chat/ChatBox.js
import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, List, Avatar, Spin, Typography, Space, Tooltip } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, ReloadOutlined } from '@ant-design/icons';
import { chatService } from '../../api/services/chatService';
import moment from 'moment';
import './AIChat.css';

const { TextArea } = Input;
const { Text } = Typography;

const ChatBox = ({ roomId, isAI = false }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (roomId) {
      fetchMessages();
    }
    // eslint-disable-next-line
  }, [roomId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await chatService.getChatMessages(roomId);
      setMessages(res.data || []);
    } catch (err) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      await chatService.sendMessage(roomId, { content: input });
      setInput('');
      setTimeout(fetchMessages, isAI ? 1000 : 300); // AI may need more time
    } catch (err) {
      // handle error
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="chat-container" bodyStyle={{ padding: 0, height: 500, display: 'flex', flexDirection: 'column' }}>
      <div className="chat-message-list" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {loading ? (
          <Spin tip="Loading messages..." />
        ) : messages.length === 0 ? (
          <div className="empty-chat-placeholder">
            <RobotOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Text type="secondary">No messages yet. Start the conversation!</Text>
          </div>
        ) : (
          <List
            dataSource={messages}
            renderItem={msg => (
              <List.Item style={{ justifyContent: msg.is_ai_message ? 'flex-start' : 'flex-end', border: 'none', padding: '8px 0' }}>
                <Space align="end">
                  {msg.is_ai_message && (
                    <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
                  )}
                  <div className={`message-bubble ${msg.is_ai_message ? 'ai' : 'user'}`}
                    style={{ maxWidth: 350, minWidth: 80, color: msg.is_ai_message ? 'black' : 'white' }}>
                    <div className="message-metadata">
                      <span className="message-sender">{msg.is_ai_message ? 'AI' : 'You'}</span>
                      <span className="message-time">{moment(msg.sent_at).format('HH:mm')}</span>
                    </div>
                    <div>{msg.content}</div>
                  </div>
                  {!msg.is_ai_message && (
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />
                  )}
                </Space>
              </List.Item>
            )}
          />
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-container" style={{ padding: 12, borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
        <TextArea
          className="chat-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          autoSize={{ minRows: 1, maxRows: 3 }}
          disabled={sending}
        />
        <Tooltip title="Send">
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sending}
            disabled={!input.trim() || sending}
            style={{ marginLeft: 8 }}
          />
        </Tooltip>
        <Tooltip title="Refresh">
          <Button icon={<ReloadOutlined />} onClick={fetchMessages} disabled={loading} />
        </Tooltip>
      </div>
    </Card>
  );
};

export default ChatBox;
