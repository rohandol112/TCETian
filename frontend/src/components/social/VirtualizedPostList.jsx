import { useState, useEffect, useRef, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import PostCard from './PostCard'

const ITEM_HEIGHT = 400 // Approximate height of each post card
const ITEMS_PER_PAGE = 20

const VirtualizedPostList = ({ 
  posts, 
  hasNextPage, 
  isNextPageLoading, 
  loadNextPage,
  currentUser,
  onVote,
  onDelete,
  onSave,
  onShare,
  formatTimeAgo 
}) => {
  const [containerHeight, setContainerHeight] = useState(600)
  const containerRef = useRef()

  // Update container height based on viewport
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const availableHeight = window.innerHeight - rect.top - 100 // 100px padding
        setContainerHeight(Math.max(400, availableHeight))
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Check if an item is loaded
  const isItemLoaded = useCallback((index) => {
    return !!posts[index]
  }, [posts])

  // Item count includes a loading item
  const itemCount = hasNextPage ? posts.length + 1 : posts.length

  // Render individual post item
  const Item = ({ index, style }) => {
    let content

    if (index >= posts.length) {
      // Loading item
      content = (
        <div className="glass rounded-xl p-6 animate-pulse mx-4 my-2">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-1/3"></div>
            </div>
          </div>
          <div className="h-4 bg-white/20 rounded mb-2"></div>
          <div className="h-4 bg-white/20 rounded mb-2 w-2/3"></div>
          <div className="h-10 bg-white/20 rounded"></div>
        </div>
      )
    } else {
      const post = posts[index]
      content = (
        <div className="mx-4 my-2">
          <PostCard
            post={post}
            currentUser={currentUser}
            onVote={onVote}
            onDelete={onDelete}
            onSave={onSave}
            onShare={onShare}
            formatTimeAgo={formatTimeAgo}
          />
        </div>
      )
    }

    return <div style={style}>{content}</div>
  }

  return (
    <div ref={containerRef} className="w-full">
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadNextPage}
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={ref}
            height={containerHeight}
            itemCount={itemCount}
            itemSize={ITEM_HEIGHT}
            onItemsRendered={onItemsRendered}
            width="100%"
            className="custom-scrollbar"
          >
            {Item}
          </List>
        )}
      </InfiniteLoader>
    </div>
  )
}

export default VirtualizedPostList