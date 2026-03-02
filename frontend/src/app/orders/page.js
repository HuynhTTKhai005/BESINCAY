"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

export default function OrdersPage() {
    const { user, token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

     useEffect(() => {
        const fetchOrders = async () => {
            if (!user || !token) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${BACKEND_URL}/api/orders`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include'
                });

                const result = await response.json();

                if (result.success) {
                    setOrders(result.data || []);
                } else {
                    throw new Error(result.message || 'Không thể tải danh sách đơn hàng');
                }
            } catch (err) {
                setError(err.message);
                console.error('Error fetching orders:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user, token]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="badge bg-success">Hoàn thành</span>;
            case 'pending':
                return <span className="badge bg-warning">Đang xử lý</span>;
            case 'cancelled':
                return <span className="badge bg-danger">Đã hủy</span>;
            case 'shipping':
                return <span className="badge bg-info">Đang giao</span>;
            default:
                return <span className="badge bg-secondary">Không xác định</span>;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-success';
            case 'pending':
                return 'text-warning';
            case 'cancelled':
                return 'text-danger';
            case 'shipping':
                return 'text-info';
            default:
                return 'text-muted';
        }
    };

    if (!user) {
        return (
            <section className="orders section">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-8 col-lg-6">
                            <div className="card shadow text-center" data-aos="fade-up">
                                <div className="card-body p-5">
                                    <i className="bi bi-person-x" style={{ fontSize: '4rem', color: 'var(--accent-color)' }}></i>
                                    <h3 className="mt-3">Vui lòng đăng nhập</h3>
                                    <p className="text-muted">Bạn cần đăng nhập để xem lịch sử đơn hàng.</p>
                                    <Link href="/login" className="btn btn-getstarted mt-3">
                                        <i className="bi bi-box-arrow-in-right me-2"></i>
                                        Đăng nhập
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="orders section">
            <div className="container section-title" data-aos="fade-up">
                <p><span className="description-title">ĐƠN HÀNG</span></p>
                <h2>Lịch sử đơn hàng</h2>
            </div>

            <div className="container">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Đang tải...</span>
                        </div>
                        <p className="mt-3">Đang tải đơn hàng...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-receipt-x" style={{ fontSize: '4rem', color: 'var(--accent-color)' }}></i>
                        <h3 className="mt-3">Chưa có đơn hàng</h3>
                        <p className="text-muted">Bạn chưa đặt đơn hàng nào. Hãy bắt đầu đặt hàng ngay!</p>
                        <Link href="/" className="btn btn-getstarted mt-3">
                            <i className="bi bi-shop me-2"></i>
                            Xem thực đơn
                        </Link>
                    </div>
                ) : (
                    <div className="row">
                        {orders.map((order) => (
                            <div key={order._id} className="col-12 mb-4" data-aos="fade-up">
                                <div className="card shadow border-0">
                                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 className="mb-1">Đơn hàng #{order.order_id || order._id}</h5>
                                            <small className="text-muted">
                                                <i className="bi bi-calendar me-1"></i>
                                                {new Date(order.created_at).toLocaleDateString('vi-VN')}
                                            </small>
                                        </div>
                                        {getStatusBadge(order.status)}
                                    </div>

                                    <div className="card-body">
                                        {/* Danh sách sản phẩm */}
                                        <div className="order-items mb-3">
                                            {order.items.map((item, index) => (
                                                <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                                    <div className="flex-grow-1">
                                                        <h6 className="mb-1">{item.name}</h6>
                                                        <small className="text-muted">Số lượng: {item.quantity}</small>
                                                    </div>
                                                    <div className="text-end">
                                                        <span className="fw-bold">
                                                            {(item.base_price_cents * item.quantity).toLocaleString('vi-VN')} VNĐ
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Tổng kết */}
                                        <div className="row">
                                            <div className="col-md-8">
                                                <div className="order-summary">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Tạm tính:</span>
                                                        <span>{order.subtotal.toLocaleString('vi-VN')} VNĐ</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Phí giao hàng:</span>
                                                        <span>{order.shippingFee.toLocaleString('vi-VN')} VNĐ</span>
                                                    </div>
                                                    <hr className="my-2" />
                                                    <div className="d-flex justify-content-between">
                                                        <strong>Tổng cộng:</strong>
                                                        <strong className="text-danger fs-5">
                                                            {order.total.toLocaleString('vi-VN')} VNĐ
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-4 text-end">
                                                <div className="btn-group-vertical" role="group">
                                                    <Link href={`/orders/${order._id}`} className="btn btn-outline-primary btn-sm mb-2">
                                                        <i className="bi bi-eye me-1"></i>
                                                        Xem chi tiết
                                                    </Link>
                                                    {order.status === 'completed' && (
                                                        <button className="btn btn-outline-success btn-sm mb-2">
                                                            <i className="bi bi-star me-1"></i>
                                                            Đánh giá
                                                        </button>
                                                    )}
                                                    {order.status === 'completed' && (
                                                        <button className="btn btn-outline-secondary btn-sm">
                                                            <i className="bi bi-arrow-repeat me-1"></i>
                                                            Đặt lại
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Thống kê đơn hàng */}
                {!loading && orders.length > 0 && (
                    <div className="row mt-5" data-aos="fade-up">
                        <div className="col-12">
                            <div className="card shadow border-0">
                                <div className="card-header bg-primary text-white">
                                    <h5 className="mb-0">
                                        <i className="bi bi-bar-chart me-2"></i>
                                        Thống kê đơn hàng
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="row text-center">
                                        <div className="col-md-3 mb-3">
                                            <div className="p-3 bg-light rounded">
                                                <h3 className="text-primary mb-1">{orders.length}</h3>
                                                <small className="text-muted">Tổng đơn hàng</small>
                                            </div>
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <div className="p-3 bg-light rounded">
                                                <h3 className="text-success mb-1">
                                                    {orders.filter(o => o.status === 'completed').length}
                                                </h3>
                                                <small className="text-muted">Hoàn thành</small>
                                            </div>
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <div className="p-3 bg-light rounded">
                                                <h3 className="text-warning mb-1">
                                                    {orders.filter(o => o.status === 'pending').length}
                                                </h3>
                                                <small className="text-muted">Đang xử lý</small>
                                            </div>
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <div className="p-3 bg-light rounded">
                                                <h3 className="text-danger mb-1">
                                                    {orders.filter(o => o.status === 'cancelled').length}
                                                </h3>
                                                <small className="text-muted">Đã hủy</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
