import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function CostDashboard() {
  const [costData, setCostData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Calls your secure, live serverless cloud engine directly
    fetch('https://azurewebsites.net')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        setCostData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching live Azure FinOps payload:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Querying cloud billing fabric...</div>;

  return (
    <div style={{ width: '100%', height: 400, backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px' }}>
      <h3 style={{ fontFamily: 'sans-serif', color: '#333' }}>Live Monthly Cost Trend (Azure Production Subscription)</h3>
      <ResponsiveContainer>
        <BarChart data={costData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="date" stroke="#666" /> 
          <YAxis dataKey="cost" stroke="#666" /> 
          <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
          <Bar dataKey="cost" fill="#007fff" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CostDashboard;
