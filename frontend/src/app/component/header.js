"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

export default function Header() {
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleName = user?.role_id?.name || user?.role?.name || "";
  const canAccessAdmin = roleName === "admin" || roleName === "staff";
  const isAdminArea = pathname?.startsWith("/admin");

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header id="header" className="header d-flex align-items-center sticky-top">
      <div className="container d-flex align-items-center justify-content-between">
        <Link href="#hero" className="logo d-flex me-auto me-xl-0">
          SINCAY
        </Link>

        <nav id="navmenu" className="navmenu">
          <ul>
            <li>
              <Link href="/#hero" className="active">Trang chủ</Link>
            </li>
            <li>
              <Link href="/#about">Về chúng tôi</Link>
            </li>
            <li>
              <Link href="/#menu">Thực đơn</Link>
            </li>
            <li>
              <Link href="/#events">Sự kiện</Link>
            </li>
            <li>
              <Link href="/#gallery">Không gian</Link>
            </li>
            <li>
              <Link href="/#contact">Liên hệ</Link>
            </li>
          </ul>

          <i className="mobile-nav-toggle d-xl-none bi bi-list" aria-label="Mở menu" />
        </nav>

        <div className="d-flex align-items-center gap-2 ms-3">
          <Link href="/cart" className="btn-cart me-1 position-relative" aria-label="Giỏ hàng">
            <i className="bi bi-cart fs-4"></i>
            {cartCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {cartCount}
                <span className="visually-hidden">sản phẩm trong giỏ</span>
              </span>
            )}
          </Link>

          {user ? (
            <div className="dropdown">
              <button
                className="btn btn-outline-danger d-flex align-items-center"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <i className="bi bi-person-circle me-2"></i>
                {user.name}
                <i className="bi bi-chevron-down ms-2"></i>
              </button>

              {showUserMenu && (
                <div className="dropdown-menu dropdown-menu-end show" style={{ display: "block" }}>
                  <Link href="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <i className="bi bi-person me-2"></i>
                    Hồ sơ
                  </Link>
                  <Link href="/wishlist" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <i className="bi bi-heart me-2"></i>
                    Yêu thích
                  </Link>
                  <Link href="/orders" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <i className="bi bi-bag-check me-2"></i>
                    Đơn hàng
                  </Link>
                  {canAccessAdmin && (
                    <Link
                      href={isAdminArea ? "/" : "/admin"}
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className={`bi ${isAdminArea ? "bi-house-door" : "bi-speedometer2"} me-2`}></i>
                      {isAdminArea ? "Về giao diện người dùng" : "Vào trang quản trị"}
                    </Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="d-flex gap-2">
              <Link href="/login" className="btn btn-outline-danger">Đăng nhập</Link>
              <Link href="/register" className="btn btn-danger">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
