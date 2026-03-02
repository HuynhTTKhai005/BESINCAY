"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const initialFilters = { q: "", stock_status: "", category: "" };
const initialHistoryFilters = { q: "", startDate: "", endDate: "" };

export default function AdminInventoryPage() {
  const { token } = useAuth();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 6 });
  const [filters, setFilters] = useState(initialFilters);

  const [history, setHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, pages: 1, total: 0, limit: 6 });
  const [historyFilters, setHistoryFilters] = useState(initialHistoryFilters);

  const [error, setError] = useState("");

  const [showStockInModal, setShowStockInModal] = useState(false);
  const [stockInForm, setStockInForm] = useState({ id: "", quantity: 1, source: "", note: "" });

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    id: "",
    stock_quantity: 0,
    reason: "Điều chỉnh tồn kho",
    note: ""
  });

  const fetchInventory = async (page = 1, nextFilters = filters) => {
    if (!token) return;

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
        throw new Error(result.message || "Không thể tải danh sách tồn kho");
      }

      setProducts(result.data || []);
      setPagination(result.pagination || { page: 1, pages: 1, total: 0, limit: 6 });
    } catch (fetchError) {
      setError(fetchError.message || "Lỗi tải tồn kho");
    }
  };

  const fetchHistory = async (page = 1, nextFilters = historyFilters) => {
    if (!token) return;

    try {
      const params = new URLSearchParams({ page: String(page), limit: "6" });
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (String(value).trim()) params.set(key, String(value).trim());
      });

      const response = await fetch(`${BACKEND_URL}/api/products/admin/stock-history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải lịch sử nhập hàng");
      }

      setHistory(result.data || []);
      setHistoryPagination(result.pagination || { page: 1, pages: 1, total: 0, limit: 6 });
    } catch (fetchError) {
      setError(fetchError.message || "Lỗi tải lịch sử nhập hàng");
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchInventory(1, filters);
    fetchHistory(1, historyFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openStockIn = (productId) => {
    setStockInForm({ id: productId, quantity: 1, source: "", note: "" });
    setShowStockInModal(true);
  };

  const openAdjustStock = (product) => {
    setAdjustForm({
      id: product._id,
      stock_quantity: Number(product.stock_quantity || 0),
      reason: "Điều chỉnh tồn kho",
      note: ""
    });
    setShowAdjustModal(true);
  };

  const submitStockIn = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products/admin/${stockInForm.id}/stock-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: Number(stockInForm.quantity || 0),
          source: stockInForm.source,
          note: stockInForm.note
        })
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể nhập hàng");
      }

      setShowStockInModal(false);
      fetchInventory(pagination.page, filters);
      fetchHistory(1, historyFilters);
    } catch (submitError) {
      setError(submitError.message || "Lỗi nhập hàng");
    }
  };

  const submitAdjustStock = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products/admin/${adjustForm.id}/stock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          stock_quantity: Number(adjustForm.stock_quantity || 0),
          reason: adjustForm.reason,
          note: adjustForm.note
        })
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể cập nhật tồn kho");
      }

      setShowAdjustModal(false);
      fetchInventory(pagination.page, filters);
      fetchHistory(1, historyFilters);
    } catch (submitError) {
      setError(submitError.message || "Lỗi cập nhật tồn kho");
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="text-danger fw-bold mb-0">Hàng tồn</h2>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-header bg-white fw-semibold text-danger">Danh sách tồn kho</div>
        <div className="card-body">
          <div className="row g-2 align-items-end mb-3">
            <div className="col-12 col-lg-4">
              <label className="form-label">Tìm theo tên/slug</label>
              <input
                className="form-control"
                value={filters.q}
                onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              />
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label">Mức tồn</label>
              <select
                className="form-select"
                value={filters.stock_status}
                onChange={(e) => setFilters((prev) => ({ ...prev, stock_status: e.target.value }))}
              >
                <option value="">Tất cả</option>
                <option value="in">Còn hàng (từ 10)</option>
                <option value="low">Sắp hết (dưới 10)</option>
                <option value="out">Hết hàng</option>
              </select>
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label">Danh mục (ID)</label>
              <input
                className="form-control"
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Tùy chọn"
              />
            </div>
            <div className="col-12 col-lg-2 d-flex gap-2">
              <button className="btn btn-danger w-100" onClick={() => fetchInventory(1, filters)}>Lọc</button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th className="text-end">Tồn thực tế</th>
                  <th>Trạng thái kho</th>
                  <th className="text-end">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">Không có dữ liệu tồn kho</td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const stock = Number(product.stock ?? product.stock_quantity ?? 0);
                    return (
                      <tr key={product._id}>
                        <td className="fw-semibold">{product.name}</td>
                        <td>{product.category_id?.name || "Không rõ"}</td>
                        <td className="text-end">{stock}</td>
                        <td>
                          {stock <= 0 ? (
                            <span className="badge bg-danger">Hết hàng</span>
                          ) : stock < 10 ? (
                            <span className="badge bg-warning text-dark">Sắp hết</span>
                          ) : (
                            <span className="badge bg-success">Còn hàng</span>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            <button className="btn btn-sm btn-outline-warning" onClick={() => openAdjustStock(product)}>Chỉnh sửa tồn</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => openStockIn(product._id)}>Nhập hàng</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <div className="btn-group">
              <button
                className="btn btn-outline-danger"
                disabled={pagination.page <= 1}
                onClick={() => fetchInventory(pagination.page - 1, filters)}
              >
                Trước
              </button>
              <button className="btn btn-danger disabled">Trang {pagination.page}/{pagination.pages}</button>
              <button
                className="btn btn-outline-danger"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchInventory(pagination.page + 1, filters)}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white fw-semibold text-danger">Lịch sử nhập hàng</div>
        <div className="card-body">
          <div className="row g-2 align-items-end mb-3">
            <div className="col-12 col-lg-4">
              <label className="form-label">Tìm theo tên sản phẩm/nguồn nhập</label>
              <input
                className="form-control"
                value={historyFilters.q}
                onChange={(e) => setHistoryFilters((prev) => ({ ...prev, q: e.target.value }))}
              />
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label">Từ ngày</label>
              <input
                type="date"
                className="form-control"
                value={historyFilters.startDate}
                onChange={(e) => setHistoryFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label">Đến ngày</label>
              <input
                type="date"
                className="form-control"
                value={historyFilters.endDate}
                onChange={(e) => setHistoryFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="col-12 col-lg-2">
              <button className="btn btn-danger w-100" onClick={() => fetchHistory(1, historyFilters)}>Lọc</button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Tên sản phẩm</th>
                  <th className="text-end">Số lượng</th>
                  <th>Nguồn nhập</th>
                  <th>Ghi chú</th>
                  <th>Ngày nhập</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">Chưa có lịch sử nhập hàng</td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item._id}>
                      <td>{item.product_name}</td>
                      <td className="text-end">{Number(item.quantity_in || 0)}</td>
                      <td>{item.source || "-"}</td>
                      <td>{item.note || "-"}</td>
                      <td>{new Date(item.created_at).toLocaleString("vi-VN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <div className="btn-group">
              <button
                className="btn btn-outline-danger"
                disabled={historyPagination.page <= 1}
                onClick={() => fetchHistory(historyPagination.page - 1, historyFilters)}
              >
                Trước
              </button>
              <button className="btn btn-danger disabled">Trang {historyPagination.page}/{historyPagination.pages}</button>
              <button
                className="btn btn-outline-danger"
                disabled={historyPagination.page >= historyPagination.pages}
                onClick={() => fetchHistory(historyPagination.page + 1, historyFilters)}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {showStockInModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }} onClick={() => setShowStockInModal(false)}>
          <div className="modal-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">Nhập hàng</h5>
                <button className="btn-close" onClick={() => setShowStockInModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Số lượng nhập</label>
                  <input
                    type="number"
                    className="form-control"
                    value={stockInForm.quantity}
                    onChange={(e) => setStockInForm((prev) => ({ ...prev, quantity: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Nguồn nhập</label>
                  <input className="form-control" value={stockInForm.source} onChange={(e) => setStockInForm((prev) => ({ ...prev, source: e.target.value }))} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Ghi chú</label>
                  <textarea className="form-control" rows={3} value={stockInForm.note} onChange={(e) => setStockInForm((prev) => ({ ...prev, note: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowStockInModal(false)}>Hủy</button>
                <button className="btn btn-danger" onClick={submitStockIn}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdjustModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }} onClick={() => setShowAdjustModal(false)}>
          <div className="modal-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">Chỉnh sửa tồn kho</h5>
                <button className="btn-close" onClick={() => setShowAdjustModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Tồn thực tế mới</label>
                  <input
                    type="number"
                    className="form-control"
                    value={adjustForm.stock_quantity}
                    onChange={(e) => setAdjustForm((prev) => ({ ...prev, stock_quantity: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Lý do</label>
                  <input className="form-control" value={adjustForm.reason} onChange={(e) => setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Ghi chú</label>
                  <textarea className="form-control" rows={3} value={adjustForm.note} onChange={(e) => setAdjustForm((prev) => ({ ...prev, note: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>Hủy</button>
                <button className="btn btn-danger" onClick={submitAdjustStock}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}