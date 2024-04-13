import React, { useState } from 'react';
import Login from './Components/Authentication/Login';
import Dashboard from './Components/Dashboard/Dashboard';
import Protected from './Components/Authentication/Protected';

const App = () => {
  const [token, setToken] = useState('');

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  return (
    <div>
      {!token ? (
        // Render Login if there is no token
        <Login onLogin={handleLogin} />
      ) : (
        // Once logged in, render the Protected component, which includes Dashboard
        <Protected token={token}>
          <Dashboard />
        </Protected>
      )}
    </div>
  );
};

export default App;
