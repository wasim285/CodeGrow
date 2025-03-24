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
      content: `Hi there! I'm your AI learning assistant for "${lessonTitle || 'this lesson'}". Ask me anything about the concepts or code in this lesson!` 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [previousQuestions, setPreviousQuestions] = useState(new Set());
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

  /**
   * Generate a lesson-specific response based on the question and context
   */
  const generateLessonSpecificResponse = (question, lessonTitle, step, userCode, expectedOutput) => {
    const questionLower = question.toLowerCase();
    
    // Don't repeat greetings
    if (previousQuestions.has(questionLower)) {
      if (questionLower.includes("hello") || questionLower.includes("hi ")) {
        return `I'm still here to help with "${lessonTitle}". What specific aspect would you like me to explain?`;
      }
    }
    
    // For "What does this code do" questions
    if (questionLower.includes("what does this code do") || 
        questionLower.includes("explain this code") || 
        questionLower.includes("how does this code work")) {
      
      // If we have user code to analyze
      if (userCode && userCode.trim()) {
        const codeSnippet = userCode.length > 100 ? userCode.substring(0, 100) + "..." : userCode;
        
        // Analyze common Python patterns
        if (userCode.includes("print(")) {
          return `Your code uses the print() function to display output to the console. In Python, print() is a built-in function that displays the specified message. For example, \`print("Hello")\` will show "Hello" when you run the program.`;
        }
        
        if (userCode.includes("if ") && userCode.includes("else:")) {
          return `Your code contains conditional logic with if/else statements. This allows your program to make decisions based on certain conditions. The code inside the if block runs when the condition is True, and the code in the else block runs when it's False.`;
        }
        
        if (userCode.includes("for ") && userCode.includes(" in ")) {
          return `Your code uses a for loop, which is how Python iterates over sequences like lists, strings, or ranges. For each item in the sequence, the loop executes the indented code block.`;
        }
        
        if (userCode.includes("def ")) {
          return `Your code defines a function using the 'def' keyword. Functions are reusable blocks of code that perform specific tasks and can accept inputs (parameters) and return outputs. They're essential for organizing and modularizing your code.`;
        }
        
        // Default code explanation
        return `Your code appears to be a Python program that performs certain operations. It takes inputs, processes them using variables and control structures, and produces output. If you have a specific part you'd like me to explain in more detail, please let me know!`;
      } else {
        // No code to analyze
        return `I don't see any code to analyze yet. Try writing some code in the editor, and then I can explain what it does. In Python, you can start with simple statements like \`print("Hello, World!")\` to display text.`;
      }
    }
    
    // For "I'm stuck" or "Help" questions
    if (questionLower.includes("stuck") || 
        questionLower.includes("help") || 
        questionLower.includes("hint") || 
        questionLower.includes("not working")) {
      
      // Different responses based on current step
      if (step == 3) {  // Challenge step
        if (expectedOutput) {
          return `For this challenge, you need to create code that produces: "${expectedOutput}"\n\nHere's a hint: ${getHintForOutput(expectedOutput, lessonTitle)}`;
        } else {
          return `For this mini-challenge, break down the problem into smaller steps:\n\n1. Understand what the challenge is asking for\n2. Identify what inputs you need to work with\n3. Plan your algorithm before writing code\n4. Test your solution with different inputs\n\nWhat specific part are you struggling with?`;
        }
      } else if (step == 2) {  // Guided example
        return `In this guided example, try to understand each line of code and its purpose. Experiment by modifying small parts to see how they affect the output. What specific aspect of the example is confusing you?`;
      } else {  // Introduction
        return `The introduction provides key concepts for this lesson. Try relating these concepts to real-world examples to better understand them. Is there a particular concept that's difficult to grasp?`;
      }
    }
    
    // For "What approach" questions
    if (questionLower.includes("approach") || 
        questionLower.includes("how to solve") || 
        questionLower.includes("how do i")) {
      
      // For challenge step
      if (step == 3) {
        return `Here's a systematic approach for this challenge:\n\n1. Understand the problem: What inputs do you have? What output is expected?\n2. Break it into steps: What calculations or transformations do you need?\n3. Write pseudocode: Outline your solution in plain English\n4. Implement your solution: Convert your plan to Python code\n5. Test and debug: Check your solution with different inputs\n\nStart with a simple version that works, then refine it.`;
      } else {
        return `To understand the material in this step:\n\n1. Read through the explanation carefully\n2. Try to connect new concepts with things you already know\n3. Write down key points in your own words\n4. Experiment with the examples by slightly modifying them\n5. Ask specific questions about parts you don't understand`;
      }
    }
    
    // For questions about concepts
    if (questionLower.includes("explain") || 
        questionLower.includes("what is") || 
        questionLower.includes("how does") ||
        questionLower.includes("mean")) {
      
      // Try to match common Python concepts
      if (questionLower.includes("variable") || questionLower.includes("variables")) {
        return `Variables in Python are containers for storing data values. Unlike some other languages, Python variables don't need explicit declaration or types. Example: \`name = "Alice"\` creates a variable called 'name' that stores the string "Alice". You can then use this variable elsewhere in your code.`;
      }
      
      if (questionLower.includes("function") || questionLower.includes("functions")) {
        return `Functions in Python are reusable blocks of code that perform specific tasks. They're defined with the \`def\` keyword, can accept inputs (parameters), and can return outputs. Example:\n\n\`\`\`python\ndef greet(name):\n    return f"Hello, {name}!"\n\nresult = greet("Alice")  # result will be "Hello, Alice!"\n\`\`\`\n\nFunctions help organize your code and follow the DRY (Don't Repeat Yourself) principle.`;
      }
      
      if (questionLower.includes("loop") || questionLower.includes("for ") || questionLower.includes("while")) {
        return `Loops in Python allow you to execute a block of code multiple times. The two main types are:\n\n1. For loops: Iterate over a sequence (like a list or string)\n   Example: \`for item in my_list:\`\n\n2. While loops: Execute as long as a condition is true\n   Example: \`while count < 5:\`\n\nLoops are essential for processing collections of data or repeating tasks efficiently.`;
      }
      
      if (questionLower.includes("list") || questionLower.includes("array")) {
        return `Lists in Python are ordered, changeable collections that can store multiple items, even of different types. They use square brackets []. Example:\n\n\`\`\`python\nfruits = ["apple", "banana", "cherry"]\nprint(fruits[0])  # Prints "apple"\nfruits.append("orange")  # Adds "orange" to the list\n\`\`\`\n\nLists are one of Python's most versatile data structures.`;
      }
      
      // Generic explanation if no specific concept is matched
      return `In programming, it's important to break down complex problems into smaller, manageable parts. For "${lessonTitle}", focus on understanding the fundamental concepts presented, practice with examples, and don't hesitate to experiment. What specific concept would you like me to explain in more detail?`;
    }
    
    // For specific Python syntax questions
    if (questionLower.includes("how do i write") || 
        questionLower.includes("how to write") || 
        questionLower.includes("syntax for")) {
      
      // Check for common Python operations
      if (questionLower.includes("print")) {
        let content = "Hello, World!";
        
        // Extract what they want to print if mentioned
        if (questionLower.includes("print hello")) {
          content = "Hello";
        }
        if (questionLower.includes("print hello python")) {
          content = "Hello Python";
        }
        
        return `In Python, you can print text to the console using the print() function. Here's how to write it:\n\n\`\`\`python\nprint("${content}")\n\`\`\`\n\nMake sure to put your text inside quotes. When you run this code, it will display: ${content}`;
      }
      
      if (questionLower.includes("variable") || questionLower.includes("assign")) {
        return `To create a variable in Python, you simply write the variable name, an equal sign, and the value. For example:\n\n\`\`\`python\nname = "John"\nage = 25\n\`\`\`\n\nPython variables don't need to be declared with a type - the type is inferred from the value.`;
      }
      
      if (questionLower.includes("function") || questionLower.includes("def")) {
        return `To define a function in Python, use the 'def' keyword, followed by the function name and parentheses. For example:\n\n\`\`\`python\ndef greet(name):\n    print(f"Hello, {name}!")\n\n# Call the function\ngreet("Alice")  # Displays: Hello, Alice!\n\`\`\`\n\nThe indented code block after the colon is the function body.`;
      }
      
      // Generic syntax guidance
      return `In Python, syntax is designed to be readable and clean. Most statements are written one per line, with proper indentation used to define code blocks. For example, to write ${questionLower.replace("how do i write", "").replace("how to write", "").trim()}, you can use:\n\n\`\`\`python\n# Your Python code here\n# Start with basic syntax and build from there\n\`\`\`\n\nCould you be more specific about what you're trying to achieve?`;
    }
    
    // For lesson-specific questions
    if (questionLower.includes("what will i learn") || 
        questionLower.includes("this lesson about") || 
        questionLower.includes("objective")) {
      
      // Different responses based on common lesson titles
      if (lessonTitle.toLowerCase().includes("introduction")) {
        return `In "${lessonTitle}", you'll learn the fundamental concepts of Python programming, including basic syntax, variables, data types, and how to write and run simple programs. These foundations are essential for all further programming you'll do.`;
      }
      
      if (lessonTitle.toLowerCase().includes("function")) {
        return `In "${lessonTitle}", you'll learn how to create and use functions in Python. Functions are reusable blocks of code that help organize your programs, reduce repetition, and improve readability. You'll learn about parameters, return values, and function scope.`;
      }
      
      if (lessonTitle.toLowerCase().includes("loop")) {
        return `In "${lessonTitle}", you'll learn about loops, which allow you to repeat code operations efficiently. You'll explore for loops for iterating through sequences and while loops for condition-based repetition. Loops are essential for processing collections of data and automating repetitive tasks.`;
      }
      
      if (lessonTitle.toLowerCase().includes("condition") || lessonTitle.toLowerCase().includes("if")) {
        return `In "${lessonTitle}", you'll learn about conditional statements (if/elif/else) which allow your program to make decisions based on different conditions. This is a fundamental concept in programming logic that enables your programs to respond differently in various situations.`;
      }
      
      // Generic lesson description
      return `In "${lessonTitle}", you'll build practical programming skills through explanation, guided examples, and hands-on challenges. This lesson will help you understand key programming concepts and apply them to solve real problems. The skills you learn here will serve as building blocks for more advanced topics.`;
    }
    
    // Default response if no pattern is matched
    return `I understand you're asking about "${lessonTitle}". To give you the most helpful response, could you clarify which specific aspect of the lesson you're interested in? For example, are you looking for explanations of concepts, help with code, or guidance on the challenge?`;
  };
  
  /**
   * Get a hint based on expected output
   */
  const getHintForOutput = (output, lessonTitle) => {
    const outputLower = output.toLowerCase();
    
    if (outputLower.includes("hello") || outputLower.includes("world")) {
      return `Try using the print() function to display text. In Python, you can display text using: print("Your text here")`;
    }
    
    if (outputLower.includes("+") || outputLower.includes("sum") || 
        outputLower.includes("add") || /\d+\s*\+\s*\d+/.test(outputLower)) {
      return `To perform addition in Python, use the + operator between two numbers. For example: result = 5 + 3`;
    }
    
    if (/\d+\s*\-\s*\d+/.test(outputLower) || outputLower.includes("subtract") || 
        outputLower.includes("minus") || outputLower.includes("difference")) {
      return `For subtraction in Python, use the - operator. For example: result = 10 - 4`;
    }
    
    if (/\d+\s*\*\s*\d+/.test(outputLower) || outputLower.includes("multiply") || 
        outputLower.includes("product") || outputLower.includes("times")) {
      return `To multiply numbers in Python, use the * operator. For example: result = 6 * 7`;
    }
    
    if (/\d+\s*\/\s*\d+/.test(outputLower) || outputLower.includes("divide") || 
        outputLower.includes("quotient") || outputLower.includes("division")) {
      return `For division in Python, use the / operator, which gives a floating-point result. For example: result = 20 / 4`;
    }
    
    // Generic hint if we can't determine the specific operation
    return `Think about what operations you need to perform to produce the expected output. Make sure you're using the correct Python syntax and that your output format exactly matches what's expected.`;
  };
  
  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Save question to prevent repeated greeting responses
    const questionLower = inputValue.toLowerCase();
    setPreviousQuestions(prev => new Set(prev).add(questionLower));

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
      // Try to get response from API
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated");

      const response = await api.post(
        "lesson-assistant/",
        {
          lessonId,
          currentStep: Number(currentStep) || 1,
          userCode: userCode || "",
          expectedOutput: expectedOutput || "",
          question: userMessage.content
        },
        { 
          headers: { Authorization: `Token ${token}` },
          timeout: 10000 // Extend timeout to 10 seconds
        }
      );

      // Process response
      if (response.data && response.data.response && 
          typeof response.data.response === 'string') {
        
        const apiResponse = response.data.response;
        
        // Check if it's just a generic greeting without substance
        const isGenericGreeting = 
          apiResponse.toLowerCase().includes("how can i help") &&
          !apiResponse.toLowerCase().includes(questionLower.substring(0, 4)) &&
          apiResponse.length < 100; // Very short responses are likely generic
        
        if (isGenericGreeting && 
            !(questionLower.includes("hello") || 
              questionLower.includes("hi ") || 
              questionLower.includes("hey"))) {
          // If it's just a generic greeting, use local response
          
          // Generate a local response as backup
          const localResponse = generateLessonSpecificResponse(
            userMessage.content, 
            lessonTitle, 
            currentStep, 
            userCode, 
            expectedOutput
          );
          
          setMessages(prev => [
            ...prev, 
            { 
              id: prev.length + 1, 
              type: 'assistant', 
              content: localResponse
            }
          ]);
        } else {
          // Valid response that's not just a generic greeting
          setMessages(prev => [
            ...prev, 
            { 
              id: prev.length + 1, 
              type: 'assistant', 
              content: apiResponse
            }
          ]);
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error('AI Assistant Error:', error);
      
      // Generate a local response when API fails
      const localResponse = generateLessonSpecificResponse(
        userMessage.content, 
        lessonTitle, 
        currentStep, 
        userCode, 
        expectedOutput
      );
      
      setMessages(prev => [
        ...prev, 
        { 
          id: prev.length + 1, 
          type: 'assistant', 
          content: localResponse
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
    const step = Number(currentStep) || 1;
    
    switch(step) {
      case 1:
        return [
          "What will I learn in this lesson?",
          "Explain this concept more simply",
          "How is this used in real programming?"
        ];
      case 2:
        return [
          "What does this code do?",
          "Explain this syntax",
          "How can I modify this example?"
        ];
      case 3:
        return [
          "I'm stuck on the challenge",
          "Give me a hint",
          "What approach should I take?"
        ];
      default:
        return [
          "Explain this concept",
          "Give me an example",
          "How does this work?"
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