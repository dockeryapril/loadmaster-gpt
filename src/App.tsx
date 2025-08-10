// Redirect to v1 app
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // This is a temporary redirect - in production you'd handle routing differently
    window.location.href = '/v1';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to LoadMaster Pro...</p>
    </div>
  );
}

export default App;