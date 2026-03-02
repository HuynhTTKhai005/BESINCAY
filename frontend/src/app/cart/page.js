"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

export default function Cart() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [loginWarning, setLoginWarning] = useState("");

  const { cart, removeFromCart, updateQuantity, getCartTotal, cartCount, clearCart } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const handleIncrement = (productId, currentQuantity) => {
    updateQuantity(productId, currentQuantity + 1);
  };

  const handleDecrement = (productId, currentQuantity) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    } else {
      removeFromCart(productId);
    }
  };

  const subtotal = getCartTotal();
  const shippingFee = subtotal > 100000 ? 0 : 20000;
  const discountAmount = appliedCoupon?.discount_amount || 0;
  const total = Math.max(0, subtotal + shippingFee - discountAmount);

  const handleCheckout = () => {
    if (!user || !token) {
      setLoginWarning("Vui lòng đăng nhập trước khi thanh toán.");
      setTimeout(() => router.push("/login"), 500);
      return;
    }

    setLoginWarning("");

    const params = new URLSearchParams();
    if (appliedCoupon?.code) {
      params.set("coupon", appliedCoupon.code);
    }

    const target = params.toString() ? `/checkout?${params.toString()}` : "/checkout";
    router.push(target);
  };

  const getImageUrl = (url) => {
    if (!url) return "/img/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponError("Vui lòng nhập mã giảm giá");
      setCouponMessage("");
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    setCouponMessage("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Mã giảm giá không hợp lệ");
      }

      setAppliedCoupon(result.data);
      setCouponMessage(`Đã áp mã ${result.data.code} thành công`);
      setCouponError("");
    } catch (error) {
      setAppliedCoupon(null);
      setCouponError(error.message || "Không thể áp mã giảm giá");
      setCouponMessage("");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponMessage("");
    setCouponError("");
    setCouponCode("");
  };

  const cartKey = useMemo(() => JSON.stringify(cart.map((item) => ({ id: item.id, q: item.quantity }))), [cart]);
  useEffect(() => {
    if (appliedCoupon && subtotal <= 0) {
      setAppliedCoupon(null);
    }
  }, [cartKey, subtotal, appliedCoupon]);

  return (
    <section id="cart" className="cart section">
      <div className="container section-title" data-aos="fade-up">
        <p><span className="description-title">GIỎ HÀNG</span></p>
        <h2>Giỏ hàng của bạn</h2>
      </div>

      <div className="container">
        {cart.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-cart-x" style={{ fontSize: "4rem", color: "var(--accent-color)" }}></i>
            <h3 className="mt-3">Giỏ hàng trống</h3>
            <p className="text-muted">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
            <Link href="/#menu" className="btn btn-danger mt-3">Xem thực đơn</Link>
          </div>
        ) : (
          <div className="row">
            <div className="col-lg-8">
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item._id || `${item.id}-${JSON.stringify(item.spicyInfo || {})}`} className="cart-item d-flex align-items-center border-bottom py-4">
                    <div className="cart-item-image me-4">
                      <Image
                        src={getImageUrl(item.image_url)}
                        alt={item.name}
                        width={100}
                        height={100}
                        className="rounded"
                        style={{ objectFit: "cover" }}
                        unoptimized={true}
                      />
                    </div>

                    <div className="cart-item-details flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="mb-1">{item.name}</h5>
                          <p className="text-muted mb-2 small">{item.description}</p>
                          {item.spicyInfo && (
                            <div className="mt-2">
                              <span className="badge bg-danger">Cấp độ cay: {item.spicyInfo.level}</span>
                              {item.spicyInfo.note && (
                                <div className="text-muted small mt-1"><i>Ghi chú: {item.spicyInfo.note}</i></div>
                              )}
                            </div>
                          )}
                          <div className="d-flex align-items-center">
                            <span className="price fw-bold me-3">{(item.base_price_cents || 0).toLocaleString("vi-VN")} VNĐ</span>
                            <div className="quantity-controls d-flex align-items-center">
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDecrement(item.id, item.quantity)}>
                                <i className="bi bi-dash"></i>
                              </button>
                              <span className="mx-3" style={{ minWidth: 30, textAlign: "center" }}>{item.quantity}</span>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleIncrement(item.id, item.quantity)}>
                                <i className="bi bi-plus"></i>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="text-end">
                          <div className="mb-2">
                            <strong>{(item.base_price_cents * item.quantity).toLocaleString("vi-VN")} VNĐ</strong>
                          </div>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => removeFromCart(item.id)}>
                            <i className="bi bi-trash"></i> Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="d-flex justify-content-between mt-4">
                  <Link href="/#menu" className="btn btn-outline-danger">
                    <i className="bi bi-arrow-left me-2"></i>
                    Tiếp tục mua sắm
                  </Link>
                  <button className="btn btn-outline-danger" onClick={clearCart}>
                    <i className="bi bi-trash me-2"></i>
                    Xóa tất cả
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-4 mt-4 mt-lg-0">
              <div className="cart-summary bg-light p-4 rounded" data-aos="fade-left">
                <h4 className="mb-4">Tóm tắt đơn hàng</h4>

                <div className="d-flex justify-content-between mb-2">
                  <span>Số lượng sản phẩm:</span>
                  <span>{cartCount}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span>Tạm tính:</span>
                  <span>{subtotal.toLocaleString("vi-VN")} VNĐ</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span>Phí giao hàng:</span>
                  <span>{shippingFee === 0 ? <span className="text-success">MIỄN PHÍ</span> : `${shippingFee.toLocaleString("vi-VN")} VNĐ`}</span>
                </div>

                {appliedCoupon && (
                  <div className="d-flex justify-content-between mb-2 text-danger">
                    <span>Giảm giá ({appliedCoupon.code}):</span>
                    <span>-{discountAmount.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                )}

                <hr />

                <div className="d-flex justify-content-between mb-3">
                  <strong className="fs-5">Tổng cộng:</strong>
                  <strong className="fs-5 text-danger">{total.toLocaleString("vi-VN")} VNĐ</strong>
                </div>

                <div className="mb-3">
                  <label className="form-label">Mã giảm giá / voucher</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nhập mã"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={couponLoading || !!appliedCoupon}
                    />
                    {!appliedCoupon ? (
                      <button className="btn btn-outline-danger" onClick={handleApplyCoupon} disabled={couponLoading}>
                        {couponLoading ? "Đang áp..." : "Áp dụng"}
                      </button>
                    ) : (
                      <button className="btn btn-outline-secondary" onClick={handleRemoveCoupon}>
                        Gỡ mã
                      </button>
                    )}
                  </div>
                  {couponMessage && <div className="text-success small mt-2">{couponMessage}</div>}
                  {couponError && <div className="text-danger small mt-2">{couponError}</div>}
                </div>

                {loginWarning && <div className="alert alert-danger py-2">{loginWarning}</div>}

                <button className="btn btn-danger w-100 py-3" onClick={handleCheckout} disabled={cart.length === 0}>
                  <i className="bi bi-credit-card me-2"></i>
                  Thanh toán ngay
                </button>

                <div className="mt-3 text-center small text-muted">
                  <i className="bi bi-shield-check me-1"></i>
                  Thanh toán an toàn và bảo mật
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
