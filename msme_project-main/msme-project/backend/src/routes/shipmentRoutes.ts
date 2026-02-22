import express, { Request, Response } from "express";
import { supabase } from "../lib/supabase";

const router = express.Router();

/* -----------------------------------------------------
   🚚 DRIVER: Get assigned shipments
----------------------------------------------------- */
router.get("/driver/:driver_id", async (req: Request, res: Response) => {
  const { driver_id } = req.params;

  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("driver_id", driver_id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).send(error);
  res.send(data);
});

/* -----------------------------------------------------
   📍 DRIVER: Update live location + auto OTP
----------------------------------------------------- */
router.patch("/location", async (req: Request, res: Response) => {
  const { shipment_id, lat, lng } = req.body;

  if (!shipment_id || lat == null || lng == null) {
    return res.status(400).json({
      message: "shipment_id, lat, lng required"
    });
  }

  /* --------------------------------------------------
     1️⃣ Fetch shipment FIRST (for validation)
  -------------------------------------------------- */
  const { data: shipment, error: fetchError } = await supabase
    .from("shipments")
    .select("*")
    .eq("id", shipment_id)
    .single() as any;

  if (fetchError || !shipment) {
    return res.status(400).send(fetchError);
  }

  // 🔒 Block if already completed
  if (shipment.status === "COMPLETED") {
    return res.status(400).json({
      message: "Shipment already completed"
    });
  }

  /* --------------------------------------------------
     2️⃣ Update live location
  -------------------------------------------------- */
  await supabase
    .from("shipments")
    .update({
      current_lat: lat,
      current_lng: lng
    })
    .eq("id", shipment_id);

  console.log("📍 LOCATION UPDATE:", {
    shipment_id,
    lat,
    lng,
    pickup: [shipment.pickup_lat, shipment.pickup_lng],
    drop: [shipment.drop_lat, shipment.drop_lng],
    current_status: shipment.status
  });

  let newStatus = shipment.status;

  /* --------------------------------------------------
     3️⃣ Geofencing logic
  -------------------------------------------------- */

  // 🏭 AT PICKUP
  if (
    shipment.pickup_lat !== null &&
    shipment.pickup_lng !== null &&
    Math.abs(shipment.pickup_lat - lat) < 0.02 &&
    Math.abs(shipment.pickup_lng - lng) < 0.02
  ) {
    newStatus = "AT_PICKUP";
  }

  // 🚚 IN TRANSIT
  if (
    shipment.status === "AT_PICKUP" &&
    (
      Math.abs(shipment.pickup_lat - lat) > 0.03 ||
      Math.abs(shipment.pickup_lng - lng) > 0.03
    )
  ) {
    newStatus = "IN_TRANSIT";
  }

  // 📦 DELIVERED (force-safe)
  if (
    shipment.drop_lat !== null &&
    shipment.drop_lng !== null &&
    Math.abs(shipment.drop_lat - lat) < 0.03 &&
    Math.abs(shipment.drop_lng - lng) < 0.03
  ) {
    newStatus = "DELIVERED";
  }

  console.log("🧠 STATUS DEBUG:", {
    old_status: shipment.status,
    computed_new_status: newStatus
  });

  /* --------------------------------------------------
     4️⃣ OTP RECOVERY MODE (idempotent)
  -------------------------------------------------- */
  if (
    shipment.status === "DELIVERED" &&
    (!shipment.otp_code || shipment.otp_code === "")
  ) {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await supabase
      .from("shipments")
      .update({ otp_code: otp })
      .eq("id", shipment_id);

    console.log("🔥 OTP AUTO GENERATED (RECOVERY MODE):", otp);
  }

  /* --------------------------------------------------
     5️⃣ Status change handler + OTP generation
  -------------------------------------------------- */
  if (newStatus !== shipment.status) {

    const updatePayload: any = { status: newStatus };

    // 🔐 Auto OTP on delivery
    if (newStatus === "DELIVERED") {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      updatePayload.otp_code = otp;

      console.log("🔥 OTP AUTO GENERATED:", otp);
    }

    await supabase
      .from("shipments")
      .update(updatePayload)
      .eq("id", shipment_id);

    // 🔄 Sync order status
    const orderStatusMap: Record<string, string> = {
      AT_PICKUP: "READY_FOR_PICKUP",
      IN_TRANSIT: "DISPATCHED",
      DELIVERED: "OUT_FOR_DELIVERY"
    };

    if (orderStatusMap[newStatus]) {
      await supabase
        .from("orders")
        .update({ status: orderStatusMap[newStatus] })
        .eq("id", shipment.order_id);
    }
  }

  res.send({
    shipment_id,
    status: newStatus
  });
});

/* -----------------------------------------------------
   🔐 VERIFY OTP → COMPLETE DELIVERY
----------------------------------------------------- */
router.post("/verify-otp", async (req: Request, res: Response) => {
  const { shipment_id, otp } = req.body;

  if (!shipment_id || !otp) {
    return res.status(400).json({
      message: "shipment_id and otp required"
    });
  }

  const { data: shipment, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("id", shipment_id)
    .single() as any;

  if (error || !shipment) return res.status(400).send(error);

  if (shipment.otp_verified) {
    return res.status(400).json({
      message: "OTP already verified"
    });
  }

  if (shipment.otp_code !== otp) {
    return res.status(400).json({
      message: "Invalid OTP"
    });
  }

  await supabase
    .from("shipments")
    .update({
      status: "COMPLETED",
      otp_verified: true
    })
    .eq("id", shipment_id);

  await supabase
    .from("orders")
    .update({
      status: "COMPLETED"
    })
    .eq("id", shipment.order_id);

  res.send({
    message: "Shipment & Order completed successfully"
  });
});

export default router;