import express, { Request, Response } from "express";
import { supabase } from "../lib/supabase";

const router = express.Router();

/* -----------------------------------------------------
   🧾 CREATE ORDER WITH ITEMS (Buyer)
----------------------------------------------------- */
router.post("/", async (req: Request, res: Response) => {

  console.log("📥 Incoming Order Payload:", req.body);

  const { buyer_id, seller_id, items } = req.body;

  if (!buyer_id || !seller_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).send({
      message: "Invalid order payload",
      received: req.body
    });
  }

  // 1️⃣ Create Order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        buyer_id,
        seller_id,
        status: "PENDING_CONFIRMATION"
      }
    ])
    .select()
    .single();

  if (orderError || !order) {
    console.error("❌ Order creation failed:", orderError);
    return res.status(400).send(orderError);
  }

  console.log("✅ Order created:", order.id);

  // 2️⃣ Process each item
  for (const item of items) {

    // Fetch product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, price, stock_quantity")
      .eq("id", item.product_id)
      .single();

    if (productError || !product) {
      return res.status(400).send({
        message: "Product not found",
        product_id: item.product_id
      });
    }

    // Stock check
    if (product.stock_quantity < item.quantity) {
      return res.status(400).send({
        message: "Insufficient stock",
        available: product.stock_quantity,
        requested: item.quantity
      });
    }

    // Insert order item
    const { error: itemError } = await supabase
      .from("order_items")
      .insert([
        {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_purchase: product.price
        }
      ]);

    if (itemError) {
      console.error("❌ Order item insert failed:", itemError);
      return res.status(400).send(itemError);
    }

    // Deduct inventory
    const newStock = product.stock_quantity - item.quantity;

    const { error: stockError } = await supabase
      .from("products")
      .update({ stock_quantity: newStock })
      .eq("id", item.product_id);

    if (stockError) {
      console.error("❌ Inventory update failed:", stockError);
      return res.status(400).send(stockError);
    }
  }

  res.send({
    message: "Order placed successfully",
    order_id: order.id
  });
});

/* -----------------------------------------------------
   🧾 GET ALL ORDERS (Admin / Seller / Buyer)
----------------------------------------------------- */
router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).send(error);
  }

  res.send(data);
});

/* -----------------------------------------------------
   🧾 GET SINGLE ORDER (With Items)
----------------------------------------------------- */
router.get("/:order_id", async (req: Request, res: Response) => {
  const { order_id } = req.params;

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        product_id,
        quantity,
        price_at_purchase
      )
    `)
    .eq("id", order_id)
    .single();

  if (error) {
    return res.status(400).send(error);
  }

  res.send(data);
});

/* -----------------------------------------------------
   ✅ SELLER CONFIRMS ORDER → AUTO CREATE SHIPMENT
----------------------------------------------------- */
router.patch("/:order_id/confirm", async (req: Request, res: Response) => {
  const { order_id } = req.params;
  const { driver_id, pickup_lat, pickup_lng, drop_lat, drop_lng } = req.body;

  // 1️⃣ Update order status
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .update({ status: "CONFIRMED" })
    .eq("id", order_id)
    .select()
    .single();

  if (orderError || !order) {
    return res.status(400).send(orderError);
  }

  // 2️⃣ Auto-create shipment
  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .insert([
      {
        order_id: order.id,
        driver_id,
        pickup_lat,
        pickup_lng,
        drop_lat,
        drop_lng,
        status: "CREATED"
      }
    ])
    .select()
    .single();

  if (shipmentError) {
    return res.status(400).send(shipmentError);
  }

  res.send({
    message: "Order confirmed & shipment created",
    order,
    shipment
  });
});

export default router;