import React, { useState } from 'react';
import axios from 'axios';
import '../../Styles/Dashboard.css';

const HealthMonitoring = ({ token }) => {
  const [rules, setRules] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRunNiaARM = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/cyclist/run_niaarm', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRules(response.data);
    } catch (error) {
      console.error('Error running NiaARM:', error);
      setError('Failed to run NiaARM. Please try again later.');
    }
    setLoading(false);
  };

  return (
    <div className="health-monitoring">
      <h2>Health Monitoring</h2>
      <button onClick={handleRunNiaARM} disabled={loading}>
        {loading ? 'Running NiaARM...' : 'Run NiaARM'}
      </button>
      {error && <p className="error">{error}</p>}
      {rules && (
        <div>
          <h3>Association Rules</h3>
          <pre>{JSON.stringify(rules, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default HealthMonitoring;
