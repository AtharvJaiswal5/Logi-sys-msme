import express, { Request, Response } from "express";
import { supabase } from "../lib/supabase";

const router = express.Router();


// 🛒 GET ALL PRODUCTS (Buyer View)
router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).send(error);
  }

  res.send(data);
});


// ➕ CREATE PRODUCT (Seller)
router.post("/", async (req: Request, res: Response) => {

  console.log("Incoming Product Body:", req.body); // 🔍 DEBUG LINE

  const seller_id = req.body.seller_id;
  const name = req.body.name;
  const price = req.body.price;
  const stock_quantity = req.body.stock_quantity;

  // 🔐 Hard validation
  if (
    seller_id === undefined ||
    name === undefined ||
    price === undefined ||
    stock_quantity === undefined
  ) {
    return res.status(400).send({
      message: "seller_id, name, price, stock_quantity are required",
      received: req.body
    });
  }

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        seller_id,
        name,
        price,
        stock_quantity
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Supabase Insert Error:", error);
    return res.status(400).send(error);
  }

  res.send(data);
});

export default router;