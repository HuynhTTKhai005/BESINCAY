"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    default_shipping_address: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setFormData({
      name: user.name || "",
      phone: user.phone || "",
      default_shipping_address: user.default_shipping_address || ""
    });
  }, [user]);

  const roleName =
    typeof user?.role_id === "object" ? user?.role_id?.name : user?.role_id;

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("vi-VN")
    : "Chưa cập nhật";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Không thể cập nhật hồ sơ");
      }

      updateUser(result.data);
      setMessage("Đã cập nhật thông tin hồ sơ thành công.");
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <section className="section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <div className="card shadow text-center" data-aos="fade-up">
                <div className="card-body p-5">
                  <i
                    className="bi bi-person-x"
                    style={{ fontSize: "4rem", color: "var(--accent-color)" }}
                  ></i>
                  <h3 className="mt-3">Vui lòng đăng nhập</h3>
                  <p className="text-muted">
                    Bạn cần đăng nhập để xem và chỉnh sửa hồ sơ cá nhân.
                  </p>
                  <Link href="/login" className="btn btn-danger mt-3">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Đăng nhập
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container section-title" data-aos="fade-up">
        <p>
          <span className="description-title">HỒ SƠ</span>
        </p>
        <h2>Thông tin người dùng</h2>
      </div>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8" data-aos="fade-up">
            <div className="card shadow border-0">
              <div className="card-body p-4 p-md-5">
                <div className="d-flex align-items-center mb-4">
                  <div
                    className="rounded-circle bg-danger-subtle d-flex align-items-center justify-content-center me-3"
                    style={{ width: "68px", height: "68px" }}
                  >
                    <i className="bi bi-person fs-2 text-danger"></i>
                  </div>
                  <div>
                    <h4 className="mb-1">{user.name || "Người dùng"}</h4>
                    <span className="badge text-bg-light">{roleName || "user"}</span>
                  </div>
                </div>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                {!isEditing ? (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="border rounded p-3 h-100">
                        <small className="text-muted d-block mb-1">Email</small>
                        <strong>{user.email || "Chưa cập nhật"}</strong>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="border rounded p-3 h-100">
                        <small className="text-muted d-block mb-1">Số điện thoại</small>
                        <strong>{user.phone || "Chưa cập nhật"}</strong>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="border rounded p-3 h-100">
                        <small className="text-muted d-block mb-1">Địa chỉ đặt hàng mặc định</small>
                        <strong>{user.default_shipping_address || "Chưa cập nhật"}</strong>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="border rounded p-3 h-100">
                        <small className="text-muted d-block mb-1">Trạng thái tài khoản</small>
                        <strong>{user.is_active === false ? "Vô hiệu" : "Hoạt động"}</strong>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="border rounded p-3 h-100">
                        <small className="text-muted d-block mb-1">Ngày tạo tài khoản</small>
                        <strong>{createdAt}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label">Họ và tên</label>
                        <input
                          type="text"
                          name="name"
                          className="form-control"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Số điện thoại</label>
                        <input
                          type="text"
                          name="phone"
                          className="form-control"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Ví dụ: 0901xxxxxx"
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Địa chỉ đặt hàng mặc định</label>
                        <textarea
                          name="default_shipping_address"
                          className="form-control"
                          rows="3"
                          value={formData.default_shipping_address}
                          onChange={handleChange}
                          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                        ></textarea>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-4">
                      <button type="submit" className="btn btn-danger" disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setIsEditing(false);
                          setError("");
                          setMessage("");
                          setFormData({
                            name: user.name || "",
                            phone: user.phone || "",
                            default_shipping_address: user.default_shipping_address || ""
                          });
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                )}

                <div className="d-flex flex-wrap gap-2 mt-4">
                  {!isEditing && (
                    <button className="btn btn-danger" onClick={() => setIsEditing(true)}>
                      <i className="bi bi-pencil-square me-2"></i>
                      Chỉnh sửa thông tin
                    </button>
                  )}

                  <Link href="/orders" className="btn btn-outline-danger">
                    <i className="bi bi-bag-check me-2"></i>
                    Đơn hàng của tôi
                  </Link>
                  <Link href="/" className="btn btn-outline-secondary">
                    <i className="bi bi-house me-2"></i>
                    Về trang chủ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
