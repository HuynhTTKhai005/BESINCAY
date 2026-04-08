"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import styles from "../auth.module.css";

const DEMO_ACCOUNTS = [
  { label: "Khách", email: "customer@gmail.com", password: "123456" },
  { label: "Admin", email: "admin@sincay.com", password: "123456" }
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();

  const isAdminUser = (currentUser) => {
    const roleName = typeof currentUser?.role_id === "object" ? currentUser?.role_id?.name : currentUser?.role_id;
    const normalized = String(roleName || "").toLowerCase();
    return normalized === "admin" || normalized === "staff";
  };

  useEffect(() => {
    if (authLoading || !user) return;
    router.replace(isAdminUser(user) ? "/admin" : "/");
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(email, password);
    if (result.success) {
      const loggedInUser = result?.data?.user;
      router.push(isAdminUser(loggedInUser) ? "/admin" : "/");
    } else {
      setError(result.message || "Đăng nhập thất bại");
    }

    setLoading(false);
  };

  const fillDemoAccount = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  };

  return (
    <section className={styles.authShell}>
      <div className={styles.authWrap}>
        <aside className={styles.authInfo} data-aos="fade-right">
          <h1>Chào mừng quay lại</h1>
          <p>Đăng nhập để theo dõi đơn hàng, lưu món yêu thích và nhận ưu đãi thành viên.</p>
          <ul className={styles.authList}>
            <li>Đặt món nhanh và thuận tiện</li>
            <li>Lưu địa chỉ và lịch sử đơn hàng</li>
            <li>Nhận mã giảm giá dành riêng</li>
          </ul>
        </aside>

        <div className={styles.authCard} data-aos="fade-left">
          <h2 className={styles.authTitle}>Đăng nhập</h2>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                className={`form-control ${styles.authInput}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label">Mật khẩu</label>
              <input
                type="password"
                id="password"
                className={`form-control ${styles.authInput}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className={styles.authButton} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <div className={styles.demoBox}>
            <div className={styles.demoTitle}>Tài khoản demo</div>
            <div className={styles.demoList}>
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  className={styles.demoItem}
                  onClick={() => fillDemoAccount(account)}
                  disabled={loading}
                >
                  <span className={styles.demoBadge}>{account.label}</span>
                  <span className={styles.demoText}>
                    {account.email} / {account.password}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.authMeta}>
            <p className="mb-1">
              Chưa có tài khoản? <Link href="/register" className="text-decoration-none">Đăng ký ngay</Link>
            </p>
            <p className="mb-0">
              <Link href="/forgot-password" className="text-decoration-none">Quên mật khẩu?</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
