import React from "react";

export default function OrdersTable({ data }) {
  if (!data || data.length === 0) {
    return <p>No records found.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ backgroundColor: "#eee" }}>
          <tr>
            <th>PO Number</th>
            <th>Product Code</th>
            <th>Part No</th>
            <th>Customer</th>
            <th>Pending Qty</th>
            <th>Dispatched Qty</th>
            <th>Status</th>
            <th>Expected Date</th>
          </tr>
        </thead>

        <tbody>
          {data.map((o) => (
            <tr key={o._id}>
              <td>{o.poNumber}</td>
              <td>{o.productCode}</td>
              <td>{o.partNumber}</td>
              <td>{o.customerName}</td>
              
              {/* Highlight Pending Quantity if it exists */}
              <td style={{ fontWeight: o.pendingQuantity > 0 ? "bold" : "normal", color: o.pendingQuantity > 0 ? "red" : "black" }}>
                {o.pendingQuantity}
              </td>
              
              <td>{o.dispatchQuantity}</td>
              
              <td>
                <span style={{ 
                  padding: "4px 8px", 
                  borderRadius: "4px", 
                  backgroundColor: o.status === "Pending" ? "#fff3cd" : "#d4edda",
                  color: o.status === "Pending" ? "#856404" : "#155724"
                }}>
                  {o.status || (o.pendingQuantity > 0 ? "Pending" : "Dispatched")}
                </span>
              </td>
              
              <td>
                {o.expectedDeliveryDate ? o.expectedDeliveryDate.substring(0, 10) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}