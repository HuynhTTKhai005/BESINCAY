"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const INITIAL_FILTERS = {
  search: "",
  role: "",
  active: ""
};

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0, staff: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role_id: "",
    default_shipping_address: ""
  });

  const [editingUser, setEditingUser] = useState(null);
  const [staffActivities, setStaffActivities] = useState([]);
  const [staffPagination, setStaffPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [staffKeyword, setStaffKeyword] = useState("");
  const [staffDetail, setStaffDetail] = useState(null);

  const fetchUsers = async (page = 1, nextFilters = filters) => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (nextFilters.search.trim()) params.set("search", nextFilters.search.trim());
      if (nextFilters.role) params.set("role", nextFilters.role);
      if (nextFilters.active) params.set("active", nextFilters.active);

      const response = await fetch(`${BACKEND_URL}/api/users/admin/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải danh sách người dùng");
      }

      setUsers(result.data?.users || []);
      setRoles(result.data?.roles || []);
      setStats(result.stats || { total: 0, active: 0, blocked: 0, staff: 0 });
      setPagination(result.pagination || { page: 1, pages: 1, total: 0, limit: 10 });
    } catch (fetchError) {
      setError(fetchError.message || "Lỗi tải dữ liệu người dùng");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffActivities = async (page = 1, keyword = staffKeyword) => {
    if (!token) return;
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (keyword.trim()) params.set("q", keyword.trim());
      const response = await fetch(`${BACKEND_URL}/api/users/admin/staff-activities?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải lịch sử nhân viên");
      }
      setStaffActivities(result.data || []);
      setStaffPagination(result.pagination || { page: 1, pages: 1, total: 0, limit: 10 });
    } catch (fetchError) {
      setError(fetchError.message || "Lỗi tải lịch sử nhân viên");
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchUsers(1, INITIAL_FILTERS);
    fetchStaffActivities(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const applyFilters = () => fetchUsers(1, filters);
  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    fetchUsers(1, INITIAL_FILTERS);
  };

  const submitCreateUser = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/admin/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể thêm người dùng");
      }
      setShowAddModal(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        phone: "",
        role_id: "",
        default_shipping_address: ""
      });
      fetchUsers(1, filters);
    } catch (submitError) {
      setError(submitError.message || "Lỗi thêm người dùng");
    }
  };

  const submitUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/admin/${editingUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingUser.name,
          phone: editingUser.phone || "",
          default_shipping_address: editingUser.default_shipping_address || "",
          avatar_url: editingUser.avatar_url || ""
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể cập nhật người dùng");
      }
      setEditingUser(null);
      fetchUsers(pagination.page, filters);
    } catch (submitError) {
      setError(submitError.message || "Lỗi cập nhật người dùng");
    }
  };

  const changeRole = async (userId, roleId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/admin/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ roleId })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể cập nhật quyền");
      fetchUsers(pagination.page, filters);
    } catch (submitError) {
      setError(submitError.message || "Lỗi cập nhật quyền");
    }
  };

  const toggleStatus = async (user) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/admin/${user._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !user.is_active })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể đổi trạng thái");
      fetchUsers(pagination.page, filters);
    } catch (submitError) {
      setError(submitError.message || "Lỗi đổi trạng thái");
    }
  };

  const openStaffDetail = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/admin/staff-activities/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể tải chi tiết lịch sử");
      setStaffDetail(result.data);
    } catch (detailError) {
      setError(detailError.message || "Lỗi tải chi tiết lịch sử");
    }
  };

  return (
    <div className="container-fluid">
      <h2 className="mb-4 text-danger">Quản lý người dùng</h2>

      <div className="row g-3 mb-4">
        <div className="col-md-3"><div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted">Tổng người dùng</div><h4 className="text-danger mb-0">{stats.total}</h4></div></div></div>
        <div className="col-md-3"><div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted">Đang hoạt động</div><h4 className="text-success mb-0">{stats.active}</h4></div></div></div>
        <div className="col-md-3"><div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted">Đã khóa</div><h4 className="text-secondary mb-0">{stats.blocked}</h4></div></div></div>
        <div className="col-md-3"><div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted">Nhân viên</div><h4 className="text-warning mb-0">{stats.staff}</h4></div></div></div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-lg-4">
              <label className="form-label">Tìm theo tên, email, số điện thoại</label>
              <input className="form-control" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
            </div>
            <div className="col-lg-3">
              <label className="form-label">Quyền</label>
              <select className="form-select" value={filters.role} onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}>
                <option value="">Tất cả quyền</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div className="col-lg-2">
              <label className="form-label">Trạng thái</label>
              <select className="form-select" value={filters.active} onChange={(e) => setFilters((p) => ({ ...p, active: e.target.value }))}>
                <option value="">Tất cả</option>
                <option value="true">Hoạt động</option>
                <option value="false">Đã khóa</option>
              </select>
            </div>
            <div className="col-lg-3 d-flex gap-2">
              <button className="btn btn-danger w-100" onClick={applyFilters}>Lọc</button>
              <button className="btn btn-outline-secondary w-100" onClick={resetFilters}>Đặt lại</button>
              <button className="btn btn-warning text-white w-100" onClick={() => setShowAddModal(true)}>Thêm</button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Tên</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Quyền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Đang tải...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4">Không có dữ liệu</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || "-"}</td>
                    <td style={{ minWidth: 180 }}>
                      <select className="form-select form-select-sm" value={user.role_id?._id || ""} onChange={(e) => changeRole(user._id, e.target.value)}>
                        {roles.map((role) => (
                          <option key={role._id} value={role._id}>{role.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>{user.is_active ? <span className="badge bg-success">Hoạt động</span> : <span className="badge bg-secondary">Đã khóa</span>}</td>
                    <td>{new Date(user.created_at).toLocaleString("vi-VN")}</td>
                    <td className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-warning" onClick={() => setEditingUser(user)}>Sửa</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => toggleStatus(user)}>{user.is_active ? "Khóa" : "Mở"}</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex justify-content-end mb-5">
        <div className="btn-group">
          <button className="btn btn-outline-danger" disabled={pagination.page <= 1} onClick={() => fetchUsers(pagination.page - 1, filters)}>Trước</button>
          <button className="btn btn-danger disabled">Trang {pagination.page}/{pagination.pages}</button>
          <button className="btn btn-outline-danger" disabled={pagination.page >= pagination.pages} onClick={() => fetchUsers(pagination.page + 1, filters)}>Sau</button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-danger">Lịch sử hoạt động nhân viên</h5>
          <div className="d-flex gap-2">
            <input className="form-control form-control-sm" style={{ width: 280 }} placeholder="Tìm theo thao tác/mô tả" value={staffKeyword} onChange={(e) => setStaffKeyword(e.target.value)} />
            <button className="btn btn-sm btn-danger" onClick={() => fetchStaffActivities(1, staffKeyword)}>Lọc</button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Thời gian</th>
                <th>Nhân viên</th>
                <th>Hành động</th>
                <th>Mô tả</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staffActivities.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4">Chưa có dữ liệu lịch sử</td></tr>
              ) : (
                staffActivities.map((activity) => (
                  <tr key={activity._id}>
                    <td>{new Date(activity.created_at).toLocaleString("vi-VN")}</td>
                    <td>{activity.staff_id?.name || "-"}</td>
                    <td>{activity.action}</td>
                    <td>{activity.description || "-"}</td>
                    <td><button className="btn btn-sm btn-outline-danger" onClick={() => openStaffDetail(activity._id)}>Xem chi tiết</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="card-footer bg-white d-flex justify-content-end">
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-danger" disabled={staffPagination.page <= 1} onClick={() => fetchStaffActivities(staffPagination.page - 1, staffKeyword)}>Trước</button>
            <button className="btn btn-danger disabled">Trang {staffPagination.page}/{staffPagination.pages}</button>
            <button className="btn btn-outline-danger" disabled={staffPagination.page >= staffPagination.pages} onClick={() => fetchStaffActivities(staffPagination.page + 1, staffKeyword)}>Sau</button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title text-danger">Thêm người dùng</h5><button className="btn-close" onClick={() => setShowAddModal(false)}></button></div>
              <div className="modal-body">
                <div className="mb-2"><label className="form-label">Họ tên</label><input className="form-control" value={newUser.name} onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))} /></div>
                <div className="mb-2"><label className="form-label">Email</label><input className="form-control" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} /></div>
                <div className="mb-2"><label className="form-label">Mật khẩu</label><input type="password" className="form-control" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} /></div>
                <div className="mb-2"><label className="form-label">Điện thoại</label><input className="form-control" value={newUser.phone} onChange={(e) => setNewUser((p) => ({ ...p, phone: e.target.value }))} /></div>
                <div className="mb-2"><label className="form-label">Địa chỉ mặc định</label><input className="form-control" value={newUser.default_shipping_address} onChange={(e) => setNewUser((p) => ({ ...p, default_shipping_address: e.target.value }))} /></div>
                <div className="mb-2">
                  <label className="form-label">Quyền</label>
                  <select className="form-select" value={newUser.role_id} onChange={(e) => setNewUser((p) => ({ ...p, role_id: e.target.value }))}>
                    <option value="">Chọn quyền</option>
                    {roles.map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button className="btn btn-danger" onClick={submitCreateUser}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title text-danger">Sửa người dùng</h5><button className="btn-close" onClick={() => setEditingUser(null)}></button></div>
              <div className="modal-body">
                <div className="mb-2"><label className="form-label">Họ tên</label><input className="form-control" value={editingUser.name || ""} onChange={(e) => setEditingUser((p) => ({ ...p, name: e.target.value }))} /></div>
                <div className="mb-2"><label className="form-label">Điện thoại</label><input className="form-control" value={editingUser.phone || ""} onChange={(e) => setEditingUser((p) => ({ ...p, phone: e.target.value }))} /></div>
                <div className="mb-2"><label className="form-label">Địa chỉ mặc định</label><input className="form-control" value={editingUser.default_shipping_address || ""} onChange={(e) => setEditingUser((p) => ({ ...p, default_shipping_address: e.target.value }))} /></div>
                <div className="mb-2"><label className="form-label">Ảnh đại diện URL</label><input className="form-control" value={editingUser.avatar_url || ""} onChange={(e) => setEditingUser((p) => ({ ...p, avatar_url: e.target.value }))} /></div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditingUser(null)}>Hủy</button>
                <button className="btn btn-danger" onClick={submitUpdateUser}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {staffDetail && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title text-danger">Chi tiết hoạt động nhân viên</h5><button className="btn-close" onClick={() => setStaffDetail(null)}></button></div>
              <div className="modal-body">
                <p><strong>Nhân viên:</strong> {staffDetail.staff_id?.name || "-"}</p>
                <p><strong>Email:</strong> {staffDetail.staff_id?.email || "-"}</p>
                <p><strong>Thời gian:</strong> {new Date(staffDetail.created_at).toLocaleString("vi-VN")}</p>
                <p><strong>Thao tác:</strong> {staffDetail.action}</p>
                <p><strong>Mô tả:</strong> {staffDetail.description || "-"}</p>
                <p><strong>Đối tượng:</strong> {staffDetail.entity_type} - {staffDetail.entity_id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

