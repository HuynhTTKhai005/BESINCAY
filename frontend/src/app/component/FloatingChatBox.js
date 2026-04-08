"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const QUICK_PROMPTS = [
  "Gợi ý món ít cay cho 2 người",
  "Ăn gì no bụng dưới 200k?",
  "Có món nào hợp người thích hải sản không?",
  "Gợi ý thêm đồ uống đi kèm"
];

const INITIAL_MESSAGE = {
  id: "welcome",
  role: "assistant",
  text: "Mình là trợ lý món ăn của Sincay. Bạn cứ hỏi về khẩu vị, ngân sách, số người hoặc mức cay, mình sẽ gợi ý món phù hợp."
};
const STORAGE_KEY = "sincay-floating-chat";

export default function FloatingChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bodyRef = useRef(null);

  const BACKEND_URL = useMemo(() => {
    const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (envUrl) return envUrl.replace(/\/+$/, "");

    if (typeof window !== "undefined") {
      return `${window.location.protocol}//${window.location.hostname}:4000`;
    }

    return "http://localhost:4000";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const rawValue = window.sessionStorage.getItem(STORAGE_KEY);
      if (!rawValue) return;

      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed);
      }
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-12)));
  }, [messages]);

  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading, isOpen]);

  const parseApiResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return response.json();
    }

    const text = await response.text();
    const preview = text.slice(0, 120).trim();
    throw new Error(
      preview.startsWith("<")
        ? `API chat trả về HTML thay vì JSON. Kiểm tra NEXT_PUBLIC_BACKEND_URL hoặc backend /api/ai/chat.`
        : "API chat trả về dữ liệu không hợp lệ."
    );
  };

  const sendMessage = async (rawMessage) => {
    const trimmedMessage = String(rawMessage || "").trim();
    if (!trimmedMessage || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedMessage
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");
    setIsOpen(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedMessage,
          history: nextMessages.slice(-6).map((message) => ({
            role: message.role,
            content: message.text
          }))
        })
      });

      const result = await parseApiResponse(response);
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Khong the ket noi toi tro ly mon an");
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: result.data?.reply || "Mình chưa có câu trả lời phù hợp lúc này.",
        suggestions: Array.isArray(result.data?.suggestions) ? result.data.suggestions : [],
        provider: result.data?.provider || "fallback"
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (requestError) {
      setError(requestError.message || "Da co loi xay ra");
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: "Mình đang hơi bận một chút. Bạn thử hỏi lại sau ít phút hoặc nói rõ hơn về món muốn ăn nhé."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([INITIAL_MESSAGE]);
    setError("");
    setInput("");
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const handleInputKeyDown = async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await sendMessage(input);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`floating-chat-toggle ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Dong hop chat tu van mon" : "Mo hop chat tu van mon"}
      >
        <span className="floating-chat-toggle__icon">
          <i className={`bi ${isOpen ? "bi-x-lg" : "bi-chat-dots-fill"}`} />
        </span>
        <span className="floating-chat-toggle__text">AI Chat</span>
      </button>

      {isOpen && (
        <section className="floating-chat-panel" aria-label="Hop chat tu van mon an">
          <header className="floating-chat-panel__header">
            <div>
              <div className="floating-chat-panel__eyebrow">Sincay AI</div>
              <h3 className="floating-chat-panel__title">Tư vấn món nhanh</h3>
            </div>
            <div className="floating-chat-panel__actions">
              <button
                type="button"
                className="floating-chat-panel__icon-btn"
                onClick={resetConversation}
                aria-label="Lam moi cuoc tro chuyen"
                title="Làm mới"
              >
                <i className="bi bi-arrow-clockwise" />
              </button>
              <button
                type="button"
                className="floating-chat-panel__close"
                onClick={() => setIsOpen(false)}
                aria-label="Dong hop chat"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
          </header>

          <div className="floating-chat-panel__quick-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="floating-chat-chip"
                onClick={() => sendMessage(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="floating-chat-panel__body" ref={bodyRef}>
            {messages.map((message) => (
              <article
                key={message.id}
                className={`floating-chat-message ${
                  message.role === "user" ? "floating-chat-message--user" : "floating-chat-message--assistant"
                }`}
              >
                <div className="floating-chat-message__bubble">
                  {message.text.split("\n").map((line, index) => (
                    <p key={`${message.id}-${index}`}>{line}</p>
                  ))}
                </div>
              </article>
            ))}

            {loading && (
              <div className="floating-chat-message floating-chat-message--assistant">
                <div className="floating-chat-message__bubble floating-chat-message__bubble--loading">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          <footer className="floating-chat-panel__footer">
            {error && <div className="floating-chat-error">{error}</div>}

            <form className="floating-chat-form" onSubmit={handleSubmit}>
              <textarea
                className="floating-chat-input"
                rows="2"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Ví dụ: mình muốn món ít cay cho 2 người..."
                disabled={loading}
              />
              <button type="submit" className="floating-chat-submit" disabled={loading || !input.trim()}>
                <i className="bi bi-send-fill" />
              </button>
            </form>
          </footer>
        </section>
      )}
    </>
  );
}
