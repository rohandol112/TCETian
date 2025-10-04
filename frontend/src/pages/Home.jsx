import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { 
  FiCalendar, 
  FiMessageCircle, 
  FiUsers, 
  FiTrendingUp,
  FiArrowRight,
  FiStar
} from 'react-icons/fi'

const Home = () => {
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: FiCalendar,
      title: 'Event Management',
      description: 'Create, manage, and discover college events. From workshops to festivals, never miss out!'
    },
    {
      icon: FiMessageCircle,
      title: 'Social Hub',
      description: 'Connect with fellow students. Share thoughts, ask questions, and build your network.'
    },
    {
      icon: FiUsers,
      title: 'Community',
      description: 'Join study groups, clubs, and interest-based communities within TCET.'
    },
    {
      icon: FiTrendingUp,
      title: 'Stay Updated',
      description: 'Get the latest news, announcements, and trending discussions on campus.'
    }
  ]

  const stats = [
    { number: '500+', label: 'Active Students' },
    { number: '100+', label: 'Events Hosted' },
    { number: '50+', label: 'Communities' },
    { number: '1000+', label: 'Discussions' }
  ]

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-float">
              Welcome to{' '}
              <span className="text-gradient">TCETian</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The ultimate platform for{' '}
              <span className="text-gradient font-semibold">
                Thakur College of Engineering and Technology
              </span>{' '}
              students. Connect, collaborate, and create amazing experiences together.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            {isAuthenticated ? (
              <>
                <Link
                  to="/events"
                  className="btn-gradient px-8 py-4 rounded-xl font-semibold text-lg flex items-center space-x-2 group"
                >
                  <FiCalendar className="w-5 h-5" />
                  <span>Explore Events</span>
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/social"
                  className="glass border border-white/20 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-200 flex items-center space-x-2"
                >
                  <FiMessageCircle className="w-5 h-5" />
                  <span>Join Discussions</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn-gradient px-8 py-4 rounded-xl font-semibold text-lg flex items-center space-x-2 group"
                >
                  <span>Join TCETian</span>
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="glass border border-white/20 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-200"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="glass card-hover rounded-xl p-6 text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose <span className="text-gradient">TCETian?</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to make the most of your college experience, 
              all in one beautiful platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index}
                  className="glass card-hover rounded-xl p-8 text-center group"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-6 group-hover:scale-110 transition-transform duration-200">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass rounded-2xl p-12 card-hover">
              <div className="flex justify-center mb-6">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Join the <span className="text-gradient">TCET Community?</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Connect with thousands of students, discover amazing events, 
                and make your college journey unforgettable.
              </p>
              <Link
                to="/register"
                className="btn-gradient px-8 py-4 rounded-xl font-semibold text-lg inline-flex items-center space-x-2 group"
              >
                <span>Get Started Today</span>
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default Home