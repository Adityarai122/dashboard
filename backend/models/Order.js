import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, default: "" },
    soNumber: { type: String, default: "" },
    orderNumber: { type: String, default: "" },
    productCode: { type: String, default: "" },
    partNumber: { type: String, default: "" },
    size: { type: String, default: "" },
    drawingNumber: { type: String, default: "" },
    customerName: { type: String, default: "" },
    customerCode: { type: String, default: "" },

    // Added to ensure uniqueness for individual line items
    lineItemNumber: { type: String, default: "" },
    
    // --- CRITICAL FIX: Add rowSignature to Schema ---
    rowSignature: { type: String, default: "" },

    quantity: { type: Number, default: 0 },
    dispatchQuantity: { type: Number, default: 0 },
    pendingQuantity: { type: Number, default: 0 },

    grossWeight: { type: Number, default: 0 },
    chargeWeight: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },

    soDate: { type: String, default: "" },
    orderDate: { type: String, default: "" },
    dispatchDate: { type: String, default: "" },
    expectedDeliveryDate: { type: String, default: "" },
    packSlipDate: { type: String, default: "" },

    invoiceDate: { type: String, default: "" },
    invoiceNumber: { type: String, default: "" },
    truckNumber: { type: String, default: "" },
    transport: { type: String, default: "" },

    departmentRemark: { type: String, default: "" },
    soSpecialRemark: { type: String, default: "" },
    dieIndent: { type: String, default: "" },

    source: { type: String, default: "" },

    raw: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);