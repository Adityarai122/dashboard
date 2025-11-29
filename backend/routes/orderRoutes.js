import express from "express";
// FIX: Use named imports because the controller uses named exports
import { 
  searchOrders, 
  getAllOrders, 
  getPendingOrders, 
  getDashboardStats 
} from "../controllers/orderController.js";

const router = express.Router();

router.get("/search", searchOrders);
router.get("/all", getAllOrders);
router.get("/pending", getPendingOrders);
router.get("/stats", getDashboardStats);

export default router;