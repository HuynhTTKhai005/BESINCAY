"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const emptyReservationFilters = { q: "", status: "", date: "" };
const emptyMessageFilters = { q: "", status: "" };

const reservationStatusMap = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy"
};

const messageStatusMap = {
  new: "Mới",
  read: "Đã đọc",
  resolved: "Đã xử lý"
};

export default function AdminReservationsPage() {
  const { token, user } = useAuth();
  const roleName = user?.role_id?.name || user?.role?.name || "";
  const isAdmin = roleName === "admin";

  const [reservationList, setReservationList] = useState([]);
  const [reservationPagination, setReservationPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [reservationFilters, setReservationFilters] = useState(emptyReservationFilters);

  const [messageList, setMessageList] = useState([]);
  const [messagePagination, setMessagePagination] = useState({ page: 1, pages: 1, total: 0 });
  const [messageFilters, setMessageFilters] = useState(emptyMessageFilters);

  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  const fetchReservations = async (page = 1, filters = reservationFilters) => {
    if (!token) return;

    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (filters.q.trim()) params.set("q", filters.q.trim());
      if (filters.status) params.set("status", filters.status);
      if (filters.date) params.set("date", filters.date);

      const response = await fetch(`${BACKEND_URL}/api/reservations/admin/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể tải danh sách đặt bàn");

      setReservationList(result.data || []);
      setReservationPagination(result.pagination || { page: 1, pages: 1, total: 0 });
    } catch (fetchError) {
      setError(fetchError.message || "Lỗi tải danh sách đặt bàn");
    }
  };

  const fetchMessages = async (page = 1, filters = messageFilters) => {
    if (!token) return;

    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (filters.q.trim()) params.set("q", filters.q.trim());
      if (filters.status) params.set("status", filters.status);

      const response = await fetch(`${BACKEND_URL}/api/contact-messages/admin/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể tải danh sách thư");

      setMessageList(result.data || []);
      setMessagePagination(result.pagination || { page: 1, pages: 1, total: 0 });
    } catch (fetchError) {
      setError(fetchError.message || "Lỗi tải danh sách thư");
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchReservations(1, reservationFilters);
    fetchMessages(1, messageFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const updateReservationStatus = async (id, status) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/reservations/admin/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể cập nhật trạng thái đặt bàn");
      fetchReservations(reservationPagination.page, reservationFilters);
    } catch (submitError) {
      setError(submitError.message || "Lỗi cập nhật trạng thái đặt bàn");
    }
  };

  const updateMessageStatus = async (id, status) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/contact-messages/admin/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể cập nhật trạng thái thư");
      fetchMessages(messagePagination.page, messageFilters);
    } catch (submitError) {
      setError(submitError.message || "Lỗi cập nhật trạng thái thư");
    }
  };

  const openReservationDetail = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/reservations/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể tải chi tiết đặt bàn");
      setDetail({ type: "reservation", data: result.data });
    } catch (detailError) {
      setError(detailError.message || "Lỗi tải chi tiết đặt bàn");
    }
  };

  const openMessageDetail = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/contact-messages/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể tải chi tiết thư");
      setDetail({ type: "message", data: result.data });
    } catch (detailError) {
      setError(detailError.message || "Lỗi tải chi tiết thư");
    }
  };

  return (
    <div className="container-fluid">
      <h2 className="mb-4 text-danger fw-bold">Quản lý đặt bàn và thư liên hệ</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white text-danger fw-semibold">Danh sách đặt bàn</div>
        <div className="card-body">
          <div className="row g-2 align-items-end mb-3">
            <div className="col-lg-5">
              <label className="form-label">Tìm theo tên, email, số điện thoại</label>
              <input className="form-control" value={reservationFilters.q} onChange={(e) => setReservationFilters((prev) => ({ ...prev, q: e.target.value }))} />
            </div>
            <div className="col-lg-2">
              <label className="form-label">Trạng thái</label>
              <select className="form-select" value={reservationFilters.status} onChange={(e) => setReservationFilters((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="">Tất cả</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div className="col-lg-2">
              <label className="form-label">Ngày đặt bàn</label>
              <input type="date" className="form-control" value={reservationFilters.date} onChange={(e) => setReservationFilters((prev) => ({ ...prev, date: e.target.value }))} />
            </div>
            <div className="col-lg-3 d-flex gap-2">
              <button className="btn btn-danger w-100" onClick={() => fetchReservations(1, reservationFilters)}>Lọc</button>
              <button className="btn btn-outline-secondary w-100" onClick={() => { setReservationFilters(emptyReservationFilters); fetchReservations(1, emptyReservationFilters); }}>Đặt lại</button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Khách hàng</th>
                  <th>Liên hệ</th>
                  <th>Ngày giờ</th>
                  <th>Số người</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {reservationList.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4">Không có yêu cầu đặt bàn</td></tr>
                ) : reservationList.map((item) => (
                  <tr key={item._id}>
                    <td className="fw-semibold">{item.name}</td>
                    <td>{item.phone}<br />{item.email}</td>
                    <td>{item.reservation_date} - {item.reservation_time}</td>
                    <td>{item.people}</td>
                    <td>
                      <select className="form-select form-select-sm" value={item.status} disabled={!isAdmin} onChange={(e) => isAdmin && updateReservationStatus(item._id, e.target.value)}>
                        <option value="pending">Chờ xác nhận</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </td>
                    <td className="text-end"><button className="btn btn-sm btn-outline-danger" onClick={() => openReservationDetail(item._id)}>Xem chi tiết</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <div className="btn-group">
              <button className="btn btn-outline-danger" disabled={reservationPagination.page <= 1} onClick={() => fetchReservations(reservationPagination.page - 1, reservationFilters)}>Trước</button>
              <button className="btn btn-danger disabled">Trang {reservationPagination.page}/{reservationPagination.pages}</button>
              <button className="btn btn-outline-danger" disabled={reservationPagination.page >= reservationPagination.pages} onClick={() => fetchReservations(reservationPagination.page + 1, reservationFilters)}>Sau</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white text-danger fw-semibold">Danh sách thư liên hệ</div>
        <div className="card-body">
          <div className="row g-2 align-items-end mb-3">
            <div className="col-lg-6">
              <label className="form-label">Tìm theo tên, email, tiêu đề</label>
              <input className="form-control" value={messageFilters.q} onChange={(e) => setMessageFilters((prev) => ({ ...prev, q: e.target.value }))} />
            </div>
            <div className="col-lg-3">
              <label className="form-label">Trạng thái</label>
              <select className="form-select" value={messageFilters.status} onChange={(e) => setMessageFilters((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="">Tất cả</option>
                <option value="new">Mới</option>
                <option value="read">Đã đọc</option>
                <option value="resolved">Đã xử lý</option>
              </select>
            </div>
            <div className="col-lg-3 d-flex gap-2">
              <button className="btn btn-danger w-100" onClick={() => fetchMessages(1, messageFilters)}>Lọc</button>
              <button className="btn btn-outline-secondary w-100" onClick={() => { setMessageFilters(emptyMessageFilters); fetchMessages(1, emptyMessageFilters); }}>Đặt lại</button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Khách gửi</th>
                  <th>Tiêu đề</th>
                  <th>Nội dung ngắn</th>
                  <th>Trạng thái</th>
                  <th>Ngày gửi</th>
                  <th className="text-end">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {messageList.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4">Không có thư liên hệ</td></tr>
                ) : messageList.map((item) => (
                  <tr key={item._id}>
                    <td className="fw-semibold">{item.name}<br />{item.email}</td>
                    <td>{item.subject}</td>
                    <td>{String(item.message || "").slice(0, 80)}...</td>
                    <td>
                      <select className="form-select form-select-sm" value={item.status} disabled={!isAdmin} onChange={(e) => isAdmin && updateMessageStatus(item._id, e.target.value)}>
                        <option value="new">Mới</option>
                        <option value="read">Đã đọc</option>
                        <option value="resolved">Đã xử lý</option>
                      </select>
                    </td>
                    <td>{new Date(item.created_at).toLocaleString("vi-VN")}</td>
                    <td className="text-end"><button className="btn btn-sm btn-outline-danger" onClick={() => openMessageDetail(item._id)}>Xem chi tiết</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <div className="btn-group">
              <button className="btn btn-outline-danger" disabled={messagePagination.page <= 1} onClick={() => fetchMessages(messagePagination.page - 1, messageFilters)}>Trước</button>
              <button className="btn btn-danger disabled">Trang {messagePagination.page}/{messagePagination.pages}</button>
              <button className="btn btn-outline-danger" disabled={messagePagination.page >= messagePagination.pages} onClick={() => fetchMessages(messagePagination.page + 1, messageFilters)}>Sau</button>
            </div>
          </div>
        </div>
      </div>

      {detail && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.45)" }} onClick={() => setDetail(null)}>
          <div className="modal-dialog modal-lg" onClick={(event) => event.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger fw-bold">
                  {detail.type === "reservation" ? "Chi tiết đặt bàn" : "Chi tiết thư liên hệ"}
                </h5>
                <button className="btn-close" onClick={() => setDetail(null)} />
              </div>
              <div className="modal-body">
                {detail.type === "reservation" ? (
                  <div className="row g-3">
                    <div className="col-md-6"><strong>Khách hàng:</strong><div>{detail.data?.name || "-"}</div></div>
                    <div className="col-md-6"><strong>Trạng thái:</strong><div>{reservationStatusMap[detail.data?.status] || detail.data?.status || "-"}</div></div>
                    <div className="col-md-6"><strong>Email:</strong><div>{detail.data?.email || "-"}</div></div>
                    <div className="col-md-6"><strong>Số điện thoại:</strong><div>{detail.data?.phone || "-"}</div></div>
                    <div className="col-md-6"><strong>Ngày đặt:</strong><div>{detail.data?.reservation_date || "-"}</div></div>
                    <div className="col-md-6"><strong>Giờ đặt:</strong><div>{detail.data?.reservation_time || "-"}</div></div>
                    <div className="col-md-6"><strong>Số người:</strong><div>{detail.data?.people || 0}</div></div>
                    <div className="col-md-6"><strong>Ngày tạo:</strong><div>{detail.data?.created_at ? new Date(detail.data.created_at).toLocaleString("vi-VN") : "-"}</div></div>
                    <div className="col-12"><strong>Ghi chú:</strong><div className="p-2 bg-light rounded">{detail.data?.note || "Không có"}</div></div>
                  </div>
                ) : (
                  <div className="row g-3">
                    <div className="col-md-6"><strong>Khách gửi:</strong><div>{detail.data?.name || "-"}</div></div>
                    <div className="col-md-6"><strong>Trạng thái:</strong><div>{messageStatusMap[detail.data?.status] || detail.data?.status || "-"}</div></div>
                    <div className="col-md-6"><strong>Email:</strong><div>{detail.data?.email || "-"}</div></div>
                    <div className="col-md-6"><strong>Ngày gửi:</strong><div>{detail.data?.created_at ? new Date(detail.data.created_at).toLocaleString("vi-VN") : "-"}</div></div>
                    <div className="col-12"><strong>Tiêu đề:</strong><div>{detail.data?.subject || "-"}</div></div>
                    <div className="col-12"><strong>Nội dung:</strong><div className="p-2 bg-light rounded" style={{ whiteSpace: "pre-wrap" }}>{detail.data?.message || "-"}</div></div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDetail(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
