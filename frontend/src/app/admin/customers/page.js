"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function AdminCustomersPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0, new_customers: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [filters, setFilters] = useState({ q: "", active: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

  const fetchCustomers = async (page = 1, nextFilters = filters) => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (nextFilters.q.trim()) params.set("q", nextFilters.q.trim());
      if (nextFilters.active) params.set("active", nextFilters.active);
      const response = await fetch(`${BACKEND_URL}/api/users/admin/customers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không tải được danh sách khách hàng");
      setItems(result.data || []);
      setStats(result.stats || { total: 0, active: 0, blocked: 0, new_customers: 0 });
      setPagination(result.pagination || { page: 1, pages: 1, total: 0, limit: 10 });
    } catch (fetchError) {
      setError(fetchError.message || "Lỗi tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCustomers(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openDetail = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/admin/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không tải được chi tiết khách hàng");
      setDetail(result.data);
    } catch (detailError) {
      setError(detailError.message || "Lỗi tải chi tiết khách hàng");
    }
  };

  const blockCustomer = async (customer) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/admin/${customer._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !customer.is_active })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể cập nhật trạng thái khách hàng");
      fetchCustomers(pagination.page, filters);
    } catch (actionError) {
      setError(actionError.message || "Lỗi cập nhật trạng thái khách hàng");
    }
  };

  return (
    <div className="container-fluid">
      <h2 className="mb-4 text-danger">Quản lý khách hàng</h2>

      <div className="row g-3 mb-4">
        <div className="col-md-3"><div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted">Tổng khách hàng</div><h4 className="text-danger mb-0">{stats.total}</h4></div></div></div>
        <div className="col-md-3"><div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted">Đang hoạt động</div><h4 className="text-success mb-0">{stats.active}</h4></div></div></div>
        <div className="col-md-3"><div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted">Bị khóa</div><h4 className="text-secondary mb-0">{stats.blocked}</h4></div></div></div>
        <div className="col-md-3"><div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted">Khách mới tháng này</div><h4 className="text-warning mb-0">{stats.new_customers}</h4></div></div></div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-lg-6">
              <label className="form-label">Tìm theo mã, tên, email, số điện thoại</label>
              <input className="form-control" value={filters.q} onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))} />
            </div>
            <div className="col-lg-3">
              <label className="form-label">Trạng thái</label>
              <select className="form-select" value={filters.active} onChange={(e) => setFilters((p) => ({ ...p, active: e.target.value }))}>
                <option value="">Tất cả</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã khóa</option>
              </select>
            </div>
            <div className="col-lg-3 d-flex gap-2">
              <button className="btn btn-danger w-100" onClick={() => fetchCustomers(1, filters)}>Lọc</button>
              <button className="btn btn-outline-secondary w-100" onClick={() => { const empty = { q: "", active: "" }; setFilters(empty); fetchCustomers(1, empty); }}>Đặt lại</button>
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
                <th>Mã</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Đang tải...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4">Không có khách hàng</td></tr>
              ) : (
                items.map((customer) => (
                  <tr key={customer._id}>
                    <td>{customer._id.slice(-8).toUpperCase()}</td>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone || "-"}</td>
                    <td>{customer.is_active ? <span className="badge bg-success">Hoạt động</span> : <span className="badge bg-secondary">Bị khóa</span>}</td>
                    <td>{new Date(customer.created_at).toLocaleString("vi-VN")}</td>
                    <td className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => openDetail(customer._id)}>Xem chi tiết</button>
                      <button className="btn btn-sm btn-outline-warning" onClick={() => blockCustomer(customer)}>{customer.is_active ? "Khóa" : "Mở khóa"}</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex justify-content-end mt-3">
        <div className="btn-group">
          <button className="btn btn-outline-danger" disabled={pagination.page <= 1} onClick={() => fetchCustomers(pagination.page - 1, filters)}>Trước</button>
          <button className="btn btn-danger disabled">Trang {pagination.page}/{pagination.pages}</button>
          <button className="btn btn-outline-danger" disabled={pagination.page >= pagination.pages} onClick={() => fetchCustomers(pagination.page + 1, filters)}>Sau</button>
        </div>
      </div>

      {detail && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setDetail(null)}>
          <div className="modal-dialog modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">Chi tiết khách hàng</h5>
                <button className="btn-close" onClick={() => setDetail(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-2 mb-3">
                  <div className="col-md-3"><strong>Họ tên:</strong> {detail.customer?.name}</div>
                  <div className="col-md-3"><strong>Email:</strong> {detail.customer?.email}</div>
                  <div className="col-md-3"><strong>SĐT:</strong> {detail.customer?.phone || "-"}</div>
                  <div className="col-md-3"><strong>Tổng chi tiêu:</strong> {Number(detail.total_spent || 0).toLocaleString("vi-VN")} đ</div>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm table-striped align-middle">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Ngày đặt</th>
                        <th>Trạng thái</th>
                        <th className="text-end">Tổng tiền</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.orders || []).map((order) => (
                        <tr key={order._id}>
                          <td>{order.order_id || order._id}</td>
                          <td>{new Date(order.created_at).toLocaleString("vi-VN")}</td>
                          <td>{order.status}</td>
                          <td className="text-end">{Number(order.total || 0).toLocaleString("vi-VN")} đ</td>
                          <td><Link href={`/admin/orders?orderId=${order._id}`} className="btn btn-sm btn-outline-danger">Xem thêm</Link></td>
                        </tr>
                      ))}
                      {(detail.orders || []).length === 0 && <tr><td colSpan={5} className="text-center py-3">Khách hàng chưa có đơn hàng</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

