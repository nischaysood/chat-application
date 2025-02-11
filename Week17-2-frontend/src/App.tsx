import { useEffect, useRef, useState } from "react";
import "./App.css";

type Message = {
  text: string;
  isSender: boolean;
  senderId: string;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const clientId = useRef(crypto.randomUUID()); // Generate a unique client ID

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onmessage = (event) => {
      try {
        const { text, senderId } = JSON.parse(event.data);

        // Ignore messages sent by this client (avoids echo issue)
        if (senderId === clientId.current) return;

        setMessages((m) => [...m, { text, isSender: false, senderId }]);
        scrollToBottom();
      } catch (error) {
        console.error("Invalid message format", error);
      }
    };

    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ 
        type: "join", 
        payload: { roomId: "123", senderId: clientId.current } 
      }));
    };

    return () => ws.close();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = () => {
    const inputElement = document.getElementById("message") as HTMLInputElement;
    if (!inputElement || !wsRef.current) return console.error("WebSocket not connected or input missing!");

    const message = inputElement.value.trim();
    if (!message) return;

    const messageData = {
      type: "chat",
      payload: {
        message: message,
        senderId: clientId.current,
      },
    };

    // Add message locally as sent
    setMessages((prev) => [...prev, { text: message, isSender: true, senderId: clientId.current }]);

    // Send message via WebSocket
    wsRef.current.send(JSON.stringify(messageData));

    inputElement.value = "";
    scrollToBottom();
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.isSender ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] px-4 py-3 rounded-xl text-white text-sm md:text-base shadow-md ${
                msg.isSender ? "bg-green-500" : "bg-blue-500"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input Field & Send Button */}
      <div className="bg-gray-800 p-4 flex items-center gap-3 sticky bottom-0">
        <input
          id="message"
          className="flex-1 px-4 py-3 rounded-full bg-gray-700 text-white placeholder-gray-400 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-purple-600 px-6 py-3 rounded-full text-white font-medium shadow-md hover:bg-purple-700 transition duration-200"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;