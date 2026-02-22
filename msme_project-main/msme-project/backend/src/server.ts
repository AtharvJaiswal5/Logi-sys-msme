import express, { Request, Response } from "express";
import cors from "cors";

import orderRoutes from "./routes/orderRoutes";
import shipmentRoutes from "./routes/shipmentRoutes";
import buyersRoutes from "./routes/buyersRoutes";
import productRoutes from "./routes/productRoutes";
import orderItemRoutes from "./routes/orderItemRoutes";

const app = express();

// ✅ ADD THIS
app.use(cors());

// ✅ IMPORTANT: JSON middleware
app.use(express.json());

// Routes
app.use("/buyers", buyersRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/order-items", orderItemRoutes);
app.use("/shipments", shipmentRoutes);

// Health check
app.get("/", (_req: Request, res: Response) => {
  res.send("MSME Backend Running 🚚");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});