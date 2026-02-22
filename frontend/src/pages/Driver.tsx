import { useEffect, useState } from "react";

const BASE_URL = "http://localhost:5000";

export default function Driver() {
  const DRIVER_ID = "eaed5bc9-c85d-4bb6-9c76-f8f1db6e67eb"; // temp test driver

  const [shipments, setShipments] = useState<any[]>([]);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  async function loadShipments() {
    const res = await fetch(`${BASE_URL}/shipments/driver/${DRIVER_ID}`);
    const data = await res.json();
    setShipments(data);
  }

  async function updateLocation(shipment_id: string) {
    await fetch(`${BASE_URL}/shipments/location`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipment_id,
        lat: Number(lat),
        lng: Number(lng)
      })
    });

    alert("Location updated");
    loadShipments();
  }

  async function verifyOtp(shipment_id: string) {
    const otp = prompt("Enter OTP");
    if (!otp) return;

    const res = await fetch(`${BASE_URL}/shipments/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipment_id, otp })
    });

    const data = await res.json();
    alert(data.message);
    loadShipments();
  }

  useEffect(() => {
    loadShipments();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🚚 Driver Dashboard</h2>

      <input
        placeholder="Latitude"
        value={lat}
        onChange={(e) => setLat(e.target.value)}
      />
      <input
        placeholder="Longitude"
        value={lng}
        onChange={(e) => setLng(e.target.value)}
      />

      <hr />

      {shipments.map((s) => (
        <div key={s.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
          <p><b>Shipment:</b> {s.id}</p>
          <p><b>Status:</b> {s.status}</p>
          <p><b>OTP:</b> {s.otp_code || "Not generated yet"}</p>

          <button onClick={() => updateLocation(s.id)}>
            📍 Update Location
          </button>

          {s.status === "DELIVERED" && (
            <button onClick={() => verifyOtp(s.id)}>
              🔐 Verify OTP
            </button>
          )}
        </div>
      ))}
    </div>
  );
}