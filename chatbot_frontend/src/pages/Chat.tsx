/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import {
  FaPaperPlane,
  FaSpinner,
  FaTrash,
  FaUser,
  FaHistory,
} from "react-icons/fa";
import { BsRobot } from "react-icons/bs";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}

const DocChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat histories from localStorage on component mount
  useEffect(() => {
    const savedHistories = localStorage.getItem("medicalChatHistories");
    if (savedHistories) {
      const parsedHistories = JSON.parse(savedHistories);
      // Convert string timestamps back to Date objects
      const processedHistories = parsedHistories.map((history: any) => ({
        ...history,
        timestamp: new Date(history.timestamp),
        messages: history.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
      setChatHistories(processedHistories);
    }
  }, []);

  // Save chat histories to localStorage whenever they change
  useEffect(() => {
    if (chatHistories.length > 0) {
      localStorage.setItem(
        "medicalChatHistories",
        JSON.stringify(chatHistories)
      );
    }
  }, [chatHistories]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus the input field when the component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load selected chat history
  useEffect(() => {
    if (currentChatId) {
      const selectedHistory = chatHistories.find((h) => h.id === currentChatId);
      if (selectedHistory) {
        setMessages(selectedHistory.messages);
      }
    }
  }, [currentChatId, chatHistories]);

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const createNewChat = () => {
    const newChatId = generateUniqueId();
    const newChat: ChatHistory = {
      id: newChatId,
      title: "New Consultation",
      timestamp: new Date(),
      messages: [],
    };

    setChatHistories((prev) => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    setMessages([]);
    setShowSidebar(false);
  };

  const deleteChat = (id: string) => {
    setChatHistories((prev) => prev.filter((chat) => chat.id !== id));
    if (currentChatId === id) {
      createNewChat();
    }
  };

  const selectChat = (id: string) => {
    setCurrentChatId(id);
    setShowSidebar(false);
  };

  const updateChatTitle = (messages: Message[]) => {
    // If there's at least one user message, use the first 30 chars as the title
    if (messages.length > 0 && messages[0].role === "user") {
      const userMessage = messages[0].content;
      const title =
        userMessage.length > 30
          ? `${userMessage.substring(0, 30)}...`
          : userMessage;
      return title;
    }
    return "New Consultation";
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Create a new chat if there isn't one selected
    if (!currentChatId) {
      createNewChat();
    }

    const messageId = generateUniqueId();
    const userMessage: Message = {
      id: messageId,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    // Update messages state
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    // Update chat history
    setChatHistories((prevHistories) => {
      const updatedHistories = prevHistories.map((chat) => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, userMessage],
            timestamp: new Date(),
            title:
              chat.messages.length === 0
                ? updateChatTitle([userMessage])
                : chat.title,
          };
        }
        return chat;
      });
      return updatedHistories;
    });

    try {
      setIsLoading(true);

      // Send request to backend
      const res = await fetch("https://medical-chatbot-kfbq.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch response");
      }

      const data = await res.json();

      // Create assistant message
      const botMessage: Message = {
        id: generateUniqueId(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      // Update messages state again with the bot's response
      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);

      // Update chat history with the bot response
      setChatHistories((prevHistories) => {
        const updatedHistories = prevHistories.map((chat) => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              messages: [...chat.messages, botMessage],
              timestamp: new Date(),
            };
          }
          return chat;
        });
        return updatedHistories;
      });
    } catch (error) {
      console.error("Error sending message:", error);

      // Add error message
      const errorMessage: Message = {
        id: generateUniqueId(),
        role: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setShowSidebar((prev) => !prev)}
        className="md:hidden fixed top-4 left-4 z-50 bg-teal-600 text-white p-2 rounded-full shadow-lg"
      >
        <FaHistory />
      </button>

      {/* Sidebar for chat history */}
      <div
        className={`${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 fixed md:static w-64 h-full bg-white border-r border-gray-200 shadow-md z-40 md:z-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-teal-700">
              Medical Assistant
            </h1>
            <p className="text-sm text-gray-500">
              Your personal health consultant
            </p>
          </div>

          <div className="p-3">
            <button
              onClick={createNewChat}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg shadow transition duration-200 flex items-center justify-center gap-2"
            >
              <span>New Consultation</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <h2 className="text-xs uppercase font-semibold text-gray-500 mb-2 px-2">
              Consultation History
            </h2>
            {chatHistories.length === 0 && (
              <p className="text-sm text-gray-400 text-center italic mt-4">
                No previous consultations
              </p>
            )}
            {chatHistories.map((chat) => (
              <div
                key={chat.id}
                className={`flex justify-between items-center p-2 rounded-lg mb-1 cursor-pointer hover:bg-gray-100 ${
                  currentChatId === chat.id
                    ? "bg-teal-50 border border-teal-200"
                    : ""
                }`}
                onClick={() => selectChat(chat.id)}
              >
                <div className="overflow-hidden">
                  <div className="text-sm font-medium truncate">
                    {chat.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(new Date(chat.timestamp))}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-200"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200 text-center">
            <div className="text-xs text-gray-500">
              © 2025 MedChat Professional
            </div>
          </div>
        </div>
      </div>

      {/* Main chat interface */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chat header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <div className="flex-1">
            <h2 className="font-semibold text-teal-700">
              {currentChatId
                ? chatHistories.find((c) => c.id === currentChatId)?.title ||
                  "Medical Consultation"
                : "Medical Consultation"}
            </h2>
            <p className="text-xs text-gray-500">
              {messages.length
                ? `${messages.length} message${messages.length > 1 ? "s" : ""}`
                : "Start a new conversation"}
            </p>
          </div>
        </div>

        {/* Messages container */}
        <div className="flex-1 overflow-y-auto p-4 bg-white bg-opacity-50 backdrop-blur-sm">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                <BsRobot size={28} className="text-teal-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Welcome to MedChat Assistant
              </h3>
              <p className="text-gray-500 max-w-md mb-6">
                I can help answer your medical questions, explain symptoms, or
                provide general health information.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg w-full">
                {[
                  "What are common symptoms of the flu?",
                  "Can you explain what an antibiotic does?",
                  "What should I do for a minor burn?",
                  "How much water should I drink daily?",
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 shadow-sm"
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex mb-4 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[80%] ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-2 ${
                    msg.role === "user" ? "bg-teal-500 ml-2" : "bg-blue-600"
                  }`}
                >
                  {msg.role === "user" ? (
                    <FaUser size={12} className="text-white" />
                  ) : (
                    <BsRobot size={14} className="text-white" />
                  )}
                </div>
                <div
                  className={`rounded-xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-teal-600 text-white rounded-tr-none shadow-sm"
                      : "bg-white border border-gray-200 rounded-tl-none shadow-sm"
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  <div
                    className={`text-xs mt-1 text-right ${
                      msg.role === "user" ? "text-teal-200" : "text-gray-400"
                    }`}
                  >
                    {formatDate(new Date(msg.timestamp))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="flex max-w-[80%] flex-row">
                <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-blue-600 mr-2">
                  <BsRobot size={14} className="text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-xl rounded-tl-none px-4 py-3 shadow-sm">
                  <div className="flex items-center">
                    <FaSpinner className="animate-spin text-teal-600 mr-2" />
                    <span className="text-gray-500">
                      Generating response...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="bg-white border border-gray-300 rounded-xl shadow-sm flex">
            <textarea
              ref={inputRef}
              className="flex-1 py-3 px-4 outline-none bg-transparent rounded-xl resize-none max-h-32"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your health question..."
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white rounded-xl m-1 px-4 py-2 flex items-center justify-center transition duration-200"
            >
              <FaPaperPlane size={14} />
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-2 text-center">
            For medical emergencies, please call emergency services or visit the
            nearest hospital
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocChat;
