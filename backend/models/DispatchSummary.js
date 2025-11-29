import mongoose from "mongoose";

const DispatchSummarySchema = new mongoose.Schema(
  {
    uploadDate: { type: Date, default: Date.now },
    totalItems: { type: Number, required: true },
    fileName: { type: String, default: "" },
    batchId: { type: String, default: "" }
  },
  { timestamps: true }
);

// We can add an index on uploadDate for faster range queries
DispatchSummarySchema.index({ uploadDate: -1 });

export default mongoose.model("DispatchSummary", DispatchSummarySchema);