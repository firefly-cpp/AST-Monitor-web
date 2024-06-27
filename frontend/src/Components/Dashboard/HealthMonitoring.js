import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Styles/Dashboard.css';

const HealthMonitoring = ({ token }) => {
  const [rules, setRules] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [sessionData] = useState({
    hr_max: 220,
    hr_avg: 120,
    hr_min: 40,
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
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
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

  const formatWarningMessage = (warning, pattern) => {
    const lhsConditions = (pattern.lhs || []).map(condition => {
      const match = condition.match(/(.+?)\((.+)\)/);
      if (match) {
        const [name, range] = match.slice(1, 3);
        return `${name} is between <strong>${range}</strong>`;
      }
      return condition;
    }).join(' and ');

    const rhsConditions = (pattern.rhs || []).map(condition => {
      const match = condition.match(/(.+?)\((.+)\)/);
      if (match) {
        const [name, range] = match.slice(1, 3);
        return `${name} is between <strong>${range}</strong>`;
      }
      return condition;
    }).join(' and ');

    let heartRateWarning = '';
    let warningTitle = 'Heart Rate Warning';

    if (warning.includes('hr_max')) {
      const hrMaxMatch = warning.match(/hr_max\(\[([\d.]+), ([\d.]+)\]\)/);
      if (hrMaxMatch) {
        const hrMaxValue = parseFloat(hrMaxMatch[2]);
        if (hrMaxValue > 200) {
          heartRateWarning = ' <strong>Your maximum heart rate is too high.</strong>';
          warningTitle = 'High Heart Rate Warning';
        }
      }
    }
    if (warning.includes('hr_min')) {
      const hrMinMatch = warning.match(/hr_min\(\[([\d.]+), ([\d.]+)\]\)/);
      if (hrMinMatch) {
        const hrMinValue = parseFloat(hrMinMatch[1]);
        if (hrMinValue < 50) {
          heartRateWarning = ' <strong>Your minimum heart rate is too low.</strong>';
          warningTitle = 'Low Heart Rate Warning';
        }
      }
    }

    return {
      message: `<strong>Careful!</strong> When your ${lhsConditions}, <strong>then</strong> ${rhsConditions}. This could indicate potential health risks based on your recent session data. ${heartRateWarning} Please monitor your health metrics closely.`,
      title: warningTitle
    };
  };

  const getRelevantRules = (warning) => {
    if (!rules) return [];

    const warningConditions = warning.match(/(\w+)\(\[([\d.]+), ([\d.]+)\]\)|(\w+)\(([\d-: ]+)\)/g);
    if (!warningConditions) return [];

    const relevantRules = rules.filter(rule => {
      const ruleConditions = [...(rule.lhs || []), ...(rule.rhs || [])];
      return ruleConditions.some(condition => warningConditions.includes(condition));
    });

    return relevantRules;
  };

  const renderRule = (rule, index) => (
    <div key={index} className="rule-card">
      <h4>Based on Injury Pattern</h4>
      <p><strong>WHEN:</strong> {(rule.lhs || []).join(' and ')}</p>
      <p><strong>THEN:</strong> {(rule.rhs || []).join(' and ')}</p>
      <p><strong>Confidence: </strong>{rule.confidence.toFixed(2)} - Indicates how often the rule is correct.</p>
    </div>
  );

  const renderWarning = (warning, index) => {
    const relevantRules = getRelevantRules(warning);
    if (relevantRules.length === 0) return null;  // No relevant rules found, skip rendering

    const { message, title } = formatWarningMessage(warning, relevantRules[0]);
    return (
      <div key={index} className="warning-card">
        <h4>{title}</h4>
        <p dangerouslySetInnerHTML={{ __html: message }} />
        <div className="relevant-rules">
          {relevantRules.map((rule, ruleIndex) => renderRule(rule, ruleIndex))}
        </div>
      </div>
    );
  };

  const groupedWarnings = warnings.reduce((acc, warning) => {
    const relevantRules = getRelevantRules(warning);
    if (relevantRules.length === 0) return acc;  // No relevant rules found, skip grouping

    const { title, message } = formatWarningMessage(warning, relevantRules[0]);
    if (!acc[title]) {
      acc[title] = [];
    }
    acc[title].push({ message, warning });
    return acc;
  }, {});

  // Filter out only the High Heart Rate and Low Heart Rate warnings
  const filteredWarnings = Object.keys(groupedWarnings)
    .filter(title => title === 'High Heart Rate Warning' || title === 'Low Heart Rate Warning')
    .reduce((acc, title) => {
      acc[title] = groupedWarnings[title];
      return acc;
    }, {});

  return (
    <div className="health-monitoring">
      <h2>Health Monitoring</h2>
      <div className="button-group">
        <div className="button-section">
          <p>Run the program to find health patterns from your previous training sessions using machine learning.</p>
          <button onClick={handleRunNiaARM} disabled={loading}>
            {loading ? 'Running NiaARM...' : 'Find Patterns'}
          </button>
        </div>
        <hr className="button-divider" />
        <div className="button-section">
          <p>Check the last session for any health risks identified through data analysis.</p>
          <button onClick={handleCheckSession} disabled={loading}>
            {loading ? 'Checking Session...' : 'Check Session'}
          </button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {Object.keys(filteredWarnings).length > 0 && (
        <div className="warnings-container">
          <div className="warning-groups">
            {Object.keys(filteredWarnings).map((title, index) => (
              <div key={index} className="warning-group">
                <h3>{title}</h3>
                {filteredWarnings[title].map((item, subIndex) => renderWarning(item.warning, subIndex))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthMonitoring;
