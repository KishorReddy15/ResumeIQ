import { useState, useRef, useEffect } from "react";
import api from "../api";

export default function ChatAssistant() {
  const [resumeTexts, setResumeTexts] = useState([]);
  const [filenames, setFilenames] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    try {
      const res = await api.post("/chat/upload", formData);
      setResumeTexts((prev) => [...prev, ...res.data.resume_texts]);
      setFilenames((prev) => [...prev, ...res.data.filenames]);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Loaded ${res.data.filenames.length} resume(s): ${res.data.filenames.join(", ")}. You can now ask me anything about ${res.data.filenames.length === 1 ? "this resume" : "these resumes"}.`,
        },
      ]);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      setError(`Upload failed: ${detail}`);
    }

    setUploading(false);
    e.target.value = "";
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    if (resumeTexts.length === 0) {
      setError("Please upload at least one resume before chatting.");
      return;
    }

    const userMsg = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await api.post("/chat", {
        messages: updatedMessages.filter((m) => m.role !== "system"),
        resume_texts: resumeTexts,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply },
      ]);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${detail}` },
      ]);
    }

    setSending(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setResumeTexts([]);
    setFilenames([]);
    setMessages([]);
    setInput("");
    setError(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header with upload */}
      <div className="bg-white rounded-t-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Resume Chat Assistant
          </h2>
          {filenames.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filenames.map((name, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label
            className={`px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
              uploading
                ? "bg-gray-100 text-gray-400 pointer-events-none"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? "Uploading..." : "+ Upload PDFs"}
          </label>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 border-x border-gray-200 px-4 py-4 space-y-4">
        {messages.length === 0 && resumeTexts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <p className="text-lg font-medium">Upload resumes to start chatting</p>
            <p className="text-sm mt-1">
              Upload one or more PDFs and ask questions about them
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-x border-gray-200 px-4 py-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white rounded-b-xl border border-gray-200 px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              resumeTexts.length === 0
                ? "Upload resumes first..."
                : "Ask about the resumes..."
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
            disabled={sending || resumeTexts.length === 0}
          />
          <button
            onClick={sendMessage}
            disabled={sending || resumeTexts.length === 0 || !input.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
