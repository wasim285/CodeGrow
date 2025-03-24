import React, { useState, useRef, useEffect } from 'react';
import '../styles/AILearningAssistant.css';
import api from '../utils/api';

const AILearningAssistant = ({ 
  lessonId, 
  lessonTitle, 
  currentStep,
  userCode,
  expectedOutput,
  isVisible = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      type: 'assistant', 
      content: `Hi there! I'm your AI learning assistant for this lesson. How can I help you with "${lessonTitle}"?` 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isExpanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      // Get context information to send to the AI
      const contextInfo = {
        lessonId,
        currentStep,
        userCode: userCode || '',
        expectedOutput: expectedOutput || '',
        question: userMessage.content
      };

      // Make API call to get AI response
      const response = await api.post(
        'lesson-assistant/',
        contextInfo,
        { headers: { Authorization: `Token ${token}` } }
      );

      // Add AI response to chat
      setMessages(prev => [
        ...prev, 
        { 
          id: prev.length + 1, 
          type: 'assistant', 
          content: response.data.response || "I'm sorry, I couldn't generate a response. Please try again."
        }
      ]);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev, 
        { 
          id: prev.length + 1, 
          type: 'assistant', 
          content: "I'm having trouble connecting right now. Please try again later."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick suggestions based on current step
  const getQuickSuggestions = () => {
    switch(currentStep) {
      case 1:
        return [
          "Can you explain this concept more simply?",
          "What will I learn in this lesson?",
          "How is this used in real-world applications?"
        ];
      case 2:
        return [
          "What does this code do?",
          "Can you explain this syntax?",
          "How can I improve this code?"
        ];
      case 3:
        return [
          "I'm stuck on the challenge",
          "Give me a hint",
          "What approach should I take?"
        ];
      default:
        return [
          "How does this work?",
          "Can you explain this more?",
          "Give me an example"
        ];
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`ai-assistant ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="ai-assistant-header" onClick={handleExpand}>
        <div className="ai-icon">🤖</div>
        <h3>AI Learning Assistant</h3>
        <div className="expand-icon">{isExpanded ? '▼' : '▲'}</div>
      </div>

      {isExpanded && (
        <div className="ai-assistant-content">
          <div className="messages-container">
            {messages.map(message => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-content">{message.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="message-content typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="quick-suggestions">
            {getQuickSuggestions().map((suggestion, index) => (
              <button 
                key={index}
                className="suggestion-btn"
                onClick={() => {
                  setInputValue(suggestion);
                  if (inputRef.current) inputRef.current.focus();
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="input-container">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about this lesson..."
              rows={1}
            />
            <button 
              className="send-btn" 
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? 
                <div className="mini-spinner"></div> : 
                <span className="send-icon">➤</span>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AILearningAssistant;