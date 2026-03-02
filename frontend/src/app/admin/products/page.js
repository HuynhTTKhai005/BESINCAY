"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const defaultForm = {
  name: "",
  slug: "",
  description: "",
  base_price_cents: 0,
  image_url: "",
  category_id: "",
  is_active: true,
  is_available: true
};

const resolveImage = (src) => {
  const value = String(src || "").trim();
  if (!value) return "/img/placeholder.jpg";
  if (value.startsWith("data:image/")) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return value;
  return "/img/placeholder.jpg";
};

const normalizeDisplayPrice = (rawPrice) => {
  const value = Number(rawPrice || 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1000000 && value % 100 === 0) return Math.round(value / 100);
  return Math.round(value);
};

const formatCurrency = (rawPrice) => `${normalizeDisplayPrice(rawPrice).toLocaleString("vi-VN")} đ`;

export default function AdminProductsPage() {
  const { token, user } = useAuth();
  const roleName = user?.role_id?.name || user?.role?.name || "";
  const isAdmin = roleName === "admin";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, hidden: 0, low_or_out: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 6 });
  const [filters, setFilters] = useState({ q: "", category: "", min_price: "", max_price: "", active: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("create");
  const [currentId, setCurrentId] = useState("");
  const [formData, setFormData] = useState(defaultForm);

  const fetchProducts = async (page = 1, nextFilters = filters) => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: String(page), limit: "6" });
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (String(value).trim()) params.set(key, String(value).trim());
      });

      const response = await fetch(`${BACKEND_URL}/api/products/admin/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải danh sách sản phẩm");
      }

      setProducts(result.data || []);
      setStats(result.stats || { total: 0, active: 0, hidden: 0, low_or_out: 0 });
      setPagination(result.pagination || { page: 1, pages: 1, total: 0, limit: 6 });
    } catch (fetchError) {
      setError(fetchError.message || "Lỗi tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/categories/admin/list?page=1&limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.success) setCategories(result.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchProducts(1, filters);
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openCreate = () => {
    setMode("create");
    setCurrentId("");
    setFormData({ ...defaultForm, category_id: categories[0]?._id || "" });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setMode("edit");
    setCurrentId(product._id);
    setFormData({
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      base_price_cents: normalizeDisplayPrice(product.base_price_cents),
      image_url: product.image_url || "",
      category_id: product.category_id?._id || "",
      is_active: !!product.is_active,
      is_available: !!product.is_available
    });
    setShowModal(true);
  };

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormData((prev) => ({ ...prev, image_url: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const submitForm = async () => {
    try {
      const endpoint = mode === "create"
        ? `${BACKEND_URL}/api/products/admin`
        : `${BACKEND_URL}/api/products/admin/${currentId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const payload = {
        ...formData,
        base_price_cents: normalizeDisplayPrice(formData.base_price_cents)
      };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể lưu sản phẩm");
      }

      setShowModal(false);
      fetchProducts(pagination.page, filters);
    } catch (submitError) {
      setError(submitError.message || "Lỗi lưu sản phẩm");
    }
  };

  const toggleActive = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products/admin/${id}/toggle-active`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể cập nhật trạng thái");
      fetchProducts(pagination.page, filters);
    } catch (submitError) {
      setError(submitError.message || "Lỗi cập nhật trạng thái");
    }
  };

  const removeProduct = async (id) => {
    if (!window.confirm("Xác nhận xóa sản phẩm này?")) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/products/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể xóa sản phẩm");
      fetchProducts(pagination.page, filters);
    } catch (submitError) {
      setError(submitError.message || "Lỗi xóa sản phẩm");
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="text-danger fw-bold mb-0">Quản lý sản phẩm</h2>
        <div className="d-flex gap-2">
          {isAdmin && <Link href="/admin/inventory" className="btn btn-outline-danger">Hàng tồn</Link>}
          {isAdmin && <button className="btn btn-danger" onClick={openCreate}>Thêm sản phẩm</button>}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <div className="card border-danger border-2 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted">Tổng sản phẩm</div>
              <h4 className="text-danger mb-0 fw-bold">{stats.total}</h4>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-success border-2 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted">Đang bán</div>
              <h4 className="text-success mb-0 fw-bold">{stats.active}</h4>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-secondary border-2 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted">Ngừng bán</div>
              <h4 className="text-secondary mb-0 fw-bold">{stats.hidden}</h4>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-warning border-2 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted">Hết/Sắp hết</div>
              <h4 className="text-warning mb-0 fw-bold">{stats.low_or_out}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-lg-4">
              <label className="form-label">Tìm theo tên hoặc slug</label>
              <input
                className="form-control"
                value={filters.q}
                onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              />
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label">Danh mục</label>
              <select
                className="form-select"
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="">Tất cả</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label">Trạng thái</label>
              <select
                className="form-select"
                value={filters.active}
                onChange={(e) => setFilters((prev) => ({ ...prev, active: e.target.value }))}
              >
                <option value="">Tất cả</option>
                <option value="true">Đang bán</option>
                <option value="false">Ngừng bán</option>
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label">Giá từ</label>
              <input
                type="number"
                min={0}
                className="form-control"
                value={filters.min_price}
                onChange={(e) => setFilters((prev) => ({ ...prev, min_price: e.target.value }))}
              />
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label">Giá đến</label>
              <input
                type="number"
                min={0}
                className="form-control"
                value={filters.max_price}
                onChange={(e) => setFilters((prev) => ({ ...prev, max_price: e.target.value }))}
              />
            </div>
            <div className="col-12 d-flex gap-2">
              <button className="btn btn-danger" onClick={() => fetchProducts(1, filters)}>Lọc</button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  const empty = { q: "", category: "", min_price: "", max_price: "", active: "" };
                  setFilters(empty);
                  fetchProducts(1, empty);
                }}
              >
                Đặt lại
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 80 }}>Ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th className="text-end">Giá</th>
                <th className="text-end">Tồn</th>
                <th>Trạng thái</th>
                <th className="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4"><div className="spinner-border text-danger" /></td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">Không có sản phẩm</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <Image
                        src={resolveImage(product.image_url)}
                        alt={product.name}
                        width={52}
                        height={52}
                        unoptimized
                        style={{ borderRadius: 8, objectFit: "cover" }}
                      />
                    </td>
                    <td className="fw-semibold">{product.name}</td>
                    <td>{product.category_id?.name || "Không rõ"}</td>
                    <td className="text-end">{formatCurrency(product.base_price_cents)}</td>
                    <td className="text-end">{Number(product.stock_quantity || 0)}</td>
                    <td>
                      {product.is_active
                        ? <span className="badge bg-success">Đang bán</span>
                        : <span className="badge bg-secondary">Ngừng bán</span>}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2 flex-wrap justify-content-end">
                        {isAdmin && <button className="btn btn-sm btn-outline-warning" onClick={() => openEdit(product)}>Sửa</button>}
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleActive(product._id)}>
                          {product.is_active ? "Tắt" : "Bật"}
                        </button>
                        {isAdmin && <button className="btn btn-sm btn-outline-danger" onClick={() => removeProduct(product._id)}>Xóa</button>}
                      </div>
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
          <button className="btn btn-outline-danger" disabled={pagination.page <= 1} onClick={() => fetchProducts(pagination.page - 1, filters)}>Trước</button>
          <button className="btn btn-danger disabled">Trang {pagination.page}/{pagination.pages}</button>
          <button className="btn btn-outline-danger" disabled={pagination.page >= pagination.pages} onClick={() => fetchProducts(pagination.page + 1, filters)}>Sau</button>
        </div>
      </div>

      {showModal && isAdmin && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }} onClick={() => setShowModal(false)}>
          <div className="modal-dialog modal-lg" onClick={(event) => event.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger fw-bold">{mode === "create" ? "Thêm sản phẩm" : "Sửa sản phẩm"}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="form-label">Tên sản phẩm</label>
                    <input className="form-control" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Slug</label>
                    <input className="form-control" value={formData.slug} onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Giá (VND)</label>
                    <input
                      type="number"
                      min={0}
                      className="form-control"
                      value={formData.base_price_cents}
                      onChange={(e) => setFormData((prev) => ({ ...prev, base_price_cents: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Danh mục</label>
                    <select className="form-select" value={formData.category_id} onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}>
                      <option value="">Chọn danh mục</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Ảnh URL</label>
                    <input className="form-control" value={formData.image_url} onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Chọn ảnh từ máy</label>
                    <input type="file" className="form-control" accept="image/*" onChange={handleImage} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Mô tả</label>
                    <textarea rows={3} className="form-control" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button className="btn btn-danger" onClick={submitForm}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
