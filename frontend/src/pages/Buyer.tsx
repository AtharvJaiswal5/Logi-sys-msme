import { useEffect, useState } from "react";
import { getProducts, createOrder } from "../api/api";

export default function Buyer() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const BUYER_ID = "96d6f8b0-c504-40f6-8a31-b0b160fb7a4e";
  const SELLER_ID = "c319182e-b86a-4a13-b2e2-1c01a8f64f54";

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => alert("Failed to load products"));
  }, []);

  function addToCart(product: any) {
    setCart((prev) => {
      const found = prev.find(p => p.product_id === product.id);
      if (found) {
        return prev.map(p =>
          p.product_id === product.id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }
      return [...prev, { product_id: product.id, quantity: 1 }];
    });
  }

  async function placeOrder() {
    if (cart.length === 0) return alert("Cart is empty");

    setLoading(true);
    try {
      await createOrder({
        buyer_id: BUYER_ID,
        seller_id: SELLER_ID,
        items: cart
      });

      alert("Order placed successfully");
      setCart([]);
    } catch {
      alert("Order failed");
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🛒 Buyer Portal</h2>

      {products.map(p => (
        <div key={p.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <h4>{p.name}</h4>
          <p>₹{p.price}</p>
          <p>Stock: {p.stock_quantity}</p>
          <button onClick={() => addToCart(p)}>Add</button>
        </div>
      ))}

      <hr />

      <h3>Cart</h3>
      {cart.map(c => (
        <p key={c.product_id}>
          {c.product_id} × {c.quantity}
        </p>
      ))}

      <button onClick={placeOrder} disabled={loading}>
        {loading ? "Placing..." : "Place Order"}
      </button>
    </div>
  );
}