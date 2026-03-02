"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${BACKEND_URL}/api/orders/admin/stats/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message || "Không lấy được dữ liệu dashboard");
        setData(result.data);
      } catch (fetchError) {
        setError(fetchError.message || "Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-danger" /></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const kpis = data?.kpis || {};
  const recentOrders = data?.recent_orders || [];
  const newCustomers = data?.new_customers || [];
  const newestProducts = data?.newest_products || [];

  return (
    <div className="container-fluid">
      <h2 className="mb-4 text-danger fw-bold">Dashboard tổng quan</h2>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Tổng đơn hàng</div>
              <h4 className="text-danger mb-0">{kpis.total_orders || 0}</h4>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Đơn hôm nay</div>
              <h4 className="text-warning mb-0">{kpis.today_orders || 0}</h4>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Doanh thu hôm nay</div>
              <h6 className="text-success mb-0">{Number(kpis.today_revenue || 0).toLocaleString("vi-VN")} đ</h6>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Doanh thu tháng</div>
              <h6 className="text-success mb-0">{Number(kpis.month_revenue || 0).toLocaleString("vi-VN")} đ</h6>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Sản phẩm đang bán</div>
              <h4 className="text-primary mb-0">{kpis.active_products || 0}</h4>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Khách hoạt động</div>
              <h4 className="text-info mb-0">{kpis.active_customers || 0}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <strong>Đơn hàng gần đây</strong>
              <Link href="/admin/orders" className="btn btn-sm btn-outline-danger">Xem thêm</Link>
            </div>
            <div className="card-body" style={{ maxHeight: 430, overflowY: "auto" }}>
              {recentOrders.length === 0 && <div className="text-muted">Chưa có dữ liệu</div>}
              {recentOrders.map((order) => (
                <div key={order._id} className="border-bottom py-2">
                  <div className="fw-semibold">{order.order_id || order._id}</div>
                  <div className="small text-muted">{order.customer?.name || "Ẩn danh"}</div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="badge bg-secondary">{order.status_label || order.status}</span>
                    <span className="text-danger fw-semibold small">{Number(order.total || 0).toLocaleString("vi-VN")} đ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <strong>Khách hàng mới</strong>
              <Link href="/admin/customers" className="btn btn-sm btn-outline-danger">Xem thêm</Link>
            </div>
            <div className="card-body" style={{ maxHeight: 430, overflowY: "auto" }}>
              {newCustomers.length === 0 && <div className="text-muted">Chưa có dữ liệu</div>}
              {newCustomers.map((customer) => (
                <div key={customer._id} className="border-bottom py-2">
                  <div className="fw-semibold">{customer.name}</div>
                  <div className="small text-muted">{customer.email}</div>
                  <div className="small text-muted">{new Date(customer.created_at).toLocaleString("vi-VN")}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <strong>Sản phẩm mới thêm</strong>
              <Link href="/admin/products" className="btn btn-sm btn-outline-danger">Xem thêm</Link>
            </div>
            <div className="card-body" style={{ maxHeight: 430, overflowY: "auto" }}>
              {newestProducts.length === 0 && <div className="text-muted">Chưa có dữ liệu</div>}
              {newestProducts.map((product) => (
                <div key={product._id} className="border-bottom py-2">
                  <div className="fw-semibold">{product.name}</div>
                  <div className="small text-muted">Giá: {Number(product.base_price_cents || 0).toLocaleString("vi-VN")} đ</div>
                  <div className="small text-muted">Tồn kho: {Number(product.stock ?? product.stock_quantity ?? 0)}</div>
                  <div className="small">
                    <span className={`badge ${product.is_active ? "bg-success" : "bg-secondary"}`}>
                      {product.is_active ? "Đang bán" : "Ngừng bán"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}