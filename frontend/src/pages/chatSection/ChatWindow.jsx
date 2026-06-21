import React, { useState, useEffect, useRef } from "react";
import useLayoutStore from "../store/layoutStore";
import useThemeStore from "../store/useThemeStore";
import useUserStore from "../store/useUserStore";
import useSocket from "../hooks/useSocket"; // adjust path/name as per your setup

const ChatWindow = () => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const socket = useSocket();
  const currentUser = useUserStore((state) => state.user);

  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);

  const [message, setMessage] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const [messages, setMessages] = useState([
    { id: 1, text: "Hello 👋", sender: "other" },
    { id: 2, text: "Hi!", sender: "me" },
  ]);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherTyping]);

  // Listen for typing events from the selected contact
  useEffect(() => {
    if (!socket || !selectedContact) return;

    const handleTyping = ({ senderId, isTyping }) => {
      if (senderId === selectedContact._id) {
        setIsOtherTyping(isTyping);
      }
    };

    socket.on("typing", handleTyping);

    return () => {
      socket.off("typing", handleTyping);
      setIsOtherTyping(false); // reset when switching chats
    };
  }, [socket, selectedContact]);

  // Emit typing event when current user types
  const handleInputChange = (e) => {
    setMessage(e.target.value);

    if (!socket || !selectedContact) return;

    socket.emit("typing", {
      senderId: currentUser?._id,
      receiverId: selectedContact._id,
      isTyping: true,
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        senderId: currentUser?._id,
        receiverId: selectedContact._id,
        isTyping: false,
      });
    }, 1500); // stop "typing" after 1.5s of inactivity
  };

  const handleSend = () => {
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: message, sender: "me" },
    ]);

    // tell the other user typing has stopped immediately on send
    if (socket && selectedContact) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit("typing", {
        senderId: currentUser?._id,
        receiverId: selectedContact._id,
        isTyping: false,
      });
    }

    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  if (!selectedContact) {
    return (
      <div
        className={`flex items-center justify-center h-full ${
          isDark ? "bg-[#111b21] text-gray-400" : "bg-gray-100 text-gray-500"
        }`}
      >
        Select a chat
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full ${
        isDark ? "bg-[#0b141a] text-white" : "bg-gray-50 text-black"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 border-b ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div>
          <h2 className="font-semibold">{selectedContact.name}</h2>
          {isOtherTyping && (
            <p className="text-xs text-green-500">typing...</p>
          )}
        </div>

        <button
          onClick={() => setSelectedContact(null)}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Back
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-xs px-4 py-2 rounded-lg break-words ${
              msg.sender === "me"
                ? "ml-auto bg-green-500 text-white"
                : isDark
                ? "bg-gray-700 text-white"
                : "bg-gray-300 text-black"
            }`}
          >
            {msg.text}
          </div>
        ))}

        {isOtherTyping && (
          <div
            className={`max-w-xs px-4 py-2 rounded-lg flex gap-1 ${
              isDark ? "bg-gray-700" : "bg-gray-300"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className={`p-4 border-t flex gap-2 ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className={`flex-1 px-4 py-2 border rounded-lg outline-none ${
            isDark
              ? "bg-[#202c33] border-gray-600 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-black"
          }`}
        />

        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;