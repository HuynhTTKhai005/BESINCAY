"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
    paymentMethod: "cod"
  });

  const subtotal = getCartTotal();
  const shippingFee = subtotal >= 100000 ? 0 : 20000;
  const discountAmount = appliedCoupon?.discount_amount || 0;
  const previewTotal = Math.max(0, subtotal + shippingFee - discountAmount);

  const couponQuery = searchParams.get("coupon");

  const getImageUrl = (url) => {
    if (!url) return "/img/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.default_shipping_address || prev.address
    }));
  }, [user]);

  useEffect(() => {
    if (cart.length === 0 && !placedOrder) {
      router.push("/cart");
    }
  }, [cart.length, placedOrder, router]);

  useEffect(() => {
    if (!couponQuery || subtotal <= 0) {
      setAppliedCoupon(null);
      setCouponError("");
      return;
    }

    const validateCoupon = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/coupons/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: couponQuery, subtotal })
        });

        const result = await response.json();
        if (!result.success) {
          setAppliedCoupon(null);
          setCouponError(result.message || "Mã giảm giá không hợp lệ");
          return;
        }

        setAppliedCoupon(result.data);
        setCouponError("");
      } catch (error) {
        setAppliedCoupon(null);
        setCouponError("Không thể xác thực mã giảm giá");
      }
    };

    validateCoupon();
  }, [couponQuery, subtotal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !token) {
      alert("Vui lòng đăng nhập để đặt hàng!");
      router.push("/login");
      return;
    }

    if (cart.length === 0) {
      alert("Giỏ hàng trống!");
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address
        },
        items: cart.map((item) => ({
          product_id: item.id,
          name: item.name,
          description: item.description,
          base_price_cents: item.base_price_cents,
          image_url: item.image_url,
          slug: item.slug,
          quantity: item.quantity,
          spicyInfo: item.spicyInfo
        })),
        note: formData.note,
        paymentMethod: formData.paymentMethod,
        coupon_code: appliedCoupon?.code || null
      };

      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Có lỗi xảy ra khi đặt hàng");
      }

      setPlacedOrder({
        id: result?.data?.order_id,
        total: Number(result?.data?.total ?? previewTotal),
        discountAmount: Number(result?.data?.discountAmount ?? discountAmount),
        couponCode: appliedCoupon?.code || null,
        date: new Date().toLocaleDateString("vi-VN")
      });

      clearCart();
    } catch (error) {
      console.error("Order error:", error);
      alert(error.message || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const orderItemsPreview = useMemo(
    () =>
      cart.map((item, index) => ({
        key: `${item.id}-${index}`,
        name: item.name,
        image: item.image_url,
        quantity: item.quantity || 1,
        amount: (item.base_price_cents || 0) * (item.quantity || 1)
      })),
    [cart]
  );

  if (placedOrder) {
    return (
      <section className="checkout-success section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-7">
              <div className="card border-0 shadow">
                <div className="card-body p-4 p-md-5 text-center">
                  <div className="mb-4">
                    <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "4.5rem" }}></i>
                  </div>

                  <h2 className="mb-2">Đặt hàng thành công</h2>
                  <p className="text-muted mb-4">Đơn hàng của bạn đã được ghi nhận. Cảm ơn bạn đã ủng hộ Sincay.</p>

                  <div className="bg-light rounded p-4 text-start border border-danger-subtle">
                    <div className="row g-3">
                      <div className="col-sm-6">
                        <small className="text-muted d-block">Mã đơn hàng</small>
                        <strong>{placedOrder.id}</strong>
                      </div>
                      <div className="col-sm-6">
                        <small className="text-muted d-block">Ngày đặt</small>
                        <strong>{placedOrder.date}</strong>
                      </div>
                      <div className="col-sm-6">
                        <small className="text-muted d-block">Tổng thanh toán</small>
                        <strong className="text-danger">{placedOrder.total.toLocaleString("vi-VN")} VNĐ</strong>
                      </div>
                      {placedOrder.couponCode && (
                        <div className="col-sm-6">
                          <small className="text-muted d-block">Mã giảm giá</small>
                          <strong className="text-success">{placedOrder.couponCode}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 justify-content-center mt-4">
                    <Link href="/orders" className="btn btn-danger px-4">Đơn hàng của tôi</Link>
                    <Link href="/" className="btn btn-outline-danger px-4">Về trang chủ</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout section">
      <div className="container section-title" data-aos="fade-up">
        <p><span className="description-title">THANH TOÁN</span></p>
        <h2>Hoàn tất đơn hàng</h2>
      </div>

      <div className="container">
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card shadow border-0 h-100">
              <div className="card-body p-4 p-md-5">
                <h4 className="mb-4 text-danger">Thông tin giao hàng</h4>

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Họ và tên *</label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Số điện thoại *</label>
                      <input type="tel" className="form-control" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Địa chỉ giao hàng *</label>
                    <textarea className="form-control" name="address" rows="3" value={formData.address} onChange={handleChange} required></textarea>
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Ghi chú</label>
                    <textarea className="form-control" name="note" rows="2" value={formData.note} onChange={handleChange}></textarea>
                  </div>

                  <h5 className="mb-3">Phương thức thanh toán</h5>
                  <div className="mb-4 border rounded p-3">
                    <div className="form-check mb-2">
                      <input className="form-check-input" type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === "cod"} onChange={handleChange} id="cod" />
                      <label className="form-check-label" htmlFor="cod">Thanh toán khi nhận hàng (COD)</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="paymentMethod" value="banking" checked={formData.paymentMethod === "banking"} onChange={handleChange} id="banking" />
                      <label className="form-check-label" htmlFor="banking">Chuyển khoản ngân hàng</label>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 justify-content-between">
                    <Link href="/cart" className="btn btn-outline-secondary">Quay lại giỏ hàng</Link>
                    <button type="submit" className="btn btn-danger px-4" disabled={loading || cart.length === 0}>
                      {loading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div style={{ position: "sticky", top: 120, zIndex: 10 }}>
              <div className="card shadow border-0">
                <div className="card-body p-4  ">
                  <h5 className="mb-3 text-danger">Đơn hàng của bạn</h5>

                  <div style={{ maxHeight: 280, overflowY: "auto" }} className="mb-3">
                    {orderItemsPreview.map((item) => (
                      <div key={item.key} className="d-flex align-items-center gap-2 border-bottom pb-2 mb-2">
                        <Image src={getImageUrl(item.image)} alt={item.name} width={48} height={48} className="rounded" unoptimized />
                        <div className="flex-grow-1">
                          <div className="small fw-semibold">{item.name}</div>
                          <div className="small text-muted">SL: {item.quantity}</div>
                        </div>
                        <div className="small fw-bold">{item.amount.toLocaleString("vi-VN")} VNĐ</div>
                      </div>
                    ))}
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span>Tạm tính</span>
                    <span>{subtotal.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Phí giao hàng</span>
                    <span>{shippingFee === 0 ? "MIỄN PHÍ" : `${shippingFee.toLocaleString("vi-VN")} VNĐ`}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="d-flex justify-content-between mb-2 text-danger">
                      <span>Giảm giá ({appliedCoupon.code})</span>
                      <span>-{discountAmount.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                  )}

                  {couponError && <div className="alert alert-warning py-2 small">{couponError}</div>}

                  <hr />

                  <div className="d-flex justify-content-between align-items-center">
                    <strong>Tổng cộng</strong>
                    <strong className="text-danger fs-5">{previewTotal.toLocaleString("vi-VN")} VNĐ</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
