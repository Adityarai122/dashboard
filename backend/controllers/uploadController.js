import fs from 'fs';
import csv from 'csv-parser';
import crypto from 'crypto';
import parseExcel from '../utils/excelParser.js';
import Order from '../models/Order.js';
import PendingOrder from '../models/PendingOrder.js';
import DispatchSummary from '../models/DispatchSummary.js';
import mapFields from '../utils/mapFields.js';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

function cleanNum(n) {
  if (!n || n === "" || isNaN(n)) return 0;
  return Number(n);
}

// =========================================================
//  WORKER THREAD LOGIC (Runs in background threads)
// =========================================================
if (!isMainThread) {
  const { filePath, statusType } = workerData;

  (async () => {
    try {
      const isCSV = filePath.toLowerCase().endsWith(".csv");
      let rows = [];

      if (!isCSV) {
         rows = parseExcel(filePath);
      } else {
         // CSV Parsing logic
         const results = [];
         await new Promise((resolve, reject) => {
           fs.createReadStream(filePath)
             .pipe(csv())
             .on('data', (data) => {
               const cleaned = {};
               for (let k in data) cleaned[k.trim().replace(/\s+/g, " ")] = data[k];
               results.push(cleaned);
             })
             .on('end', () => {
               rows = results;
               resolve();
             })
             .on('error', reject);
         });
      }

      const operations = [];
      let totalQty = 0; 

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

          // Track Quantity Correctly
          if (statusType === "DISPATCHED") {
              totalQty += (mapped.dispatchQuantity || 0);
          } else {
              totalQty += (mapped.pendingQuantity || mapped.quantity || 0);
          }

          // Generate Unique Signature (Row Content + Type)
          const uniqueString = `${JSON.stringify(row)}-${statusType}`; 
          const uniqueRowSignature = crypto.createHash('md5').update(uniqueString).digest('hex');
          
          mapped.rowSignature = uniqueRowSignature;

          operations.push({
              filter: { rowSignature: uniqueRowSignature },
              update: { $set: mapped }
          });
      }

      // Send processed operations back to main thread
      parentPort.postMessage({ status: 'done', operations, totalQty, filePath });

    } catch (error) {
      parentPort.postMessage({ status: 'error', error: error.message });
    }
  })();
}

// =========================================================
//  MAIN THREAD HELPERS (Database & Orchestration)
// =========================================================

async function commitBatchToDB(operations, statusType) {
    if (operations.length === 0) return { inserted: 0, reconciled: 0 };

    const Collection = statusType === "PENDING" ? PendingOrder : Order;
    
    const bulkOps = operations.map(op => ({
        updateOne: {
            filter: op.filter,
            update: op.update,
            upsert: true
        }
    }));

    // 1. Bulk Write History/Pending
    try {
        await Collection.bulkWrite(bulkOps, { ordered: false });
    } catch (err) {
        console.warn(`Batch Write Warning (${statusType}): ${err.message}`);
    }

    // 2. Reconciliation (Only for dispatched)
    let reconciledCount = 0;
    if (statusType === "DISPATCHED") {
        const poNumbers = bulkOps.map(op => op.updateOne.update.$set.poNumber);
        const productCodes = bulkOps.map(op => op.updateOne.update.$set.productCode);

        const pendingCandidates = await PendingOrder.find({
            poNumber: { $in: poNumbers },
            productCode: { $in: productCodes }
        });

        const pendingMap = new Map();
        pendingCandidates.forEach(p => {
            const key = `${p.poNumber}_${p.productCode}_${p.size}`;
            pendingMap.set(key, p);
        });

        const pendingUpdates = [];
        const pendingDeletes = [];

        for (const op of bulkOps) {
            const mapped = op.updateOne.update.$set;
            const key = `${mapped.poNumber}_${mapped.productCode}_${mapped.size}`;
            const pendingItem = pendingMap.get(key);

            if (pendingItem) {
                const shippedNow = mapped.dispatchQuantity || 0;
                let newPendingQty = (pendingItem.pendingQuantity || 0) - shippedNow;
                
                pendingItem.pendingQuantity = newPendingQty; 

                if (newPendingQty <= 0) {
                    pendingDeletes.push(pendingItem._id);
                    pendingMap.delete(key); 
                    reconciledCount++;
                } else {
                    pendingUpdates.push({
                        updateOne: {
                            filter: { _id: pendingItem._id },
                            update: { $set: { pendingQuantity: newPendingQty } }
                        }
                    });
                }
            }
        }

        if (pendingDeletes.length > 0) {
            await PendingOrder.deleteMany({ _id: { $in: pendingDeletes } });
        }
        if (pendingUpdates.length > 0) {
            await PendingOrder.bulkWrite(pendingUpdates);
        }
    }

    return { inserted: operations.length, reconciled: reconciledCount };
}

function runWorker(file, statusType) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
            workerData: { 
                filePath: file.path, 
                statusType, 
                fileOriginalName: file.originalname 
            }
        });

        worker.on('message', async (message) => {
            if (message.status === 'done') {
                try {
                    const result = await commitBatchToDB(message.operations, statusType);
                    try { fs.unlinkSync(message.filePath); } catch(e){}

                    resolve({
                        fileName: file.originalname, // Map the original name correctly
                        rows: result.inserted,
                        reconciled: result.reconciled,
                        totalQty: message.totalQty // Ensure this comes from worker
                    });
                } catch (dbErr) {
                    reject(dbErr);
                }
            } else if (message.status === 'error') {
                reject(new Error(message.error));
            }
        });

        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
}

// =========================================================
//  CONTROLLER EXPORT
// =========================================================

export const uploadFile = async (req, res, statusType) => {
  try {
    console.log(`📌 Multi-Thread Upload started: ${statusType}`);
    
    const files = req.files || (req.file ? [req.file] : []);
    
    if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });
    if (files.length > 10) return res.status(400).json({ error: "Max 10 files allowed at a time" });

    if (statusType === "PENDING") {
        try {
            await PendingOrder.collection.dropIndex("poNumber_1_productCode_1_soNumber_1_size_1_lineItemNumber_1");
        } catch (e) {}
    }

    const filePromises = files.map(file => runWorker(file, statusType));
    const results = await Promise.all(filePromises);

    let totalInserted = 0;
    let totalReconciled = 0;

    for (const res of results) {
        totalInserted += res.rows;
        totalReconciled += res.reconciled;

        // --- UPDATE: Log ALL file uploads (Pending & Dispatched) ---
        // This ensures the dashboard history updates for any file type.
        if (res.totalQty >= 0) {
            // We use 'create' to ensure a new entry is added for every upload event
            await DispatchSummary.create({
                totalItems: res.totalQty,
                fileName: res.fileName,
                uploadDate: new Date(),
                batchId: statusType // Storing type in batchId field or we can add a new field if schema supports
            });
        }
    }

    return res.json({
      message: `Processed ${files.length} files successfully`,
      filesProcessed: results.map(r => r.fileName),
      rowsInserted: totalInserted,
      reconciledOrders: totalReconciled,
      statusType,
    });

  } catch (err) {
    console.error("❌ Upload error:", err);
    return res.status(500).json({ error: "Upload failed: " + err.message });
  }
};