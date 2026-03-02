"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

const DEFAULT_PAGES = {
  all: 1,
  appetizer: 1,
  spicy: 1,
  tokbokki: 1,
  hotpot: 1,
  drink: 1
};

const formatPrice = (price) => {
  const value = Number(price || 0);
  if (!Number.isFinite(value) || value <= 0) return "0";
  const normalized = value >= 1000000 && value % 100 === 0 ? Math.round(value / 100) : Math.round(value);
  return normalized.toLocaleString("vi-VN");
};

const normalizePriceNumber = (price) => {
  const value = Number(price || 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value >= 1000000 && value % 100 === 0 ? Math.round(value / 100) : Math.round(value);
};

const categoryLabel = (slug) => {
  if (slug === "appetizer") return "Khai vị";
  if (slug === "spicy") return "Mì cay";
  if (slug === "tokbokki") return "Lẩu Tokbokki";
  if (slug === "hotpot") return "Lẩu";
  if (slug === "drink") return "Đồ uống";
  return "Khác";
};

const isOutOfStock = (product) => {
  const stock = Number(product?.stock_quantity || 0);
  return !product?.is_active || !product?.is_available || stock <= 0;
};

export default function Menu() {
  const router = useRouter();
  const modalRef = useRef(null);
  const { addToCart } = useCart();
  const { user, token } = useAuth();
  const ITEMS_PER_PAGE = 6;

  const BACKEND_URL = useMemo(() => {
    const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (envUrl) return envUrl.replace(/\/+$/, "");

    if (typeof window !== "undefined") {
      return `${window.location.protocol}//${window.location.hostname}:4000`;
    }
    return "http://localhost:4000";
  }, []);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchError, setFetchError] = useState("");

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showSpicyLevelModal, setShowSpicyLevelModal] = useState(false);
  const [productToAdd, setProductToAdd] = useState(null);
  const [spicyLevel, setSpicyLevel] = useState(1);
  const [spicyNote, setSpicyNote] = useState("");

  const [wishlistIds, setWishlistIds] = useState([]);
  const [currentPages, setCurrentPages] = useState(DEFAULT_PAGES);

  const showToastMessage = (message, type = "success") => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchWishlistIds = useCallback(async () => {
    if (!token) {
      setWishlistIds([]);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/wishlist/ids`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      if (!response.ok) return;

      const result = await response.json();
      if (result.success) setWishlistIds(result.data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách yêu thích:", error);
    }
  }, [token, BACKEND_URL]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setFetchError("");
        const response = await fetch(`${BACKEND_URL}/api/products`);
        if (!response.ok) throw new Error(`API lỗi (${response.status})`);

        const result = await response.json();
        if (!result.success) throw new Error(result.message || "Không lấy được dữ liệu thực đơn");

        setProducts(result.data || []);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu thực đơn:", error);
        setFetchError(`Không thể kết nối backend tại ${BACKEND_URL}`);
        showToastMessage(`Không thể kết nối backend tại ${BACKEND_URL}`, "danger");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [BACKEND_URL]);

  useEffect(() => {
    fetchWishlistIds();
  }, [fetchWishlistIds]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        if (showProductModal) setShowProductModal(false);
        if (showSpicyLevelModal) setShowSpicyLevelModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProductModal, showSpicyLevelModal]);

  useEffect(() => {
    setCurrentPages(DEFAULT_PAGES);
  }, [searchTerm, products.length]);

  const getProductImageUrl = (product) => {
    const imageUrl = product?.image_url || "";
    if (!imageUrl) return "/img/placeholder.jpg";
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("data:image")) return imageUrl;
    return `${BACKEND_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  };

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return products;

    return products.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      const description = String(item.description || "").toLowerCase();
      return name.includes(keyword) || description.includes(keyword);
    });
  }, [products, searchTerm]);

  const getItemsByCategory = (category) => {
    if (category === "all") return filteredProducts;
    return filteredProducts.filter((item) => item.category_id?.slug === category);
  };

  const handlePageChange = (category, page) => {
    setCurrentPages((prev) => ({ ...prev, [category]: page }));
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleAddToCart = async (product, spicyInfo = null) => {
    if (isOutOfStock(product)) {
      showToastMessage("Sản phẩm đã hết hàng hoặc đang tạm ngừng bán", "warning");
      return;
    }

    const normalizedPrice = normalizePriceNumber(product.base_price_cents);

    const cartProduct = {
      id: product._id,
      name: product.name,
      description: product.description,
      base_price_cents: normalizedPrice,
      image_url: product.image_url,
      slug: product.slug,
      category_slug: product.category_id?.slug,
      is_active: !!product.is_active,
      is_available: !!product.is_available,
      stock_quantity: Number(product.stock_quantity || 0),
      ...(spicyInfo && { spicyInfo })
    };

    if (spicyInfo) {
      cartProduct.name = `${product.name} - Cấp độ ${spicyInfo.level}`;
      if (spicyInfo.note) {
        cartProduct.description = `${product.description} (Ghi chú: ${spicyInfo.note})`;
      }
    }

    await addToCart(cartProduct);
    showToastMessage(`Đã thêm "${cartProduct.name}" vào giỏ hàng`, "success");
    if (showSpicyLevelModal) setShowSpicyLevelModal(false);
  };

  const handleAddClick = (product) => {
    if (isOutOfStock(product)) {
      showToastMessage("Sản phẩm đã hết hàng hoặc đang tạm ngừng bán", "warning");
      return;
    }

    if (product.category_id?.slug === "spicy") {
      setProductToAdd(product);
      setSpicyLevel(1);
      setSpicyNote("");
      setShowSpicyLevelModal(true);
      return;
    }

    handleAddToCart(product);
  };

  const handleConfirmSpicyProduct = () => {
    if (!productToAdd) return;
    handleAddToCart(productToAdd, { level: spicyLevel, note: spicyNote });
  };

  const handleToggleWishlist = async (product) => {
    if (!user || !token) {
      showToastMessage("Vui lòng đăng nhập để dùng danh sách yêu thích", "warning");
      setTimeout(() => router.push("/login"), 500);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/wishlist/toggle/${product._id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Không thể cập nhật yêu thích");

      const isFavorite = !!result?.data?.isFavorite;
      setWishlistIds((prev) => {
        if (isFavorite) return prev.includes(product._id) ? prev : [...prev, product._id];
        return prev.filter((id) => id !== product._id);
      });

      showToastMessage(
        isFavorite ? `Đã thêm "${product.name}" vào yêu thích` : `Đã xóa "${product.name}" khỏi yêu thích`,
        isFavorite ? "success" : "warning"
      );
    } catch (error) {
      console.error("Lỗi cập nhật yêu thích:", error);
      showToastMessage(error.message || "Có lỗi xảy ra, vui lòng thử lại", "danger");
    }
  };

  const renderMenuItems = (category) => {
    const items = getItemsByCategory(category);
    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(currentPages[category] || 1, totalPages);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    if (items.length === 0) {
      return <div className="col-12 text-center text-muted py-4">Không tìm thấy sản phẩm phù hợp.</div>;
    }

    return pageItems.map((item, index) => {
      const imageUrl = getProductImageUrl(item);
      const isFavorite = wishlistIds.includes(item._id);
      const disabled = isOutOfStock(item);

      return (
        <div key={item._id || index} className="col-lg-4 menu-item" data-aos="fade-up" data-aos-delay={index * 100}>
          <button
            type="button"
            className="border-0 bg-transparent p-0 w-100"
            onClick={() => openProductModal(item)}
            style={{ cursor: "pointer" }}
            aria-label={`Xem chi tiết ${item.name}`}
          >
            <Image src={imageUrl} className="menu-img img-fluid" alt={item.name} width={416} height={300} unoptimized />
          </button>

          <h4>{item.name}</h4>
          <p className="ingredients">{item.description}</p>
          <p className="price">{formatPrice(item.base_price_cents)} VNĐ</p>

          <div className="d-flex justify-content-center gap-2 mt-3 flex-wrap">
            <button
              className={`btn d-flex align-items-center gap-2 ${disabled ? "btn-secondary" : "btn-danger"}`}
              onClick={() => handleAddClick(item)}
              disabled={disabled}
            >
              <i className="bi bi-cart-plus" />
              <span>{disabled ? "Hết hàng" : "Thêm vào giỏ"}</span>
            </button>

            <button
              className={`btn d-flex align-items-center gap-2 ${isFavorite ? "btn-danger" : "btn-outline-danger"}`}
              onClick={() => handleToggleWishlist(item)}
            >
              <i className={`bi ${isFavorite ? "bi-heart-fill" : "bi-heart"}`} />
              <span>Yêu thích</span>
            </button>
          </div>
        </div>
      );
    });
  };

  const renderPagination = (category) => {
    const totalItems = getItemsByCategory(category).length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const currentPage = Math.min(currentPages[category] || 1, Math.max(1, totalPages));

    if (totalPages <= 1) return null;

    return (
      <div className="d-flex justify-content-center mt-4">
        <div className="btn-group" role="group" aria-label={`Phân trang ${category}`}>
          {Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;
            const isActive = page === currentPage;
            return (
              <button
                key={`${category}-page-${page}`}
                type="button"
                className={`btn ${isActive ? "btn-danger" : "btn-outline-danger"}`}
                onClick={() => handlePageChange(category, page)}
              >
                {page}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-center p-5 mt-5">Đang tải thực đơn...</div>;

  return (
    <>
      {showToast && (
        <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div className={`toast-header text-white ${toastType === "danger" ? "bg-danger" : toastType === "warning" ? "bg-warning" : "bg-danger"}`}>
              <i className="bi bi-fire me-2" />
              <strong className="me-auto">Sincay</strong>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowToast(false)} />
            </div>
            <div className="toast-body">{toastMessage}</div>
          </div>
        </div>
      )}

      {fetchError && (
        <div className="container mt-3">
          <div className="alert alert-warning text-center mb-0">{fetchError}</div>
        </div>
      )}

      {showProductModal && selectedProduct && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div ref={modalRef} className="modal-content" style={{ backgroundColor: "white", borderRadius: 12, maxWidth: 820, width: "92%", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header p-4 border-bottom">
              <h3 className="modal-title">{selectedProduct.name}</h3>
              <button type="button" className="btn-close" onClick={() => setShowProductModal(false)} />
            </div>
            <div className="modal-body p-4">
              <div className="row g-4">
                <div className="col-md-6">
                  <Image src={getProductImageUrl(selectedProduct)} alt={selectedProduct.name} width={460} height={320} className="img-fluid rounded" unoptimized />
                </div>
                <div className="col-md-6">
                  <h4 className="mb-3">Thông tin sản phẩm</h4>
                  <p className="mb-3">{selectedProduct.description}</p>
                  <div className="mb-2"><strong>Giá:</strong> {formatPrice(selectedProduct.base_price_cents)} VNĐ</div>
                  <div className="mb-2"><strong>Danh mục:</strong> {categoryLabel(selectedProduct.category_id?.slug)}</div>
                  <div className="mb-4"><strong>Tồn kho:</strong> {Number(selectedProduct.stock_quantity || 0)}</div>

                  <button className={`btn w-100 py-3 ${isOutOfStock(selectedProduct) ? "btn-secondary" : "btn-danger"}`} onClick={() => handleAddClick(selectedProduct)} disabled={isOutOfStock(selectedProduct)}>
                    <i className="bi bi-cart-plus me-2" />
                    {isOutOfStock(selectedProduct) ? "Hết hàng / Ngừng bán" : "Thêm vào giỏ hàng"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSpicyLevelModal && productToAdd && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }}>
          <div ref={modalRef} className="modal-content" style={{ backgroundColor: "white", borderRadius: 12, maxWidth: 520, width: "92%", padding: 28 }}>
            <div className="modal-header border-bottom pb-3 mb-4">
              <h3 className="modal-title">Chọn cấp độ cay</h3>
              <button type="button" className="btn-close" onClick={() => setShowSpicyLevelModal(false)} />
            </div>

            <div className="modal-body">
              <div className="mb-4 text-center">
                <h5>{productToAdd.name}</h5>
                <p className="text-muted">{productToAdd.description}</p>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">Cấp độ cay (1-5):</label>
                <div className="d-flex justify-content-between mb-3">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className="text-center">
                      <button className={`btn ${spicyLevel === level ? "btn-danger" : "btn-outline-danger"} rounded-circle`} style={{ width: 50, height: 50 }} onClick={() => setSpicyLevel(level)}>
                        {level}
                      </button>
                      <div className="mt-1 small">{level === 1 && "Dễ"}{level === 2 && "Vừa"}{level === 3 && "Cay"}{level === 4 && "Rất cay"}{level === 5 && "Cực cay"}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="alert alert-warning mb-4">
                <i className="bi bi-info-circle me-2" />
                <strong>Cấp độ {spicyLevel}:</strong>{" "}
                {spicyLevel === 1 ? "Dễ - phù hợp cho người mới bắt đầu" : spicyLevel === 2 ? "Vừa - hơi cay nhẹ" : spicyLevel === 3 ? "Cay - vị cay đậm đà" : spicyLevel === 4 ? "Rất cay - dành cho người ăn cay giỏi" : "Cực cay - thử thách vị giác"}
              </div>

              <div className="mb-4">
                <label className="form-label">Ghi chú thêm (nếu có):</label>
                <textarea className="form-control" rows="3" placeholder="Ví dụ: ít cay hơn cấp độ 3, thêm topping..." value={spicyNote} onChange={(e) => setSpicyNote(e.target.value)} />
              </div>
            </div>

            <div className="modal-footer border-top pt-4 d-flex justify-content-end gap-2">
              <button className="btn btn-outline-danger" onClick={() => setShowSpicyLevelModal(false)}>Hủy</button>
              <button className="btn btn-danger" onClick={handleConfirmSpicyProduct}><i className="bi bi-check-circle me-2" />Xác nhận thêm vào giỏ</button>
            </div>
          </div>
        </div>
      )}

      <section id="menu" className="menu section">
        <div className="container section-title" data-aos="fade-up">
          <p><span className="description-title">THỰC ĐƠN</span></p>
          <h2>Thực đơn tại nhà hàng Sincay</h2>
        </div>

        <div className="container mb-4" data-aos="fade-up">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="input-group">
                <span className="input-group-text bg-danger text-white border-danger"><i className="bi bi-search" /></span>
                <input type="text" className="form-control border-danger" placeholder="Tìm món theo tên hoặc mô tả..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                {searchTerm && <button className="btn btn-outline-danger" onClick={() => setSearchTerm("")}>Xóa</button>}
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <ul className="nav d-flex justify-content-center" role="tablist" data-aos="fade-up">
            <li className="nav-item"><a className="nav-link active" data-bs-toggle="tab" data-bs-target="#menu-all"><h4>Tất cả</h4></a></li>
            <li className="nav-item"><a className="nav-link" data-bs-toggle="tab" data-bs-target="#menu-appetizer"><h4>Khai vị</h4></a></li>
            <li className="nav-item"><a className="nav-link" data-bs-toggle="tab" data-bs-target="#menu-spicy"><h4>Mì cay</h4></a></li>
            <li className="nav-item"><a className="nav-link" data-bs-toggle="tab" data-bs-target="#menu-tokbokki"><h4>Tokbokki</h4></a></li>
            <li className="nav-item"><a className="nav-link" data-bs-toggle="tab" data-bs-target="#menu-hotpot"><h4>Lẩu</h4></a></li>
            <li className="nav-item"><a className="nav-link" data-bs-toggle="tab" data-bs-target="#menu-drink"><h4>Đồ uống</h4></a></li>
          </ul>

          <div className="tab-content" data-aos="fade-up">
            <div className="tab-pane fade active show" id="menu-all"><div className="tab-header text-center"><h3>Tất cả sản phẩm</h3></div><div className="row gy-5">{renderMenuItems("all")}</div>{renderPagination("all")}</div>
            <div className="tab-pane fade" id="menu-appetizer"><div className="tab-header text-center"><h3>Khai vị</h3></div><div className="row gy-5">{renderMenuItems("appetizer")}</div>{renderPagination("appetizer")}</div>
            <div className="tab-pane fade" id="menu-spicy"><div className="tab-header text-center"><h3>Mì cay</h3></div><div className="row gy-5">{renderMenuItems("spicy")}</div>{renderPagination("spicy")}</div>
            <div className="tab-pane fade" id="menu-tokbokki"><div className="tab-header text-center"><h3>Lẩu Tokbokki</h3></div><div className="row gy-5">{renderMenuItems("tokbokki")}</div>{renderPagination("tokbokki")}</div>
            <div className="tab-pane fade" id="menu-hotpot"><div className="tab-header text-center"><h3>Lẩu</h3></div><div className="row gy-5">{renderMenuItems("hotpot")}</div>{renderPagination("hotpot")}</div>
            <div className="tab-pane fade" id="menu-drink"><div className="tab-header text-center"><h3>Đồ uống</h3></div><div className="row gy-5">{renderMenuItems("drink")}</div>{renderPagination("drink")}</div>
          </div>
        </div>
      </section>
    </>
  );
}
