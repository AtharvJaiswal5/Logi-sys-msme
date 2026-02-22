// frontend/src/api/api.ts

const BASE_URL = "http://localhost:5000";

/* =====================================================
   🛒 PRODUCTS (Buyer)
===================================================== */
export async function getProducts() {
  const res = await fetch(`${BASE_URL}/products`);

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}

/* =====================================================
   🧾 ORDERS (Buyer)
===================================================== */
export async function createOrder(payload: {
  buyer_id: string;
  seller_id: string;
  items: { product_id: string; quantity: number }[];
}) {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to place order");
  }

  return res.json();
}

/* =====================================================
   🏭 ORDERS (Seller)
===================================================== */
export async function getOrders() {
  const res = await fetch(`${BASE_URL}/orders`);

  if (!res.ok) {
    throw new Error("Failed to fetch orders");
  }

  return res.json();
}

export async function confirmOrder(
  orderId: string,
  payload: {
    driver_id: string;
    pickup_lat: number;
    pickup_lng: number;
    drop_lat: number;
    drop_lng: number;
  }
) {
  const res = await fetch(
    `${BASE_URL}/orders/${orderId}/confirm`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to confirm order");
  }

  return res.json();
}