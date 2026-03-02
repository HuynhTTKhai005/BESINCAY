"use client";

import { useState } from "react";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

export default function Book() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    people: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      const response = await fetch(`${BACKEND_URL}/api/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Không thể gửi yêu cầu đặt bàn");
      }

      setSuccess("Yêu cầu đặt bàn đã được gửi. Chúng tôi sẽ sớm liên hệ xác nhận.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        people: "",
        message: ""
      });
    } catch (submitError) {
      setError(submitError.message || "Có lỗi xảy ra. Vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="book-a-table" className="book-a-table section">
      <div className="container section-title" data-aos="fade-up">
        <p>
          <span className="description-title">ĐẶT BÀN</span>
        </p>
        <h2>Điền thông tin đặt bàn tại đây</h2>
      </div>

      <div className="container">
        <div className="row g-0" data-aos="fade-up" data-aos-delay={100}>
          <div
            className="col-lg-7 reservation-img shadow-lg"
            style={{ backgroundImage: "url(/img/book_1.jpg)" }}
            role="img"
            aria-label="Không gian nhà hàng Sincay"
          />

          <div className="col-lg-5 d-flex align-items-center reservation-form-bg" data-aos="fade-up" data-aos-delay={200}>
            <form onSubmit={handleSubmit} role="form" className="php-email-form">
              <div className="row gy-4">
                <div className="col-lg-6 col-md-6">
                  <input type="text" name="name" className="form-control" placeholder="Tên" required value={formData.name} onChange={handleChange} />
                </div>
                <div className="col-lg-6 col-md-6">
                  <input type="email" className="form-control" name="email" placeholder="Email" required value={formData.email} onChange={handleChange} />
                </div>
                <div className="col-lg-6 col-md-6">
                  <input type="text" className="form-control" name="phone" placeholder="Số điện thoại" required value={formData.phone} onChange={handleChange} />
                </div>
                <div className="col-lg-6 col-md-6">
                  <input type="date" name="date" className="form-control" required value={formData.date} onChange={handleChange} />
                </div>
                <div className="col-lg-6 col-md-6">
                  <input type="time" className="form-control" name="time" required value={formData.time} onChange={handleChange} />
                </div>
                <div className="col-lg-6 col-md-6">
                  <input type="number" className="form-control" name="people" min="1" max="20" placeholder="Số lượng khách" required value={formData.people} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group mt-3">
                <textarea
                  className="form-control"
                  name="message"
                  rows={5}
                  placeholder="Ghi chú đặc biệt, yêu cầu về chỗ ngồi..."
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>

              <div className="text-center mt-3">
                {loading && <div className="loading">Đang xử lý...</div>}
                {error && <div className="error-message d-block">{error}</div>}
                {success && <div className="sent-message d-block">{success}</div>}
                <button type="submit" disabled={loading}>Đặt bàn</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
