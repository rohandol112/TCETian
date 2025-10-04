import { useEffect, useState } from 'react'

const Stars = () => {
  const [stars, setStars] = useState([])

  useEffect(() => {
    const createStars = () => {
      const starArray = []
      for (let i = 0; i < 100; i++) {
        starArray.push({
          id: i,
          left: Math.random() * 100,
          top: Math.random() * 100,
          size: Math.random() * 3 + 1,
          delay: Math.random() * 3
        })
      }
      setStars(starArray)
    }

    createStars()
  }, [])

  return (
    <div className="stars fixed inset-0 pointer-events-none z-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star absolute bg-white rounded-full opacity-30"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`
          }}
        />
      ))}
    </div>
  )
}

export default Stars