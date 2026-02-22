import express, { Request, Response } from "express";
import { supabase } from "../lib/supabase";

const router = express.Router();

// 🧑‍💼 CREATE BUYER
router.post("/", async (req: Request, res: Response) => {

  const { name, email, phone } = req.body;

  const { data, error } = await supabase
    .from("buyers")
    .insert([
      {
        name,
        email,
        phone
      }
    ])
    .select()
    .single();

  if (error) {
    return res.status(400).send(error);
  }

  res.send(data);
});


// 📄 GET ALL BUYERS
router.get("/", async (_req: Request, res: Response) => {

  const { data, error } = await supabase
    .from("buyers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).send(error);
  }

  res.send(data);
});

export default router;
