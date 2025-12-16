
import type { JSX } from 'react';
import { useState } from 'react';

function App(): JSX.Element {
  const [isBlue, setIsBlue] = useState(false);

  return (
    <div className={`min-h-screen flex items-center justify-center ${isBlue ? 'bg-blue-100' : 'bg-gray-100'} transition-colors`}>
      <button
        className="px-6 py-3 rounded-full bg-green-600 text-white shadow-lg transition-colors duration-200 hover:bg-pink-600 active:scale-95"
        onClick={() => setIsBlue(!isBlue)}
      >
        Beautiful Button
      </button>
    </div>
  );
}

export default App;
  
