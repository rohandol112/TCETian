import { Link } from 'react-router-dom'
import { FiGithub, FiMail, FiHeart } from 'react-icons/fi'

const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-white/10 mt-20">
      <div className="glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 text-2xl font-bold text-gradient mb-4">
                <span>🎓</span>
                <span>TCETian</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                The ultimate platform for Thakur College of Engineering and Technology students. 
                Connect, collaborate, and create amazing experiences together.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="#" 
                  className="p-2 rounded-lg glass hover:bg-white/10 transition-all duration-200"
                  aria-label="GitHub"
                >
                  <FiGithub className="w-5 h-5" />
                </a>
                <a 
                  href="mailto:contact@tcetian.com" 
                  className="p-2 rounded-lg glass hover:bg-white/10 transition-all duration-200"
                  aria-label="Email"
                >
                  <FiMail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { name: 'Home', path: '/' },
                  { name: 'Events', path: '/events' },
                  { name: 'Social', path: '/social' },
                  { name: 'Profile', path: '/profile' }
                ].map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="block text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-300">
                <p>Thakur College of Engineering and Technology</p>
                <p>Kandivali East, Mumbai</p>
                <p>Maharashtra 400101</p>
                <p className="mt-4">
                  <a 
                    href="mailto:contact@tcetian.com" 
                    className="hover:text-white transition-colors duration-200"
                  >
                    contact@tcetian.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © {new Date().getFullYear()} TCETian. Built with{' '}
              <FiHeart className="inline w-4 h-4 text-red-400 mx-1" />
              by TCET students.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link 
                to="/privacy" 
                className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
                className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
              >
                Terms of Service Rishabh Bro
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer