import React, { useState } from 'react';
import Login from './Components/Authentication/Login';
import Register from './Components/Authentication/Register';
import Dashboard from './Components/Dashboard/Dashboard';

const App = () => {
  const [token, setToken] = useState('');

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  return (
    <div>
      {!token ? (
        <div>
          <Login onLogin={handleLogin} />
          <Register onRegister={handleLogin} />
        </div>
      ) : (
        <Dashboard />
      )}
    </div>
  );
};

export default App;
