import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, loading]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();

      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Oops, something went wrong." },
      ]);
    }

    setLoading(false);
  }

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 z-[500] fixed bottom-4 right-4 w-fit h-14 px-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all duration-300"
        >
        <i className="fa-solid fa-comment"></i>
          Ask about Pa Michael Alabi
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="z-[500] fixed bottom-4 right-4 w-[1500px] max-w-[91vw] sm:w-96 h-[70vh] bg-white dark:bg-neutral-900 rounded-lg shadow-2xl flex flex-col transition-all duration-300">
          {/* Header */}
          <div className="flex justify-between items-center bg-[var(--clr-celadon)] text-white p-3 rounded-t-lg">
            <span className="font-semibold">Ask about Pa Michael Alabi</span>
            <button
              onClick={() => setOpen(false)}
              className="hover:text-gray-200 transition"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            <p className="text-sm">Curious about the life and legacy of Pa Michael Alabi? Ask away to get answers. Powered by Deepseek AI.</p>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`w-full p-2 rounded-lg text-sm break-words ${
                  m.role === "user"
                    ? "bg-[var(--clr-celadon)] text-right self-end"
                    : "bg-gray-100 dark:bg-neutral-800 self-start"
                }`}
              >
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ))}
            {loading && (
              <div className="text-sm mt-2 text-gray-500"><i className="fa-solid fa-spinner animate-spin"></i>One moment...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex p-2 gap-2">
            <input
              className="flex-1 rounded-lg px-2 py-1 text-md dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask something..."
            />
            <button
              onClick={sendMessage}
              className="px-3 py-1 rounded-lg bg-[var(--clr-celadon)] text-white text-md hover:bg-blue-700 transition"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
