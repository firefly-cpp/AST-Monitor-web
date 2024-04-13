import React, { useState } from 'react';
import Login from './Components/Authentication/Login';
import Protected from './Components/Authentication/Protected';

const App = () => {
  const [token, setToken] = useState('');

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  return (
    <div>
      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Protected token={token} />
      )}
    </div>
  );
};

export default App;
