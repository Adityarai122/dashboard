import Order from "../models/Order.js";
import PendingOrder from "../models/PendingOrder.js";
import DispatchSummary from "../models/DispatchSummary.js"; 

// ... (keep buildQuery helper unchanged) ...
const buildQuery = (q, filters) => {
  let query = {};
  
  if (q && q.trim() !== "") {
    const regex = new RegExp(q, "i");
    query.$or = [
      { poNumber: regex },
      { soNumber: regex },
      { productCode: regex },
      { partNumber: regex },
      { customerName: regex },
      { lineItemNumber: regex }
    ];
  }

  if (filters.customer) query.customerName = new RegExp(filters.customer, "i");
  if (filters.poNumber) query.poNumber = new RegExp(filters.poNumber, "i");

  if (filters.startDate || filters.endDate) {
    query.orderDate = {};
    if (filters.startDate) query.orderDate.$gte = filters.startDate;
    if (filters.endDate) query.orderDate.$lte = filters.endDate;
  }

  return query;
};

// 1. UPDATED: Dashboard Analytics
export const getDashboardStats = async (req, res) => {
  try {
    const { range } = req.query; 

    // A. Pending Stats
    const pendingStats = await PendingOrder.aggregate([
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$pendingQuantity", "$rate"] } },
          totalQuantity: { $sum: "$pendingQuantity" }
        }
      }
    ]);

    // B. Dispatched Stats
    const dispatchedStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$dispatchQuantity", "$rate"] } },
          totalQuantity: { $sum: "$dispatchQuantity" }
        }
      }
    ]);

    // C. Today's Activity
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayDispatchStats = await Order.aggregate([
      { 
        $match: { 
          $or: [
            { createdAt: { $gte: startOfDay } }, 
            { updatedAt: { $gte: startOfDay } }
          ]
        } 
      }, 
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$dispatchQuantity", "$rate"] } },
        }
      }
    ]);

    // D. Top 5 Companies by DISPATCHED QUANTITY
    const topDispatchedByQty = await Order.aggregate([
      {
        $group: {
          _id: "$customerName",
          totalQty: { $sum: "$dispatchQuantity" }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 }
    ]);

    // E. Top 5 Pending Companies by QUANTITY
    const topPendingByQty = await PendingOrder.aggregate([
      {
        $group: {
          _id: "$customerName",
          totalQty: { $sum: "$pendingQuantity" }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 }
    ]);

    // F. UPDATED: Recent Dispatch Upload Logs
    // Increased limit to 20 to show more history
    const recentUploadLogs = await DispatchSummary.find()
      .sort({ uploadDate: -1 })
      .limit(20); 

    // G. Dynamic Dispatch Trend
    let limit = 30;
    if (range === '1W') limit = 7;
    if (range === '6M') limit = 180;
    if (range === '1Y') limit = 365;
    if (range === '1D') limit = 1;

    const dailyTrend = await Order.aggregate([
        {
            $group: {
                _id: "$dispatchDate",
                orders: { $sum: 1 },
                value: { $sum: { $multiply: ["$dispatchQuantity", "$rate"] } }
            }
        },
        { $sort: { _id: -1 } }, 
        { $limit: limit },      
        { $sort: { _id: 1 } }   
    ]);

    res.json({
      pending: pendingStats[0] || { totalCount: 0, totalValue: 0, totalQuantity: 0 },
      dispatched: dispatchedStats[0] || { totalCount: 0, totalValue: 0, totalQuantity: 0 },
      today: todayDispatchStats[0] || { totalCount: 0, totalValue: 0 },
      topDispatchedByQty: topDispatchedByQty.map(c => ({ name: c._id || "Unknown", qty: c.totalQty })),
      topPendingByQty: topPendingByQty.map(c => ({ name: c._id || "Unknown", qty: c.totalQty })),
      
      recentUploadLogs: recentUploadLogs, // Now returns up to 20

      trend: dailyTrend.map(t => ({ name: t._id || "N/A", orders: t.orders, value: t.value })),
      rangeUsed: range || '1M'
    });

  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: "Failed to generate analytics" });
  }
};

export const searchOrders = async (req, res) => {
  try {
    const { q, startDate, endDate, customer, poNumber } = req.query;
    const filters = { startDate, endDate, customer, poNumber };
    const query = buildQuery(q, filters);

    const [pendingResults, historyResults] = await Promise.all([
      PendingOrder.find(query).limit(50),
      Order.find(query).limit(50)
    ]);

    const pendingTagged = pendingResults.map(o => ({ ...o._doc, source: "PENDING", status: "Pending" }));
    const historyTagged = historyResults.map(o => ({ ...o._doc, source: "HISTORY", status: "Dispatched" }));

    res.json([...pendingTagged, ...historyTagged]);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const pipeline = [
      { $sort: { createdAt: -1 } },
      { $limit: 500 },
      {
        $group: {
          _id: "$customerName",
          count: { $sum: 1 },
          orders: { $push: "$$ROOT" }
        }
      },
      { $sort: { count: -1 } }
    ];
    const data = await Order.aggregate(pipeline);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const getPendingOrders = async (req, res) => {
  try {
    const { customer, part, dueToday } = req.query;
    let matchStage = {};

    if (customer) matchStage.customerName = new RegExp(customer, "i");
    if (part) {
      const regex = new RegExp(part, "i");
      matchStage.$or = [{ partNumber: regex }, { productCode: regex }];
    }
    if (dueToday === "true") {
      const today = new Date().toISOString().split("T")[0];
      matchStage.expectedDeliveryDate = new RegExp(today, "i"); 
    }

    const pipeline = [
      { $match: matchStage },
      { $sort: { expectedDeliveryDate: 1 } },
      {
        $group: {
          _id: "$customerName",
          count: { $sum: 1 },
          orders: { $push: "$$ROOT" }
        }
      },
      { $sort: { count: -1 } }
    ];

    const data = await PendingOrder.aggregate(pipeline);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pending orders" });
  }
};