"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "preparing", label: "Đang chuẩn bị" },
  { value: "ready", label: "Sẵn sàng giao" },
  { value: "shipping", label: "Đang giao" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancel_requested", label: "Chờ xác nhận hủy" },
  { value: "cancelled", label: "Đã hủy" }
];

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, processing: 0, cancelled: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ q: "", status: "", startDate: "", endDate: "" });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusValue, setStatusValue] = useState("");

  const canUpdateStatus = useMemo(() => {
    if (!selectedOrder) return false;
    return selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled";
  }, [selectedOrder]);

  const fetchOrders = async (page = 1, nextFilters = filters) => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (nextFilters.q.trim()) params.set("q", nextFilters.q.trim());
      if (nextFilters.status) params.set("status", nextFilters.status);
      if (nextFilters.startDate) params.set("startDate", nextFilters.startDate);
      if (nextFilters.endDate) params.set("endDate", nextFilters.endDate);

      const res = await fetch(`${BACKEND_URL}/api/orders/admin/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Không lấy được danh sách đơn hàng");

      setOrders(data.data || []);
      setStats(data.stats || { total: 0, completed: 0, processing: 0, cancelled: 0 });
      setPagination(data.pagination || { page: 1, pages: 1, total: 0, limit: 10 });
    } catch (fetchError) {
      setError(fetchError.message || "Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/admin/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Không lấy được chi tiết đơn hàng");
      setSelectedOrder(data.data);
      setStatusValue(data.data?.status || "");
    } catch (fetchError) {
      setError(fetchError.message || "Lỗi tải chi tiết đơn hàng");
    }
  };

  const updateStatus = async () => {
    if (!selectedOrder || !statusValue) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({ status: statusValue })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Cập nhật trạng thái thất bại");
      setSelectedOrder(data.data);
      fetchOrders(pagination.page, filters);
    } catch (updateError) {
      setError(updateError.message || "Lỗi cập nhật trạng thái");
    } finally {
      setStatusUpdating(false);
    }
  };

  useEffect(() => {
    if (token) fetchOrders(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (!token || !orderId) return;
    fetchOrderDetail(orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, searchParams]);

  return (
    <div className="container-fluid">
      <h2 className="mb-4 text-danger fw-bold">Quản lý đơn hàng</h2>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-muted">Tổng đơn</div><h3 className="mb-0 text-danger">{stats.total}</h3></div></div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-muted">Hoàn thành</div><h3 className="mb-0 text-success">{stats.completed}</h3></div></div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-muted">Đang xử lý</div><h3 className="mb-0 text-warning">{stats.processing}</h3></div></div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="text-muted">Đã hủy</div><h3 className="mb-0 text-secondary">{stats.cancelled}</h3></div></div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-lg-4">
              <label className="form-label">Tìm theo mã đơn / tên khách / số điện thoại</label>
              <input className="form-control" value={filters.q} onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))} />
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label">Trạng thái</label>
              <select className="form-select" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                {STATUS_OPTIONS.map((opt) => <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label">Từ ngày</label>
              <input type="date" className="form-control" value={filters.startDate} onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label">Đến ngày</label>
              <input type="date" className="form-control" value={filters.endDate} onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))} />
            </div>
            <div className="col-6 col-lg-2 d-flex gap-2">
              <button className="btn btn-danger w-100" onClick={() => fetchOrders(1, filters)}>Lọc</button>
              <button className="btn btn-outline-secondary w-100" onClick={() => { const empty = { q: "", status: "", startDate: "", endDate: "" }; setFilters(empty); fetchOrders(1, empty); }}>Đặt lại</button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th className="text-end">Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4"><div className="spinner-border text-danger"></div></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted">Không có đơn hàng</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.order_id || order._id}</td>
                    <td>
                      <div className="fw-semibold">{order.customer?.name || order.user_id?.name || "Ẩn danh"}</div>
                      <div className="small text-muted">{order.customer?.phone || "-"}</div>
                    </td>
                    <td>{new Date(order.created_at).toLocaleString("vi-VN")}</td>
                    <td className="text-end">{Number(order.total || 0).toLocaleString("vi-VN")} đ</td>
                    <td><span className="badge bg-secondary">{order.status_label || order.status}</span></td>
                    <td><button className="btn btn-sm btn-outline-danger" onClick={() => fetchOrderDetail(order._id)}>Xem chi tiết</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted">Tổng: {pagination.total} đơn hàng</div>
        <div className="btn-group">
          <button className="btn btn-outline-danger" disabled={pagination.page <= 1} onClick={() => fetchOrders(pagination.page - 1, filters)}>Trước</button>
          <button className="btn btn-danger disabled">Trang {pagination.page}/{pagination.pages}</button>
          <button className="btn btn-outline-danger" disabled={pagination.page >= pagination.pages} onClick={() => fetchOrders(pagination.page + 1, filters)}>Sau</button>
        </div>
      </div>

      {selectedOrder && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,.45)" }} onClick={() => setSelectedOrder(null)}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title text-danger">Chi tiết đơn hàng #{selectedOrder.order_id || selectedOrder._id}</h5>
                <button className="btn-close" onClick={() => setSelectedOrder(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-3">
                  <div className="col-md-4"><strong>Khách hàng:</strong> {selectedOrder.customer?.name}</div>
                  <div className="col-md-4"><strong>Số điện thoại:</strong> {selectedOrder.customer?.phone}</div>
                  <div className="col-md-4"><strong>Email:</strong> {selectedOrder.customer?.email || "Không có"}</div>
                  <div className="col-12"><strong>Địa chỉ:</strong> {selectedOrder.customer?.address}</div>
                  <div className="col-md-4"><strong>Trạng thái:</strong> <span className="badge bg-secondary ms-2">{selectedOrder.status_label || selectedOrder.status}</span></div>
                  <div className="col-md-4"><strong>Mã giảm giá:</strong> {selectedOrder.coupon_code || "Không dùng"}</div>
                  <div className="col-md-4"><strong>Ngày đặt:</strong> {new Date(selectedOrder.created_at).toLocaleString("vi-VN")}</div>
                </div>

                {selectedOrder.cancel_request?.reason && (
                  <div className="alert alert-warning">
                    <div><strong>Lý do hủy:</strong> {selectedOrder.cancel_request.reason}</div>
                    <div><strong>Ghi chú:</strong> {selectedOrder.cancel_request.note || "Không có"}</div>
                    <div><strong>Kết quả:</strong> {selectedOrder.cancel_request.result || "Đang chờ xử lý"}</div>
                    <div><strong>Phản hồi:</strong> {selectedOrder.cancel_request.result_note || "Chưa có"}</div>
                  </div>
                )}

                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th className="text-end">Số lượng</th>
                        <th className="text-end">Đơn giá</th>
                        <th className="text-end">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items || []).map((item, idx) => {
                        const unitPrice = Number(item.base_price_cents || 0);
                        const qty = Number(item.quantity || 0);
                        return (
                          <tr key={`${item._id || idx}`}>
                            <td>{item.name}</td>
                            <td className="text-end">{qty}</td>
                            <td className="text-end">{unitPrice.toLocaleString("vi-VN")} đ</td>
                            <td className="text-end">{(unitPrice * qty).toLocaleString("vi-VN")} đ</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan={3} className="text-end">Tạm tính</th>
                        <th className="text-end">{Number(selectedOrder.subtotal || 0).toLocaleString("vi-VN")} đ</th>
                      </tr>
                      <tr>
                        <th colSpan={3} className="text-end">Phí giao hàng</th>
                        <th className="text-end">{Number(selectedOrder.shippingFee || 0).toLocaleString("vi-VN")} đ</th>
                      </tr>
                      <tr>
                        <th colSpan={3} className="text-end">Giảm giá</th>
                        <th className="text-end text-success">- {Number(selectedOrder.discountAmount || 0).toLocaleString("vi-VN")} đ</th>
                      </tr>
                      <tr>
                        <th colSpan={3} className="text-end text-danger">Tổng cộng</th>
                        <th className="text-end text-danger">{Number(selectedOrder.total || 0).toLocaleString("vi-VN")} đ</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="modal-footer d-flex justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <label className="mb-0 fw-semibold">Cập nhật trạng thái:</label>
                  <select className="form-select form-select-sm" style={{ width: 220 }} disabled={!canUpdateStatus || statusUpdating} value={statusValue} onChange={(e) => setStatusValue(e.target.value)}>
                    {STATUS_OPTIONS.filter((s) => s.value).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <button className="btn btn-sm btn-danger" disabled={!canUpdateStatus || statusUpdating || !statusValue} onClick={updateStatus}>
                    {statusUpdating ? "Đang cập nhật..." : "Lưu"}
                  </button>
                </div>
                <button className="btn btn-outline-secondary" onClick={() => setSelectedOrder(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
