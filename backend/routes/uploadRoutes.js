import express from "express";
import multer from "multer";
// FIX: Use named import { uploadFile } instead of default import
import { uploadFile } from "../controllers/uploadController.js";

const router = express.Router();
// Allow up to 10 files at once
const upload = multer({ dest: "uploads/" });

// Upload for Pending Orders
// Uses upload.array('file', 10) to accept multiple files
router.post("/pending", upload.array("file", 10), (req, res) =>
  uploadFile(req, res, "PENDING")
);

// Upload for Dispatched Orders
router.post("/dispatched", upload.array("file", 10), (req, res) =>
  uploadFile(req, res, "DISPATCHED")
);

export default router;