"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "sincay-floating-chat";

const FAQ_GROUPS = [
  {
    title: "Về món ăn",
    items: [
      {
        id: "featured-dishes",
        question: "Quán có những món nổi bật nào?",
        answer:
          "Sincay nổi bật với mì cay, các món khai vị kiểu Hàn và đồ uống đi kèm. Nếu bạn thích vị đậm và cay, mì cay là lựa chọn được nhiều khách gọi nhất."
      },
      {
        id: "best-sellers",
        question: "Món nào bán chạy nhất?",
        answer:
          "Những món được quan tâm nhiều nhất thường là mì cay, món ăn vặt kiểu Hàn và một số loại nước uống đi kèm."
      },
      {
        id: "drinks",
        question: "Quán có đồ uống gì?",
        answer:
          "Quán có nhiều loại đồ uống dùng kèm món ăn như nước ngọt, trà và các loại nước giải khát phổ biến."
      },
      {
        id: "view-menu",
        question: "Tôi muốn xem menu",
        answer:
          "Bạn có thể xem toàn bộ menu của quán tại trang thực đơn.",
        actions: [{ label: "Xem menu", href: "/menu", icon: "bi-journal-text" }]
      },
      {
        id: "spicy-level-0",
        question: "Quán có bán mì cay cấp 0 không, tôi không ăn cay được.",
        answer:
          "Dạ được, bạn có thể chọn món và chọn cấp độ cay đối với mì cay."
      },
      {
        id: "broth-flavors",
        question: "Ở đây có những vị nước lèo gì?",
        answer:
          "Dạ ở đây có vị kim chi (chua ngọt), soyum (béo) và sincay (lẩu thái)."
      }
    ]
  },
  {
    title: "Về dịch vụ",
    items: [
      {
        id: "reservation",
        question: "Quán có nhận đặt bàn không?",
        answer:
          "Có, khách có thể đặt bàn trước để quán sắp xếp chỗ ngồi thuận tiện hơn.",
        actions: [{ label: "Đặt bàn ngay", href: "/book", icon: "bi-calendar-check" }]
      },
      {
        id: "order-history",
        question: "Tôi có thể xem lịch sử đơn hàng ở đâu?",
        answer:
          "Sau khi đăng nhập, bạn có thể vào phần đơn hàng để xem lịch sử đặt món và trạng thái từng đơn.",
        actions: [{ label: "Xem đơn hàng", href: "/orders", icon: "bi-receipt" }]
      },
      {
        id: "contact",
        question: "Làm sao để liên hệ với quán?",
        answer:
          "Bạn có thể liên hệ với quán qua trang liên hệ hoặc để lại thông tin trong form để quán phản hồi.",
        actions: [{ label: "Mở trang liên hệ", href: "/contact", icon: "bi-chat-left-text" }]
      },
      {
        id: "contact-info",
        question: "Đưa ra thông tin liên hệ",
        answer:
          "Địa chỉ: 12 D. Trịnh Đình Thảo, Hòa Thạnh, Tân Phú, Hồ Chí Minh 700000.\nĐiện thoại: +84 982 348 293.\nEmail: mycaysincay@gmail.com.\nThời gian mở cửa: Thứ 2 - Thứ 7, 11AM - 23PM.",
        actions: [{ label: "Xem chi tiết", href: "/contact", icon: "bi-geo-alt" }]
      }
    ]
  }
];

const FAQ_LOOKUP = FAQ_GROUPS.flatMap((group) => group.items).reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});

const INITIAL_MESSAGES = [
  {
    id: "welcome",
    role: "assistant",
    text: "Xin chào, mình là trợ lý hỗ trợ nhanh của Sincay. Bạn chỉ cần chọn một câu hỏi có sẵn bên dưới, mình sẽ trả lời ngay."
  }
];

const createQuestionMessage = (item) => ({
  id: `user-${item.id}-${Date.now()}`,
  role: "user",
  text: item.question
});

const createAnswerMessage = (item) => ({
  id: `assistant-${item.id}-${Date.now()}`,
  role: "assistant",
  text: item.answer,
  actions: item.actions || []
});

export default function FloatingChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const bodyRef = useRef(null);

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
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-10)));
  }, [messages]);

  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [isOpen, messages]);

  const handleSelectQuestion = (questionId) => {
    const item = FAQ_LOOKUP[questionId];
    if (!item) return;

    setMessages((current) => [...current, createQuestionMessage(item), createAnswerMessage(item)]);
    setIsOpen(true);
  };

  const handleSubmitCustomQuestion = (event) => {
    event.preventDefault();

    const trimmedQuestion = customQuestion.trim();
    if (!trimmedQuestion) return;

    setMessages((current) => [
      ...current,
      {
        id: `user-custom-${Date.now()}`,
        role: "user",
        text: trimmedQuestion
      },
      {
        id: `assistant-custom-${Date.now()}`,
        role: "assistant",
        text: "Nếu bạn cần chi tiết hơn hãy liên hệ với số điện thoại +84 982 348 293 để được tư vấn.",
        actions: [{ label: "Xem trang liên hệ", href: "/contact", icon: "bi-telephone" }]
      }
    ]);
    setCustomQuestion("");
  };

  const resetConversation = () => {
    setMessages(INITIAL_MESSAGES);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className="floating-chat-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Mở hộp hỗ trợ nhanh"
        >
          <span className="floating-chat-toggle__icon">
            <i className="bi bi-chat-dots-fill" />
          </span>
        </button>
      )}

      {isOpen && (
        <section className="floating-chat-panel" aria-label="Hộp hỗ trợ nhanh của Sincay">
          <header className="floating-chat-panel__header">
            <div>
              <div className="floating-chat-panel__eyebrow">Sincay Support</div>
            </div>
            <div className="floating-chat-panel__actions">
              <button
                type="button"
                className="floating-chat-panel__icon-btn"
                onClick={resetConversation}
                aria-label="Làm mới hội thoại"
                title="Làm mới"
              >
                <i className="bi bi-arrow-clockwise" />
              </button>
              <button
                type="button"
                className="floating-chat-panel__close"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng hộp chat"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
          </header>

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

                  {Array.isArray(message.actions) && message.actions.length > 0 && (
                    <div className="floating-chat-actions">
                      {message.actions.map((action) => (
                        <Link key={`${message.id}-${action.href}`} href={action.href} className="floating-chat-link">
                          {action.icon && <i className={`bi ${action.icon}`} aria-hidden="true" />}
                          <span>{action.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          <footer className="floating-chat-panel__footer">
            <form className="floating-chat-form" onSubmit={handleSubmitCustomQuestion}>
              <input
                type="text"
                className="floating-chat-input"
                value={customQuestion}
                onChange={(event) => setCustomQuestion(event.target.value)}
                placeholder="Nhập câu hỏi khác của bạn..."
              />
              <button type="submit" className="floating-chat-submit" disabled={!customQuestion.trim()}>
                <i className="bi bi-send-fill" />
              </button>
            </form>

            <div className="floating-chat-panel__faq">
              {FAQ_GROUPS.map((group) => (
                <section key={group.title} className="floating-chat-faq-section">
                  <h4 className="floating-chat-faq-section__title">{group.title}</h4>
                  <div className="floating-chat-question-list">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="floating-chat-question"
                        onClick={() => handleSelectQuestion(item.id)}
                      >
                        {item.question}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </footer>
        </section>
      )}
    </>
  );
}
