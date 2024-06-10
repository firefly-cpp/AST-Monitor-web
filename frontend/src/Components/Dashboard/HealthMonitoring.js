import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Chart } from 'chart.js';
import '../../Styles/Dashboard.css';

const HealthMonitoring = ({ token }) => {
  const [rules, setRules] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const chartRef = useRef(null);

  const handleRunNiaARM = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/cyclist/run_niaarm', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRules(response.data.rules);
      console.log('Run Time:', response.data.run_time);
    } catch (error) {
      console.error('Error running NiaARM:', error.response ? error.response.data : error.message);
      setError('Failed to run NiaARM: ' + (error.response ? error.response.data.error : error.message));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (rules && rules.length > 0 && chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: rules.map((rule, index) => `Rule ${index + 1}`),
          datasets: [
            {
              label: 'Support',
              data: rules.map(rule => rule.support),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
            {
              label: 'Confidence',
              data: rules.map(rule => rule.confidence),
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
            }
          ]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }, [rules]);

  const generateDescription = (rule) => {
    const lhsDescriptions = rule.lhs.map(condition => {
      const [name, range] = condition.match(/(.+?)\((.+)\)/).slice(1, 3);
      return `${name} is between ${range}`;
    }).join(' AND ');

    const rhsDescriptions = rule.rhs.map(condition => {
      const [name, range] = condition.match(/(.+?)\((.+)\)/).slice(1, 3);
      return `${name} is between ${range}`;
    }).join(' AND ');

    return `If ${lhsDescriptions}, then ${rhsDescriptions}.`;
  };

  const renderRule = (rule, index) => (
    <div key={index} className="rule">
      <h4>Rule {index + 1}</h4>
      <p><strong>IF:</strong> {rule.lhs.join(' AND ')}</p>
      <p><strong>THEN:</strong> {rule.rhs.join(' AND ')}</p>
      <p><strong>Support:</strong> {rule.support}</p>
      <p><strong>Confidence:</strong> {rule.confidence}</p>
      <p><strong>Description:</strong> {generateDescription(rule)}</p>
    </div>
  );

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
          {rules.length > 0 ? (
            <>
              <pre>{JSON.stringify(rules, null, 2)}</pre>
              {rules.map((rule, index) => renderRule(rule, index))}
              <canvas ref={chartRef} />
            </>
          ) : (
            <p>No rules generated.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthMonitoring;
