import React from 'react';
import axios from 'axios';

const Protected = ({ token }) => {
  const [protectedData, setProtectedData] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/auth/protected', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setProtectedData(response.data);
      } catch (error) {
        console.error("Error fetching protected data", error.response);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  if (!protectedData) return <div>No data to display</div>;

  return (
    <div>
      <h3>Protected Data:</h3>
      <pre>{JSON.stringify(protectedData, null, 2)}</pre>
    </div>
  );
};

export default Protected;
