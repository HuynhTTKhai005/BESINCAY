"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const initialForm = { name: "", slug: "", is_active: true };

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [filters, setFilters] = useState({ q: "", active: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);

  const fetchCategories = async (page = 1, nextFilters = filters) => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (nextFilters.q.trim()) params.set("q", nextFilters.q.trim());
      if (nextFilters.active) params.set("active", nextFilters.active);

      const response = await fetch(`${BACKEND_URL}/api/categories/admin/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể tải danh mục");

      setItems(result.data || []);
      setPagination(result.pagination || { page: 1, pages: 1, total: 0, limit: 10 });
    } catch (fetchError) {
      setError(fetchError.message || "Lỗi tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchCategories(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const createCategory = async () => {
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        is_active: form.is_active
      };

      const response = await fetch(`${BACKEND_URL}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể thêm danh mục");

      setForm(initialForm);
      fetchCategories(1, filters);
    } catch (submitError) {
      setError(submitError.message || "Lỗi thêm danh mục");
    }
  };

  const updateCategory = async () => {
    if (!editing) return;

    try {
      const payload = {
        name: editing.name,
        slug: editing.slug,
        is_active: !!editing.is_active
      };

      const response = await fetch(`${BACKEND_URL}/api/categories/${editing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể cập nhật danh mục");

      setEditing(null);
      fetchCategories(pagination.page, filters);
    } catch (submitError) {
      setError(submitError.message || "Lỗi cập nhật danh mục");
    }
  };

  const removeCategory = async (id) => {
    if (!window.confirm("Xác nhận xóa danh mục này?")) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể xóa danh mục");
      fetchCategories(pagination.page, filters);
    } catch (submitError) {
      setError(submitError.message || "Lỗi xóa danh mục");
    }
  };

  return (
    <div className="container-fluid">
      <h2 className="text-danger fw-bold mb-3">Quản lý danh mục</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-lg-5">
              <label className="form-label">Tìm theo tên/slug</label>
              <input className="form-control" value={filters.q} onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))} />
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label">Trạng thái</label>
              <select className="form-select" value={filters.active} onChange={(e) => setFilters((prev) => ({ ...prev, active: e.target.value }))}>
                <option value="">Tất cả</option>
                <option value="true">Hiển thị</option>
                <option value="false">Ẩn</option>
              </select>
            </div>
            <div className="col-6 col-lg-4 d-flex gap-2">
              <button className="btn btn-danger w-100" onClick={() => fetchCategories(1, filters)}>Lọc</button>
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  const empty = { q: "", active: "" };
                  setFilters(empty);
                  fetchCategories(1, empty);
                }}
              >
                Đặt lại
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-header bg-white fw-semibold text-danger">Thêm danh mục</div>
        <div className="card-body">
          <div className="row g-2">
            <div className="col-lg-5">
              <label className="form-label">Tên danh mục</label>
              <input className="form-control" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="col-lg-4">
              <label className="form-label">Slug</label>
              <input className="form-control" value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} />
            </div>
            <div className="col-lg-3">
              <label className="form-label">Trạng thái</label>
              <select className="form-select" value={String(form.is_active)} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))}>
                <option value="true">Hiển thị</option>
                <option value="false">Ẩn</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-danger" onClick={createCategory}>Thêm danh mục</button>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Tên</th>
                <th>Slug</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th className="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4"><div className="spinner-border text-danger" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4">Không có danh mục</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id}>
                    <td className="fw-semibold">{item.name}</td>
                    <td>{item.slug}</td>
                    <td>{item.is_active ? <span className="badge bg-success">Hiển thị</span> : <span className="badge bg-secondary">Ẩn</span>}</td>
                    <td>{new Date(item.created_at).toLocaleString("vi-VN")}</td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button className="btn btn-sm btn-outline-warning" onClick={() => setEditing(item)}>Sửa</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeCategory(item._id)}>Xóa</button>
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
          <button className="btn btn-outline-danger" disabled={pagination.page <= 1} onClick={() => fetchCategories(pagination.page - 1, filters)}>Trước</button>
          <button className="btn btn-danger disabled">Trang {pagination.page}/{pagination.pages}</button>
          <button className="btn btn-outline-danger" disabled={pagination.page >= pagination.pages} onClick={() => fetchCategories(pagination.page + 1, filters)}>Sau</button>
        </div>
      </div>

      {editing && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.45)" }} onClick={() => setEditing(null)}>
          <div className="modal-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">Sửa danh mục</h5>
                <button className="btn-close" onClick={() => setEditing(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Tên</label>
                  <input className="form-control" value={editing.name || ""} onChange={(e) => setEditing((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Slug</label>
                  <input className="form-control" value={editing.slug || ""} onChange={(e) => setEditing((prev) => ({ ...prev, slug: e.target.value }))} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Trạng thái</label>
                  <select className="form-select" value={String(!!editing.is_active)} onChange={(e) => setEditing((prev) => ({ ...prev, is_active: e.target.value === "true" }))}>
                    <option value="true">Hiển thị</option>
                    <option value="false">Ẩn</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditing(null)}>Hủy</button>
                <button className="btn btn-danger" onClick={updateCategory}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}