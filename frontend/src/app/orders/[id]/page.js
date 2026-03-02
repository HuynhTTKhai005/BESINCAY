"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

const CANCEL_REASONS = [
  "Đổi ý, không muốn mua nữa",
  "Muốn đổi địa chỉ/điện thoại nhận hàng",
  "Đặt nhầm món hoặc số lượng",
  "Thời gian giao hàng không phù hợp",
  "Lý do khác"
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelError, setCancelError] = useState("");

  const fetchOrderDetail = useCallback(async () => {
    if (!user || !token || !id) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Không thể tải chi tiết đơn hàng");
      }

      setOrder(result.data);
    } catch (fetchError) {
      setError(fetchError.message || "Không thể tải chi tiết đơn hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [id, token, user]);

  useEffect(() => {
    if (!user || !token) {
      router.push("/login");
      return;
    }
    fetchOrderDetail();
  }, [fetchOrderDetail, router, token, user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <span className="badge bg-success">Hoàn thành</span>;
      case "pending":
        return <span className="badge bg-warning text-dark">Đang xử lý</span>;
      case "confirmed":
        return <span className="badge bg-info text-dark">Đã xác nhận</span>;
      case "preparing":
        return <span className="badge bg-primary">Đang chuẩn bị</span>;
      case "ready":
        return <span className="badge bg-success">Sẵn sàng</span>;
      case "shipping":
        return <span className="badge bg-info">Đang giao</span>;
      case "cancel_requested":
        return <span className="badge bg-secondary">Chờ xác nhận hủy</span>;
      case "cancelled":
        return <span className="badge bg-danger">Đã hủy</span>;
      default:
        return <span className="badge bg-secondary">Không xác định</span>;
    }
  };

  const getImageUrl = (url) => {
    if (!url) return "/img/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleSubmitCancelRequest = async () => {
    if (!cancelReason) {
      setCancelError("Vui lòng chọn lý do hủy đơn.");
      return;
    }

    setCancelSubmitting(true);
    setCancelError("");
    setCancelMessage("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${id}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({
          reason: cancelReason,
          note: cancelNote
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Không thể gửi yêu cầu hủy đơn.");
      }

      setCancelMessage("Đã gửi yêu cầu hủy đơn. Vui lòng chờ xác nhận.");
      setShowCancelForm(false);
      setCancelReason("");
      setCancelNote("");
      await fetchOrderDetail();
    } catch (submitError) {
      setCancelError(submitError.message || "Có lỗi xảy ra khi gửi yêu cầu hủy đơn.");
    } finally {
      setCancelSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="order-detail section">
        <div className="container text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-3">Đang tải chi tiết đơn hàng...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="order-detail section">
        <div className="container">
          <div className="alert alert-danger text-center">{error}</div>
          <div className="text-center">
            <Link href="/orders" className="btn btn-outline-danger">Quay lại danh sách đơn hàng</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="order-detail section">
        <div className="container text-center">
          <h3>Không tìm thấy đơn hàng</h3>
          <Link href="/orders" className="btn btn-outline-danger mt-3">Quay lại danh sách đơn hàng</Link>
        </div>
      </section>
    );
  }

  const canRequestCancel = ["pending", "confirmed"].includes(order.status);
  const isCancelPending = order.status === "cancel_requested";
  const cancelResult = order?.cancel_request?.result;
  const showPendingCancelAlert = isCancelPending && !cancelMessage;

  return (
    <section className="order-detail section">
      <div className="container section-title" data-aos="fade-up">
        <p><span className="description-title">CHI TIẾT ĐƠN HÀNG</span></p>
        <h2>Đơn hàng #{order.order_id || order._id}</h2>
      </div>

      <div className="container">
        {cancelMessage && <div className="alert alert-success">{cancelMessage}</div>}
        {cancelError && <div className="alert alert-danger">{cancelError}</div>}

        {showPendingCancelAlert && (
          <div className="alert alert-warning">
            Đơn hàng đang ở trạng thái chờ xác nhận hủy. Chúng tôi sẽ phản hồi sớm.
          </div>
        )}

        {cancelResult === "approved" && (
          <div className="alert alert-success">
            Yêu cầu hủy đơn đã được chấp nhận.
            {order?.cancel_request?.result_note ? ` ${order.cancel_request.result_note}` : ""}
          </div>
        )}

        {cancelResult === "rejected" && (
          <div className="alert alert-danger">
            Yêu cầu hủy đơn đã bị từ chối.
            {order?.cancel_request?.result_note ? ` ${order.cancel_request.result_note}` : ""}
          </div>
        )}

        <div className="row">
          <div className="col-lg-8">
            <div className="card shadow mb-4">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">Thông tin đơn hàng</h5>
                  <small className="text-muted">{new Date(order.created_at).toLocaleString("vi-VN")}</small>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="card-body">
                {order.items.map((item, index) => (
                  <div key={item._id || index} className="d-flex align-items-center border-bottom py-3">
                    <div className="me-3">
                      <img
                        src={getImageUrl(item.image_url)}
                        alt={item.name}
                        className="rounded"
                        style={{ width: 80, height: 80, objectFit: "cover" }}
                      />
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{item.name}</h6>
                      <p className="text-muted small mb-1">{item.description}</p>
                      <span className="small text-muted">SL: {item.quantity}</span>
                    </div>
                    <div className="text-end">
                      <strong className="text-danger">
                        {(item.base_price_cents * item.quantity).toLocaleString("vi-VN")} VNĐ
                      </strong>
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-3 border-top">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tạm tính:</span>
                    <span>{order.subtotal.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Phí giao hàng:</span>
                    <span>{order.shippingFee.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <strong>Tổng cộng:</strong>
                    <strong className="text-danger">{order.total.toLocaleString("vi-VN")} VNĐ</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">Thao tác</h5>
              </div>
              <div className="card-body d-grid gap-2">
                <Link href="/orders" className="btn btn-outline-danger">
                  Quay lại danh sách đơn hàng
                </Link>

                {canRequestCancel && !showCancelForm && (
                  <button className="btn btn-danger" onClick={() => setShowCancelForm(true)}>
                    Hủy đơn hàng
                  </button>
                )}

                {showCancelForm && (
                  <div className="border rounded p-3">
                    <label className="form-label fw-semibold">Lý do hủy đơn</label>
                    <select
                      className="form-select mb-2"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    >
                      <option value="">Chọn lý do</option>
                      {CANCEL_REASONS.map((reason) => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>

                    <textarea
                      className="form-control mb-2"
                      rows={3}
                      placeholder="Ghi chú thêm (nếu có)"
                      value={cancelNote}
                      onChange={(e) => setCancelNote(e.target.value)}
                    />

                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={handleSubmitCancelRequest}
                        disabled={cancelSubmitting}
                      >
                        {cancelSubmitting ? "Đang gửi..." : "Gửi yêu cầu hủy"}
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => {
                          setShowCancelForm(false);
                          setCancelReason("");
                          setCancelNote("");
                        }}
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                )}

                {isCancelPending && (
                  <button className="btn btn-outline-secondary" disabled>
                    Đang chờ xác nhận hủy
                  </button>
                )}

                <button className="btn btn-outline-info">Liên hệ hỗ trợ</button>
              </div>
            </div>

            <div className="card shadow">
              <div className="card-header bg-light">
                <h5 className="mb-0">Theo dõi hủy đơn</h5>
              </div>
              <div className="card-body">
                <p className="mb-1"><strong>Lý do:</strong> {order?.cancel_request?.reason || "Chưa có"}</p>
                <p className="mb-1"><strong>Ghi chú:</strong> {order?.cancel_request?.note || "Không có"}</p>
                <p className="mb-1"><strong>Kết quả:</strong> {order?.cancel_request?.result || "Chưa có"}</p>
                <p className="mb-0">
                  <strong>Phản hồi:</strong> {order?.cancel_request?.result_note || "Đang chờ xử lý"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}