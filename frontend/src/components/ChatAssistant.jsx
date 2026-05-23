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
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
      <div className="bg-white rounded-t-2xl border border-gray-200/80 px-5 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              Resume Chat
            </h2>
            {filenames.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {filenames.map((name, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-[10px] rounded-md bg-indigo-50 text-indigo-600 font-medium ring-1 ring-inset ring-indigo-600/10"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label
            className={`px-3 py-1.5 text-xs font-medium rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
              uploading
                ? "bg-gray-100 text-gray-400 pointer-events-none"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 ring-1 ring-inset ring-indigo-600/10"
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
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {uploading ? "Uploading..." : "Upload PDFs"}
          </label>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="px-3 py-1.5 text-xs font-medium rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white border-x border-gray-200/80 px-5 py-5 space-y-4">
        {messages.length === 0 && resumeTexts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-indigo-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-500">Upload resumes to start chatting</p>
            <p className="text-sm mt-1.5 text-gray-400">
              Upload one or more PDFs and ask questions about them
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="flex items-start gap-2.5 max-w-[80%]">
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-sm">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm"
                    : "bg-white border border-gray-200/80 text-gray-800 shadow-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-2xl px-4 py-3 text-sm text-gray-400 shadow-sm flex items-center gap-2">
                <svg className="animate-spin w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="bg-red-50 border-x border-gray-200/80 px-5 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-b-2xl border border-gray-200/80 px-4 py-3 shadow-sm">
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
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 placeholder-gray-400 transition-shadow hover:shadow-sm"
            disabled={sending || resumeTexts.length === 0}
          />
          <button
            onClick={sendMessage}
            disabled={sending || resumeTexts.length === 0 || !input.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
