import express, { Request, Response } from "express";
import { supabase } from "../lib/supabase";

const router = express.Router();

/* -----------------------------------------------------
   ➕ ADD ITEM TO EXISTING ORDER (Buyer)
----------------------------------------------------- */
router.post("/", async (req: Request, res: Response) => {

  const { order_id, product_id, quantity } = req.body;

  // 🔐 Basic validation
  if (!order_id || !product_id || !quantity || quantity <= 0) {
    return res.status(400).json({
      message: "order_id, product_id, quantity required"
    });
  }

  /* --------------------------------------------------
     1️⃣ Fetch order
  -------------------------------------------------- */
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", order_id)
    .single();

  if (orderError || !order) {
    return res.status(400).json({
      message: "Order not found"
    });
  }

  // 🔒 Lock order once confirmed
  if (order.status !== "PENDING_CONFIRMATION") {
    return res.status(400).json({
      message: "Order already confirmed. Cannot modify items."
    });
  }

  /* --------------------------------------------------
     2️⃣ Fetch product
  -------------------------------------------------- */
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, price, stock_quantity")
    .eq("id", product_id)
    .single();

  if (productError || !product) {
    return res.status(400).json({
      message: "Product not found"
    });
  }

  // 📦 Stock check
  if (product.stock_quantity < quantity) {
    return res.status(400).json({
      message: "Insufficient stock",
      available: product.stock_quantity,
      requested: quantity
    });
  }

  /* --------------------------------------------------
     3️⃣ Insert order item
  -------------------------------------------------- */
  const { error: itemError } = await supabase
    .from("order_items")
    .insert([
      {
        order_id,
        product_id,
        quantity,
        price_at_purchase: product.price
      }
    ]);

  if (itemError) {
    return res.status(400).send(itemError);
  }

  /* --------------------------------------------------
     4️⃣ Deduct inventory
  -------------------------------------------------- */
  const newStock = product.stock_quantity - quantity;

  const { error: stockError } = await supabase
    .from("products")
    .update({ stock_quantity: newStock })
    .eq("id", product_id);

  if (stockError) {
    return res.status(400).send(stockError);
  }

  res.send({
    message: "Item added to order",
    order_id,
    product_id,
    remaining_stock: newStock
  });
});

export default router;