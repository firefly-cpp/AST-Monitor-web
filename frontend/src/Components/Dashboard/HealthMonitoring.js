import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Chart } from 'chart.js';
import '../../Styles/Dashboard.css';

const HealthMonitoring = ({ token }) => {
  const [rules, setRules] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [sessionData, setSessionData] = useState({
    hr_max: 220, // Example data
    hr_avg: 120, // Example data
    hr_min: 40,  // Example data
    altitude_avg: 200,
    altitude_max: 300,
    altitude_min: 100,
    ascent: 1000,
    calories: 500,
    descent: 900,
    distance: 50,
    duration: 3600,
    total_distance: 50
  });
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const warningChartRef = useRef(null);
  const warningChartInstanceRef = useRef(null);

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

  const handleCheckSession = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/cyclist/check_session', sessionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarnings(response.data.warnings);
    } catch (error) {
      console.error('Error checking session:', error.response ? error.response.data : error.message);
      setError('Failed to check session: ' + (error.response ? error.response.data.error : error.message));
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchSavedRules = async () => {
      try {
        const response = await axios.get('http://localhost:5000/cyclist/get_saved_rules', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRules(response.data.rules);
      } catch (error) {
        console.error('Error fetching saved rules:', error.response ? error.response.data : error.message);
        setError('Failed to fetch saved rules: ' + (error.response ? error.response.data.error : error.message));
      }
    };

    fetchSavedRules();
  }, [token]);

  useEffect(() => {
    if (rules && rules.length > 0 && chartRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
      
      const ctx = chartRef.current.getContext('2d');
      chartInstanceRef.current = new Chart(ctx, {
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

  useEffect(() => {
    if (warnings && warnings.length > 0 && warningChartRef.current) {
      if (warningChartInstanceRef.current) {
        warningChartInstanceRef.current.destroy();
      }

      const ctx = warningChartRef.current.getContext('2d');
      warningChartInstanceRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: warnings.map((_, index) => `Warning ${index + 1}`),
          datasets: [
            {
              label: 'Warnings',
              data: warnings.map(() => 1),
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
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
  }, [warnings]);

  const generateDescription = (rule) => {
    const lhsDescriptions = rule.lhs.map(condition => {
      const [name, range] = condition.match(/(.+?)\((.+)\)/).slice(1, 2);
      return `${name} is between ${range}`;
    }).join(' AND ');

    const rhsDescriptions = rule.rhs.map(condition => {
      const [name, range] = condition.match(/(.+?)\((.+)\)/).slice(1, 2);
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

  const renderWarning = (warning, index) => (
    <div key={index} className="warning">
      <h4>Warning {index + 1}</h4>
      <p>{warning}</p>
    </div>
  );

  return (
    <div className="health-monitoring">
      <h2>Health Monitoring</h2>
      <div className="button-group">
        <button onClick={handleRunNiaARM} disabled={loading}>
          {loading ? 'Running NiaARM...' : 'Run NiaARM'}
        </button>
        <button onClick={handleCheckSession} disabled={loading}>
          {loading ? 'Checking Session...' : 'Check Session'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {rules && (
        <div>
          <h3>Association Rules</h3>
          {rules.length > 0 ? (
            <>
              {rules.map((rule, index) => renderRule(rule, index))}
              <canvas ref={chartRef} />
            </>
          ) : (
            <p>No rules generated.</p>
          )}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="warnings">
          <h3>Warnings</h3>
          {warnings.map((warning, index) => renderWarning(warning, index))}
          <canvas ref={warningChartRef} />
        </div>
      )}
    </div>
  );
};

export default HealthMonitoring;
