"use client";

import { useState } from "react";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const contactInfo = [
    {
      icon: "bi bi-geo-alt",
      title: "Địa chỉ",
      content: "12 D. Trịnh Đình Thảo, Hòa Thạnh, Tân Phú, Hồ Chí Minh 700000",
      delay: 200
    },
    {
      icon: "bi bi-telephone",
      title: "Gọi cho chúng tôi",
      content: "+84 982 348 293",
      delay: 300
    },
    {
      icon: "bi bi-envelope",
      title: "Email",
      content: "mycaysincay@gmail.com",
      delay: 400
    },
    {
      icon: "bi bi-clock",
      title: "Thời gian mở cửa:",
      content: (
        <>
          <strong>Thứ 2 - Thứ 7</strong>: 11AM - 23PM |
          <strong> Chủ nhật</strong>: <span>Đóng cửa</span>
        </>
      ),
      delay: 500
    }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/contact-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Không thể gửi liên hệ");
      }

      setSuccess("Tin nhắn của bạn đã được gửi thành công. Cảm ơn bạn!");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch (submitError) {
      setError(submitError.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="contact section">
      <div className="container section-title" data-aos="fade-up">
        <p>
          <span className="description-title">LIÊN HỆ</span>
        </p>
        <h2>Nếu bạn cần hỗ trợ? Hãy liên hệ chúng tôi!</h2>
      </div>

      <div className="container" data-aos="fade-up" data-aos-delay={100}>
        <div className="mb-5">
          <iframe
            style={{ width: "100%", height: 400 }}
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d14902.180456860378!2d106.6390205!3d10.7746855!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752ea144839ef1%3A0x798819bdcd0522b0!2zQ2FvIMSQ4bqzbmcgQ8O0bmcgTmdo4buHIFRow7RuZyBUaW4gVFAuSENN!5e1!3m2!1svi!2s!4v1758596886713!5m2!1svi!2s"
            allowFullScreen
            title="Google Maps - Địa chỉ công ty"
          />
        </div>

        <div className="row gy-4">
          {contactInfo.map((item, index) => (
            <div key={index} className="col-md-6">
              <div className="info-item d-flex align-items-center" data-aos="fade-up" data-aos-delay={item.delay}>
                <i className={`icon ${item.icon} flex-shrink-0`} />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form className="php-email-form" data-aos="fade-up" data-aos-delay={600} onSubmit={handleSubmit}>
          <div className="row gy-4">
            <div className="col-md-6">
              <input type="text" name="name" className="form-control" placeholder="Tên" required value={formData.name} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <input type="email" className="form-control" name="email" placeholder="Email" required value={formData.email} onChange={handleChange} />
            </div>
            <div className="col-md-12">
              <input type="text" className="form-control" name="subject" placeholder="Chủ đề" required value={formData.subject} onChange={handleChange} />
            </div>
            <div className="col-md-12">
              <textarea className="form-control" name="message" rows={6} placeholder="Nội dung" required value={formData.message} onChange={handleChange} />
            </div>
            <div className="col-md-12 text-center">
              {loading && <div className="loading">Đang gửi lên</div>}
              {error && <div className="error-message d-block">{error}</div>}
              {success && <div className="sent-message d-block">{success}</div>}
              <button type="submit" disabled={loading}>Gửi thư</button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
