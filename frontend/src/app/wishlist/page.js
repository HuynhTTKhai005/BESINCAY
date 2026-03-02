"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

export default function WishlistPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const parseApiResponse = useCallback(async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    await response.text();
    throw new Error(`API /wishlist trả về dữ liệu không hợp lệ (status ${response.status}).`);
  }, []);

  const fetchWishlist = useCallback(async () => {
    if (!token) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${BACKEND_URL}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });

      const result = await parseApiResponse(response);
      if (!result.success) {
        throw new Error(result.message || "Không thể tải danh sách yêu thích");
      }

      setWishlistItems(result.data || []);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [token, parseApiResponse]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      router.replace("/login");
      return;
    }
    fetchWishlist();
  }, [user, token, authLoading, router, fetchWishlist]);

  const getImageUrl = (url) => {
    if (!url) return "/img/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const formatPrice = (price) => {
    if (!price) return "0";
    return (price > 100000 ? price / 100 : price).toLocaleString("vi-VN");
  };

  const handleRemoveWishlist = async (productId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/wishlist/toggle/${productId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });

      const result = await parseApiResponse(response);
      if (!result.success) {
        throw new Error(result.message || "Không thể cập nhật yêu thích");
      }

      setWishlistItems((prev) => prev.filter((item) => item.product?._id !== productId));
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra");
    }
  };

  const handleAddToCart = (product) => {
    const correctedPrice = product.base_price_cents > 100000 ? product.base_price_cents / 100 : product.base_price_cents;

    addToCart({
      id: product._id,
      name: product.name,
      description: product.description,
      base_price_cents: correctedPrice,
      image_url: product.image_url,
      slug: product.slug,
      category_slug: product.category_id?.slug
    });
  };

  if (loading) {
    return (
      <section className="section">
        <div className="container text-center py-5">Đang tải danh sách yêu thích...</div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container section-title" data-aos="fade-up">
        <p><span className="description-title">YÊU THÍCH</span></p>
        <h2>Sản phẩm yêu thích</h2>
      </div>

      <div className="container">
        {error && <div className="alert alert-danger">{error}</div>}

        {wishlistItems.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-heart" style={{ fontSize: "4rem", color: "#dc3545" }}></i>
            <h4 className="mt-3">Bạn chưa có sản phẩm yêu thích nào</h4>
            <p className="text-muted">Hãy thêm món bạn thích để xem lại nhanh hơn.</p>
            <Link href="/#menu" className="btn btn-danger mt-2">Xem thực đơn</Link>
          </div>
        ) : (
          <div className="row gy-4">
            {wishlistItems.map((item) => {
              const product = item.product;
              if (!product) return null;

              return (
                <div key={item._id} className="col-lg-4 col-md-6">
                  <div className="card h-100 shadow-sm border-0">
                    <Image
                      src={getImageUrl(product.image_url)}
                      alt={product.name}
                      width={500}
                      height={200}
                      className="card-img-top"
                      style={{ objectFit: "cover", height: "320px" }}
                      unoptimized={true}
                    />
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{product.name}</h5>
                      <p className="card-text text-muted">{product.description}</p>
                      <p className="fw-bold text-danger mb-3">{formatPrice(product.base_price_cents)} VNĐ</p>

                      <div className="mt-auto d-flex gap-2">
                        <button className="btn btn-danger flex-grow-1" onClick={() => handleAddToCart(product)}>
                          <i className="bi bi-cart-plus me-2"></i>
                          Thêm vào giỏ
                        </button>
                        <button className="btn btn-outline-danger" onClick={() => handleRemoveWishlist(product._id)} title="Xóa khỏi yêu thích">
                          <i className="bi bi-heartbreak"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
