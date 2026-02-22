import { Routes, Route, Link } from "react-router-dom";
import Buyer from "./pages/Buyer";
import Seller from "./pages/Seller";
import Driver from "./pages/Driver";

export default function App() {
  return (
    <div>
      {/* 🔗 Navigation */}
      <nav
        style={{
          padding: "12px",
          backgroundColor: "#f5f5f5",
          display: "flex",
          gap: "16px",
          fontWeight: 600
        }}
      >
        <Link to="/">🛒 Buyer</Link>
        <Link to="/seller">🏭 Seller</Link>
        <Link to="/driver">🚚 Driver</Link>
      </nav>

      {/* 🧭 Routes */}
      <Routes>
        <Route path="/" element={<Buyer />} />
        <Route path="/seller" element={<Seller />} />
        <Route path="/driver" element={<Driver />} />
      </Routes>
    </div>
  );
}