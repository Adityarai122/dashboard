import React, { useState } from "react";
import API from "../api/axiosClient";

export default function SearchBar({ onResults }) {
  const [query, setQuery] = useState("");

  const search = async () => {
    const res = await API.get(`/orders/search?q=${query}`);
    onResults(res.data);
  };

  return (
    <div>
      <input
        placeholder="Search PO, Serial, Part, Customer..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={search}>Search</button>
    </div>
  );
}