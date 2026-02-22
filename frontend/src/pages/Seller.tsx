import { useEffect, useState } from "react";
import { getOrders, confirmOrder } from "../api/api";

export default function Seller() {
  const [orders, setOrders] = useState<any[]>([]);

  const DRIVER_ID = "eaed5bc9-c85d-4bb6-9c76-f8f1db6e67eb";

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(() => alert("Failed to load orders"));
  }, []);

  async function confirm(orderId: string) {
    await confirmOrder(orderId, {
      driver_id: DRIVER_ID,
      pickup_lat: 63.8765,
      pickup_lng: 36.5678,
      drop_lat: 67.4321,
      drop_lng: 69.1234
    });

    alert("Order confirmed");
    location.reload();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🏭 Seller Portal</h2>

      {orders.map(o => (
        <div key={o.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <p>Order: {o.id}</p>
          <p>Status: {o.status}</p>

          {o.status === "PENDING_CONFIRMATION" && (
            <button onClick={() => confirm(o.id)}>Confirm Order</button>
          )}
        </div>
      ))}
    </div>
  );
}