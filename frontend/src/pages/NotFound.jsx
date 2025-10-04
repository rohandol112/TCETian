import { Link } from 'react-router-dom'
import { FiHome, FiArrowLeft } from 'react-icons/fi'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <div className="mb-8">
          <div className="text-8xl md:text-9xl font-bold text-gradient mb-4">
            404
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved to a new location.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/"
            className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center space-x-2"
          >
            <FiHome className="w-5 h-5" />
            <span>Go Home</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="glass border border-white/20 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all duration-200 flex items-center space-x-2"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>
        </div>

        <div className="mt-16">
          <div className="glass rounded-xl p-8 max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4">Need Help?</h3>
            <p className="text-gray-300 mb-6">
              If you think this is an error, please contact our support team.
            </p>
            <Link
              to="mailto:support@tcetian.com"
              className="text-gradient hover:underline font-medium"
            >
              support@tcetian.com
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound