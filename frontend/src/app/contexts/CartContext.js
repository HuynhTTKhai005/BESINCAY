"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

const canAddProduct = (product) => {
  if (!product) return false;
  const isActive = product.is_active !== false;
  const isAvailable = product.is_available !== false;
  const stock = Number(product.stock_quantity ?? 1);
  return isActive && isAvailable && stock > 0;
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { user, token } = useAuth();

  const BACKEND_URL = useMemo(() => {
    const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    return (envUrl || "http://localhost:4000").replace(/\/+$/, "");
  }, []);

  const updateCartCount = (cartItems) => {
    const count = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
    setCartCount(count);
  };

  const syncCartFromServer = async () => {
    if (!user || !token) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });

      if (!response.ok) return;
      const data = await response.json();
      if (!data.success || !data.data) return;

      const mappedItems = (data.data.items || []).map((item) => ({
        ...item,
        id: String(item.product_id || ""),
        _id: item._id
      }));
      setCart(mappedItems);
      updateCartCount(mappedItems);
    } catch (error) {
      console.error("Error syncing cart from server:", error);
    }
  };

  const syncCartToServer = async (cartItems) => {
    if (!user || !token) return;

    try {
      setSyncing(true);
      for (const item of cartItems || []) {
        const productId = String(item.id || item.product_id || "").trim();
        if (!productId) continue;

        const productPayload = {
          id: productId,
          name: item.name,
          description: item.description,
          base_price_cents: Number(item.base_price_cents || 0),
          image_url: item.image_url,
          slug: item.slug,
          spicyInfo: item.spicyInfo || null
        };

        await fetch(`${BACKEND_URL}/api/cart/add`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ product: productPayload, quantity: Number(item.quantity || 1) })
        });
      }

      await syncCartFromServer();
    } catch (error) {
      console.error("Error syncing cart to server:", error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const loadCart = async () => {
      if (user && token) {
        const localCart = localStorage.getItem("cart");
        if (localCart) {
          try {
            const parsedCart = JSON.parse(localCart);
            if ((parsedCart || []).length > 0) {
              await syncCartToServer(parsedCart);
            } else {
              await syncCartFromServer();
            }
          } catch (error) {
            console.error("Error parsing local cart during sync:", error);
            await syncCartFromServer();
          } finally {
            localStorage.removeItem("cart");
          }
        } else {
          await syncCartFromServer();
        }
        return;
      }

      const savedCart = localStorage.getItem("cart");
      if (!savedCart) {
        setCart([]);
        updateCartCount([]);
        return;
      }
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        updateCartCount(parsedCart);
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error);
        setCart([]);
        updateCartCount([]);
      }
    };

    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  useEffect(() => {
    if (!user) {
      if (cart.length > 0) {
        localStorage.setItem("cart", JSON.stringify(cart));
      } else {
        localStorage.removeItem("cart");
      }
    }
  }, [cart, user]);

  useEffect(() => {
    updateCartCount(cart);
  }, [cart]);

  const addToCart = async (product, quantity = 1) => {
    if (!canAddProduct(product)) {
      throw new Error("Sản phẩm đã hết hàng hoặc đang tạm ngừng bán");
    }

    if (!user || !token) {
      const existingItemIndex = cart.findIndex(
        (item) => item.id === product.id && JSON.stringify(item.spicyInfo || {}) === JSON.stringify(product.spicyInfo || {})
      );

      let newCart;
      if (existingItemIndex >= 0) {
        newCart = [...cart];
        newCart[existingItemIndex].quantity = (newCart[existingItemIndex].quantity || 1) + quantity;
      } else {
        newCart = [...cart, { ...product, quantity }];
      }

      setCart(newCart);
      return { success: true, message: "Đã thêm sản phẩm vào giỏ hàng" };
    }

    const response = await fetch(`${BACKEND_URL}/api/cart/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ product, quantity })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không thể thêm sản phẩm vào giỏ hàng");
    }

    await syncCartFromServer();
    return { success: true, message: "Đã thêm sản phẩm vào giỏ hàng" };
  };

  const removeFromCart = async (itemIdentifier) => {
    if (user && token) {
      const item = cart.find((it) => it._id === itemIdentifier || it.id === itemIdentifier);
      if (item && item._id) {
        await fetch(`${BACKEND_URL}/api/cart/remove`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ itemId: item._id })
        });
        await syncCartFromServer();
      }
      return;
    }

    setCart(cart.filter((item) => item.id !== itemIdentifier));
  };

  const updateQuantity = async (itemIdentifier, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemIdentifier);
      return;
    }

    if (user && token) {
      const item = cart.find((it) => it._id === itemIdentifier || it.id === itemIdentifier);
      if (item && item._id) {
        await fetch(`${BACKEND_URL}/api/cart/update`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ itemId: item._id, quantity })
        });
        await syncCartFromServer();
      }
      return;
    }

    setCart(cart.map((item) => (item.id === itemIdentifier ? { ...item, quantity } : item)));
  };

  const clearCart = async () => {
    setCart([]);

    if (user && token) {
      try {
        await fetch(`${BACKEND_URL}/api/cart/clear`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        });
      } catch (error) {
        console.error("Error clearing cart on server:", error);
      }
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = Number(item.base_price_cents || 0);
      return total + price * Number(item.quantity || 1);
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        syncing,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
