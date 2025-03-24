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
      content: `Hi there! I'm your AI learning assistant for this lesson. How can I help you with "${lessonTitle || 'this lesson'}"?` 
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

  // Update the response handling to be more robust
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
        currentStep: Number(currentStep) || 1,
        userCode: userCode || '',
        expectedOutput: expectedOutput || '',
        question: userMessage.content
      };

      // Make API call to get AI response
      const response = await api.post(
        'lesson-assistant/',
        contextInfo,
        { 
          headers: { Authorization: `Token ${token}` },
          timeout: 10000 // 10 second timeout
        }
      );

      // Process the response data safely
      let aiResponseText = "I'm here to help! What specifically would you like to know about this lesson?";
      
      try {
        if (response.data && typeof response.data === 'object') {
          if (response.data.response && typeof response.data.response === 'string') {
            aiResponseText = response.data.response.trim();
            
            // Basic cleaning of problematic text patterns
            if (aiResponseText.includes("<!DOCTYPE") || 
                aiResponseText.includes("dialog_finished_docstring") ||
                aiResponseText.includes("<html>")) {
              throw new Error("Invalid response format");
            }
          }
        }
      } catch (parseError) {
        console.warn("Response parsing error:", parseError);
        // Use fallback response based on the user's question
        aiResponseText = getFallbackResponse(userMessage.content, currentStep);
      }

      // Add AI response to chat
      setMessages(prev => [
        ...prev, 
        { 
          id: prev.length + 1, 
          type: 'assistant', 
          content: aiResponseText
        }
      ]);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      
      // Add helpful error message based on the error type
      let errorMessage = "I'm having trouble connecting right now. Please try again later.";
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = "It's taking me longer than expected to think of a response. Let me offer a simpler answer: " + 
                       getFallbackResponse(userMessage.content, currentStep);
      }
      
      setMessages(prev => [
        ...prev, 
        { 
          id: prev.length + 1, 
          type: 'assistant', 
          content: errorMessage
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this helper function to generate fallback responses
  const getFallbackResponse = (question, step) => {
    const questionLower = question.toLowerCase();
    
    // Check for common patterns
    if (questionLower.includes("explain") || questionLower.includes("what is")) {
      return "This concept is a fundamental part of programming that helps you solve problems by breaking them down into manageable steps. If you'd like more specific help, try asking about a particular part you're struggling with.";
    }
    
    if (questionLower.includes("error") || questionLower.includes("not working")) {
      return "When debugging code, check for these common issues: syntax errors (like missing colons or parentheses), variable naming inconsistencies, and logic errors in your conditions. Reading the error message carefully often gives you clues about what's wrong.";
    }
    
    if (questionLower.includes("hint") || questionLower.includes("stuck")) {
      return "Try breaking down the problem into smaller steps. First, understand what inputs you're working with. Then, think about what transformations you need to apply. Finally, format your output according to what's expected.";
    }
    
    // Step-specific fallbacks
    const stepNum = Number(step) || 1;
    switch(stepNum) {
      case 1:
        return "The introduction is meant to give you a foundation for the concepts in this lesson. Take your time to understand each part, and don't worry if it doesn't all click immediately. Learning programming is a step-by-step process.";
      case 2:
        return "In the guided example, try to understand each line of code. What is its purpose? How does it contribute to the overall solution? Experimenting by changing small parts of the code can help you see how it works.";
      case 3:
        return "For challenges, start by making sure you understand what the problem is asking. Then sketch a plan before coding. Break down your solution into steps, and implement one step at a time.";
      default:
        return "I'm here to help with this lesson. Could you tell me more specifically what you're struggling with?";
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
    const step = Number(currentStep) || 1;
    
    switch(step) {
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