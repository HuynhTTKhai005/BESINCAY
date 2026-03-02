"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../auth.module.css";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Không thể gửi email đặt lại mật khẩu");
      }

      setMessage(result.message || "Vui lòng kiểm tra email để đặt lại mật khẩu.");
    } catch (submitError) {
      setError(submitError.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.authShell}>
      <div className={styles.authWrap}>
        <aside className={styles.authInfo} data-aos="fade-right">
          <h1>Quên mật khẩu?</h1>
          <p>Đừng lo, chúng tôi sẽ gửi liên kết đặt lại mật khẩu về email của bạn.</p>
          <ul className={styles.authList}>
            <li>Kiểm tra hộp thư đến và thư rác</li>
            <li>Liên kết có thời hạn để đảm bảo bảo mật</li>
            <li>Đặt lại nhanh và tiếp tục sử dụng tài khoản</li>
          </ul>
        </aside>

        <div className={styles.authCard} data-aos="fade-left">
          <h2 className={styles.authTitle}>Khôi phục mật khẩu</h2>
          <p className="text-muted mb-3">Nhập email tài khoản để nhận liên kết đặt lại mật khẩu.</p>

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                className={`form-control ${styles.authInput}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button className={styles.authButton} type="submit" disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi email đặt lại mật khẩu"}
            </button>
          </form>

          <div className={styles.authMeta}>
            <Link href="/login" className="text-decoration-none">Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    </section>
  );
}