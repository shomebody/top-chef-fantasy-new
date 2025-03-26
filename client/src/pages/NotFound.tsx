
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-display font-bold text-primary-600 dark:text-primary-500">404</h1>
        <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-4">Page Not Found</p>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <div className="mt-8">
          <Link to="/">
            <Button variant="primary" size="lg">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;