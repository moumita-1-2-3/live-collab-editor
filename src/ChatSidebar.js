import React, { useState, useRef, useEffect } from 'react';
import './ChatSidebar.css';
import aiService from './services/aiService';

const ChatSidebar = ({ onDocumentUpdate, currentDocument }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputMessage,
            timestamp: new Date().toLocaleTimeString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            // Use AI service for response
            const aiResponse = await aiService.getChatResponse(inputMessage, currentDocument);
            
            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: aiResponse.message,
                timestamp: new Date().toLocaleTimeString(),
                action: aiResponse.action,
                newContent: aiResponse.newContent
            };

            setMessages(prev => [...prev, aiMessage]);

            // If AI wants to modify the document
            if (aiResponse.action === 'modify' && aiResponse.newContent) {
                onDocumentUpdate(aiResponse.newContent);
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-sidebar">
            <div className="chat-header">
                <h3>AI Assistant</h3>
                <p>Chat or ask me to edit the document</p>
            </div>
            
            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="welcome-message">
                        <p>👋 Hi! I can help you with:</p>
                        <ul>
                            <li>Answer questions</li>
                            <li>Fix grammar in your document</li>
                            <li>Improve writing style</li>
                            <li>Add content</li>
                        </ul>
                        <p>Just ask!</p>
                    </div>
                )}
                
                {messages.map((message) => (
                    <div key={message.id} className={`message ${message.type}`}>
                        <div className="message-content">
                            {message.content}
                            {message.action === 'modify' && (
                                <div className="action-indicator">
                                    ✨ Document updated
                                </div>
                            )}
                        </div>
                        <div className="message-time">{message.timestamp}</div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="message ai loading">
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>
            
            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything or request document changes..."
                    disabled={isLoading}
                    className="chat-input"
                />
                <button 
                    type="submit" 
                    disabled={isLoading || !inputMessage.trim()}
                    className="send-button"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatSidebar;
