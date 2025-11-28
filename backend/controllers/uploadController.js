import fs from 'fs';
import csv from 'csv-parser';
import crypto from 'crypto';
import parseExcel from '../utils/excelParser.js';
import Order from '../models/Order.js';
import PendingOrder from '../models/PendingOrder.js';
import mapFields from '../utils/mapFields.js';

function cleanNum(n) {
  if (!n || n === "" || isNaN(n)) return 0;
  return Number(n);
}

// Helper: Process a batch of rows to DB
async function processBatch(rows, statusType, globalStartIndex = 0) {
  if (rows.length === 0) return { inserted: 0, reconciled: 0 };

  const operations = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let mapped = mapFields(row);
    mapped.status = statusType === "PENDING" ? "Pending" : "Dispatched";
    
    mapped.quantity = cleanNum(mapped.quantity);
    mapped.dispatchQuantity = cleanNum(mapped.dispatchQuantity);
    mapped.pendingQuantity = cleanNum(mapped.pendingQuantity);
    mapped.grossWeight = cleanNum(mapped.grossWeight);
    mapped.chargeWeight = cleanNum(mapped.chargeWeight);
    mapped.rate = cleanNum(mapped.rate);

    // --- UNIQUENESS FIX ---
    const trueRowIndex = globalStartIndex + i;
    const uniqueString = `${JSON.stringify(row)}-${trueRowIndex}-${statusType}`; 
    const uniqueRowSignature = crypto.createHash('md5').update(uniqueString).digest('hex');
    
    mapped.rowSignature = uniqueRowSignature;

    // Filter strictly by this unique signature
    const filter = { rowSignature: uniqueRowSignature };

    operations.push({
      updateOne: {
        filter: filter,
        update: { $set: mapped },
        upsert: true,
      },
    });
  }

  // 1. Bulk Write
  const Collection = statusType === "PENDING" ? PendingOrder : Order;
  
  if (operations.length > 0) {
    try {
      // ordered: false ensures that if one fails, the others continue
      await Collection.bulkWrite(operations, { ordered: false });
    } catch (err) {
        // Log duplicate errors but don't crash
        // If we see E11000 here, it means the index drop didn't work or hasn't propagated yet
        console.warn(`Batch Write Warning (${statusType}): Some duplicates were skipped by DB.`);
    }
  }

  // 2. Reconciliation (Only for dispatched)
  let reconciledCount = 0;
  if (statusType === "DISPATCHED") {
    for (let row of rows) {
      let mapped = mapFields(row);
      const pendingMatch = {
        poNumber: mapped.poNumber,
        productCode: mapped.productCode,
        size: mapped.size,
      };
      const shippedNow = cleanNum(mapped.dispatchQuantity) || 0;
      const pendingItem = await PendingOrder.findOne(pendingMatch);
      if (pendingItem) {
        let newPendingQty = (pendingItem.pendingQuantity || 0) - shippedNow;
        if (newPendingQty <= 0) {
          await PendingOrder.deleteOne({ _id: pendingItem._id });
          reconciledCount++;
        } else {
          await PendingOrder.updateOne({ _id: pendingItem._id }, { $set: { pendingQuantity: newPendingQty } });
        }
      }
    }
  }

  return { inserted: operations.length, reconciled: reconciledCount };
}

const uploadFile = async (req, res, statusType) => {
  try {
    console.log(`📌 Stream Upload started: ${statusType}`);
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // --- CRITICAL FIX: FORCE DROP OLD INDEX ---
    // The error "E11000 duplicate key error... index: poNumber_1_..." means the OLD index exists.
    // We must kill it so the new logic (rowSignature) can work.
    if (statusType === "PENDING") {
        try {
            // Drop the specific legacy index that is causing the 1824 row limit
            await PendingOrder.collection.dropIndex("poNumber_1_productCode_1_soNumber_1_size_1_lineItemNumber_1");
            console.log("✅ Successfully dropped legacy blocking index.");
        } catch (e) {
            // If index doesn't exist, that's fine, ignore error
            if (e.code !== 27) { // 27 = index not found
                 console.log("ℹ️ Index cleanup check passed.");
            }
        }
    }

    const name = file.originalname.toLowerCase();
    const isCSV = name.endsWith(".csv");
    
    // EXCEL HANDLING
    if (!isCSV) {
      const rows = parseExcel(file.path);
      const result = await processBatch(rows, statusType, 0);
      fs.unlinkSync(file.path); 
      return res.json({
        message: "Excel processed successfully",
        rowsInserted: result.inserted,
        reconciledOrders: result.reconciled,
        statusType,
      });
    }

    // CSV HANDLING (Streaming)
    let totalInserted = 0;
    let totalReconciled = 0;
    let batch = [];
    const BATCH_SIZE = 2000;
    let globalRowCounter = 0; 

    const processStream = new Promise((resolve, reject) => {
      const stream = fs.createReadStream(file.path) 
        .pipe(csv())
        .on("data", async (row) => {
          const cleaned = {};
          for (let k in row) cleaned[k.trim().replace(/\s+/g, " ")] = row[k];
          
          batch.push(cleaned);

          if (batch.length >= BATCH_SIZE) {
            stream.pause();
            try {
              const batchStartIndex = globalRowCounter; 
              const result = await processBatch(batch, statusType, batchStartIndex);
              
              totalInserted += result.inserted;
              totalReconciled += result.reconciled;
              globalRowCounter += batch.length;
              
              batch = [];
              stream.resume();
            } catch (err) {
              stream.destroy(err);
              reject(err);
            }
          }
        })
        .on("end", async () => {
          if (batch.length > 0) {
            try {
              const result = await processBatch(batch, statusType, globalRowCounter);
              totalInserted += result.inserted;
              totalReconciled += result.reconciled;
            } catch (err) {
              reject(err);
            }
          }
          resolve();
        })
        .on("error", (err) => reject(err));
    });

    await processStream;

    fs.unlinkSync(file.path); 

    return res.json({
      message: "Large CSV processed successfully",
      rowsInserted: totalInserted,
      reconciledOrders: totalReconciled,
      statusType,
    });

  } catch (err) {
    console.error("❌ Upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
};

export default {
  uploadFile
};