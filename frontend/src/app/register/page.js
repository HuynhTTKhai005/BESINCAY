"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }

    const result = await register(formData.name, formData.email, formData.password, formData.phone);

    if (result.success) {
      setSuccess("Đăng ký thành công! Đang chuyển hướng...");
      setTimeout(() => router.push("/"), 1500);
    } else {
      setError(result.message || "Đăng ký thất bại");
    }

    setLoading(false);
  };

  return (
    <section className={styles.authShell}>
      <div className={styles.authWrap}>
        <aside className={styles.authInfo} data-aos="fade-right">
          <h1>Tạo tài khoản mới</h1>
          <p>Tham gia Sincay để đặt món nhanh hơn và nhận ưu đãi theo thành viên.</p>
          <ul className={styles.authList}>
            <li>Lưu món yêu thích</li>
            <li>Theo dõi đơn hàng dễ dàng</li>
            <li>Nhận thông báo ưu đãi mới</li>
          </ul>
        </aside>

        <div className={styles.authCard} data-aos="fade-left">
          <h2 className={styles.authTitle}>Đăng ký tài khoản</h2>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="name" className="form-label">Họ và tên</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={`form-control ${styles.authInput}`}
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="phone" className="form-label">Số điện thoại</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className={`form-control ${styles.authInput}`}
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-control ${styles.authInput}`}
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="password" className="form-label">Mật khẩu</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className={`form-control ${styles.authInput}`}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <div className="form-text">Ít nhất 6 ký tự</div>
              </div>

              <div className="col-md-6 mb-4">
                <label htmlFor="confirmPassword" className="form-label">Xác nhận mật khẩu</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className={`form-control ${styles.authInput}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className={styles.authButton} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đang đăng ký...
                </>
              ) : (
                "Đăng ký"
              )}
            </button>
          </form>

          <div className={styles.authMeta}>
            Đã có tài khoản? <Link href="/login" className="text-decoration-none">Đăng nhập</Link>
          </div>
        </div>
      </div>
    </section>
  );
}