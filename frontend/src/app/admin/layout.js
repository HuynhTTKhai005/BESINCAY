"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./admin-theme.css";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "bi-speedometer2", roles: ["admin", "staff"] },
  { href: "/admin/orders", label: "Đơn hàng", icon: "bi-receipt", roles: ["admin", "staff"] },
  { href: "/admin/products", label: "Sản phẩm", icon: "bi-box-seam", roles: ["admin", "staff"] },
  { href: "/admin/inventory", label: "Hàng tồn", icon: "bi-archive", roles: ["admin"] },
  { href: "/admin/categories", label: "Danh mục", icon: "bi-tags", roles: ["admin"] },
  { href: "/admin/users", label: "Người dùng", icon: "bi-people", roles: ["admin"] },
  { href: "/admin/customers", label: "Khách hàng", icon: "bi-person-badge", roles: ["admin", "staff"] },
  { href: "/admin/reservations", label: "Đặt bàn và thư", icon: "bi-envelope-paper", roles: ["admin", "staff"] }
];

const ALLOWED_PATHS_BY_ROLE = {
  admin: ["/admin"],
  staff: ["/admin", "/admin/orders", "/admin/products", "/admin/customers", "/admin/reservations"]
};

function canAccessPath(roleName, pathname) {
  const allowedPrefixes = ALLOWED_PATHS_BY_ROLE[roleName] || [];
  return allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function AdminLayoutContent({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const roleName =
    (typeof user?.role_id === "object" ? user?.role_id?.name : user?.role_id) ||
    user?.role?.name ||
    "";
  const allowedRoles = ["admin", "staff"];

  const visibleNavItems = useMemo(() => {
    if (!allowedRoles.includes(roleName)) return [];
    return NAV_ITEMS.filter((item) => item.roles.includes(roleName));
  }, [roleName]);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(roleName)) {
      router.replace("/");
      return;
    }

    if (!canAccessPath(roleName, pathname)) {
      router.replace("/admin");
    }
  }, [user, loading, roleName, pathname, router]);

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center py-5"><div className="spinner-border text-danger"></div></div>;
  }

  if (!user || !allowedRoles.includes(roleName)) {
    return null;
  }

  return (
    <div className="admin-shell">
      {isMobile && sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)}></div>}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : "collapsed"} ${isMobile ? "mobile" : ""}`}>
        <div className="px-3 py-3 border-bottom border-danger-subtle">
          <div className="fw-bold fs-5">{sidebarOpen ? "Sincay Admin" : "SA"}</div>
        </div>
        <nav className="py-2">
          {visibleNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="d-flex align-items-center text-white text-decoration-none px-3 py-3 fs-5" style={{ gap: 12 }}>
              <i className={`bi ${item.icon}`} style={{ minWidth: 22 }}></i>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      <div className={`admin-main ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"} ${isMobile ? "mobile" : ""}`}>
        <header className="bg-white border-bottom px-3 px-md-4 py-3 d-flex justify-content-between align-items-center sticky-top" style={{ zIndex: 10 }}>
          <button className="btn btn-outline-danger btn-sm" onClick={() => setSidebarOpen((v) => !v)}>
            <i className="bi bi-list"></i>
          </button>
          <div className="d-flex align-items-center gap-3">
            <div>Xin chào, <strong>{user.name}</strong></div>
            <Link href="/" className="btn btn-sm btn-danger">Về trang chủ</Link>
          </div>
        </header>
        <main className="p-3 p-md-4">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
