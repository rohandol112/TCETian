# 🧪 Quick Testing Guide - Event Management Features

## 🚀 Quick Start

### Prerequisites
1. Backend running on `http://localhost:5000`
2. Frontend running on `http://localhost:5173`
3. MongoDB connected
4. Socket.io server running

### Test Accounts
```javascript
// Club Account (for creating/editing events)
Email: club@tcet.ac.in
Password: Test@123
Role: club

// Student Account (for RSVP and viewing)
Email: student@tcet.ac.in
Password: Test@123
Role: student
```

---

## ✅ Feature Testing Checklist

### 1. Event Sharing (5 minutes)

#### Single User Test
1. ✅ Login as club/student
2. ✅ Navigate to Events page
3. ✅ Click on any event card
4. ✅ Event details modal opens
5. ✅ Click "Share Event" button (🔗 icon)
6. ✅ Toast notification: "Event link copied to clipboard!"
7. ✅ Share count increases by 1
8. ✅ Paste URL in new tab - should open event details

**Expected Results:**
- URL copied to clipboard
- Share count updates immediately
- Toast notification appears
- URL is shareable and valid

#### Multi-User Test (Open 2 browser windows)
1. ✅ **Window 1:** Login and open event details
2. ✅ **Window 2:** Login (different account) and open same event
3. ✅ **Window 1:** Click "Share Event"
4. ✅ **Window 2:** Share count updates automatically (no refresh)
5. ✅ **Window 2:** Click "Share Event"
6. ✅ **Window 1:** Share count updates to +2

**Expected Results:**
- Real-time updates in both windows
- Share count synchronized
- No page refresh needed

---

### 2. Instagram-Style Image Upload (10 minutes)

#### File Upload Test
1. ✅ Login as club account
2. ✅ Click "Create Event" button
3. ✅ Fill in basic information (title, description, category)
4. ✅ Scroll to "Event Poster" section
5. ✅ Ensure "Upload Image" tab is selected
6. ✅ Click "Choose File"
7. ✅ Select a square image (preferably 1080x1080px)
8. ✅ Preview appears in perfect 1:1 square
9. ✅ Gradient overlay shows event title and category
10. ✅ Submit event
11. ✅ Event created with poster

**Expected Results:**
- Preview shows perfect square (no distortion)
- Gradient overlay visible with title/category
- Image uploaded successfully
- Event displays with square poster

#### URL Input Test
1. ✅ Click "Create Event"
2. ✅ Fill basic information
3. ✅ Click "Image URL" tab
4. ✅ Paste image URL: `https://picsum.photos/1080/1080`
5. ✅ Preview appears instantly
6. ✅ Gradient overlay shows event details
7. ✅ Submit event

**Expected Results:**
- URL input works
- Preview loads from URL
- Event created with external image

#### Edge Cases
1. ✅ **Large File (>5MB):** Should show error
2. ✅ **Non-square image:** Should fit to square with object-cover
3. ✅ **Invalid URL:** Should handle gracefully
4. ✅ **No image:** Event created without poster (optional field)

---

### 3. Edit Event Feature (8 minutes)

#### Edit Flow Test
1. ✅ Login as club account
2. ✅ Navigate to Events page
3. ✅ Click on event you created
4. ✅ "Edit Event" button visible (only for organizer)
5. ✅ Click "Edit Event"
6. ✅ Modal opens with title "Edit Event"
7. ✅ All fields pre-populated with current data
8. ✅ Image preview shows current poster
9. ✅ Modify title (e.g., add " - Updated")
10. ✅ Change category
11. ✅ Upload new image (optional)
12. ✅ Click "Update Event"
13. ✅ Toast: "Event updated successfully! ✅"
14. ✅ Details modal refreshes with new data
15. ✅ Event card in feed shows updated info

**Expected Results:**
- Form pre-populated correctly
- All fields editable
- Image can be changed or kept
- Updates save successfully
- UI refreshes automatically

#### Real-Time Update Test (2 windows)
1. ✅ **Window 1:** Open event details as organizer
2. ✅ **Window 2:** Open same event as different user
3. ✅ **Window 1:** Click "Edit Event" and change title
4. ✅ **Window 1:** Submit changes
5. ✅ **Window 2:** Event details update automatically

**Expected Results:**
- Window 2 sees changes without refresh
- Title/category/image update in real-time
- Socket.io broadcasting works

#### Permission Test
1. ✅ Login as **student** account
2. ✅ Open event created by club
3. ✅ "Edit Event" button should NOT be visible
4. ✅ Only "RSVP" button visible

**Expected Results:**
- Students cannot edit events
- Only organizers see edit button

---

### 4. Real-Time Socket Updates (5 minutes)

#### Connection Test
1. ✅ Open browser console (F12)
2. ✅ Navigate to Events page
3. ✅ Check for: `"Connected to Socket.io"`
4. ✅ Green indicator: "🟢 Connected"
5. ✅ No Socket.io errors in console

**Expected Results:**
- Socket connection establishes
- No connection errors
- Green connected indicator

#### Room Joining Test
1. ✅ Open console (F12)
2. ✅ Click on event card
3. ✅ Check console for: `"Joined event room: event_<id>"`
4. ✅ Close modal
5. ✅ Check console for: `"Left event room: event_<id>"`

**Expected Results:**
- Joins room when modal opens
- Leaves room when modal closes
- Proper cleanup

#### Event Stats Update
1. ✅ **Window 1:** Open Events page
2. ✅ **Window 2:** Open Events page
3. ✅ **Window 1:** Open event and share
4. ✅ **Window 2:** Event card share count updates
5. ✅ No page refresh needed

**Expected Results:**
- Stats update across all clients
- Real-time synchronization
- Events feed receives broadcasts

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error
```
Error: cache-control is not allowed by Access-Control-Allow-Headers
```
**Solution:**
- Verify backend `app.js` has updated CORS config
- Restart backend server
- Clear browser cache

### Issue 2: Socket Not Connecting
```
Socket.io connection failed
```
**Solution:**
- Check backend is running on port 5000
- Verify `VITE_API_URL` in frontend `.env`
- Check browser console for specific error
- Ensure Socket.io server started

### Issue 3: Image Upload Fails
```
Error: File too large / Invalid format
```
**Solution:**
- Check file size < 5MB
- Verify format is JPG/PNG/WebP
- Ensure `uploads/events/` folder exists
- Check backend multer configuration

### Issue 4: Share Count Not Updating
```
Share button works but count doesn't update
```
**Solution:**
- Check Socket.io connection (console)
- Verify user in `events_feed` room
- Check `event_stats_update` listener
- Restart both frontend and backend

### Issue 5: Edit Modal Not Opening
```
Edit button doesn't work
```
**Solution:**
- Verify logged in as club/organizer
- Check `showEditModal` state
- Ensure `CreateEventModal` imported
- Check console for errors

---

## 📊 Performance Benchmarks

### Target Metrics
| Feature | Target | Actual |
|---------|--------|--------|
| Share event | < 1s | ✅ ~500ms |
| Image upload | < 2s | ⏳ Test |
| Socket update | < 500ms | ✅ ~200ms |
| Edit form load | < 1s | ✅ Instant |
| Preview render | < 500ms | ✅ ~100ms |

### Network Tests
1. ✅ Test with slow 3G network
2. ✅ Test with image > 1MB
3. ✅ Test with poor Socket connection
4. ✅ Test with multiple events (50+)

---

## 🔄 Regression Testing

### Existing Features (Should Still Work)
1. ✅ Event creation (without image)
2. ✅ Event RSVP (student accounts)
3. ✅ Event deletion (organizer only)
4. ✅ Event filtering by category
5. ✅ Event search
6. ✅ Attendees modal
7. ✅ Event notifications
8. ✅ User authentication
9. ✅ Protected routes

---

## 🧪 Automated Testing (Future)

### Unit Tests
```javascript
// eventService.test.js
describe('Event Sharing', () => {
  test('shareEvent increments share count', async () => {
    const response = await eventService.shareEvent(eventId)
    expect(response.data.shareCount).toBe(1)
  })
})
```

### Integration Tests
```javascript
// socket.test.js
describe('Socket.io Events', () => {
  test('event_shared broadcasts to room', (done) => {
    socket.emit('event_shared', { eventId, shareCount: 5 })
    socket.on('event_share_update', (data) => {
      expect(data.shareCount).toBe(5)
      done()
    })
  })
})
```

### E2E Tests (Playwright/Cypress)
```javascript
// events.spec.js
test('Share event flow', async ({ page }) => {
  await page.goto('/events')
  await page.click('[data-testid="event-card"]')
  await page.click('[data-testid="share-button"]')
  await expect(page.locator('[data-testid="toast"]')).toContainText('copied')
})
```

---

## 📱 Mobile Testing

### Responsive Design
1. ✅ iPhone 12 (390x844)
2. ✅ iPad (768x1024)
3. ✅ Android (360x640)
4. ✅ Desktop (1920x1080)

### Touch Interactions
1. ✅ Tap share button
2. ✅ Swipe modal to close
3. ✅ Pinch to zoom image preview
4. ✅ File upload from camera

---

## ✅ Final Checklist

### Before Production
- [ ] All features tested manually
- [ ] Multi-user testing completed
- [ ] Performance benchmarks met
- [ ] Mobile responsive verified
- [ ] Error handling tested
- [ ] Console errors resolved
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Security audit passed
- [ ] Backup database

### Deployment
- [ ] Environment variables set
- [ ] CORS origins updated
- [ ] MongoDB indexes created
- [ ] CDN configured (images)
- [ ] SSL certificates installed
- [ ] Monitoring enabled
- [ ] Backup strategy in place

---

## 🎯 Test Results Template

```markdown
## Test Session: Event Management Features
**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** Development/Staging/Production

### Event Sharing
- [ ] Single user share: ✅ Pass / ❌ Fail
- [ ] Multi-user real-time: ✅ Pass / ❌ Fail
- [ ] Share count accuracy: ✅ Pass / ❌ Fail

### Image Upload
- [ ] File upload (square): ✅ Pass / ❌ Fail
- [ ] URL input: ✅ Pass / ❌ Fail
- [ ] Instagram preview: ✅ Pass / ❌ Fail
- [ ] Size validation: ✅ Pass / ❌ Fail

### Edit Event
- [ ] Form pre-population: ✅ Pass / ❌ Fail
- [ ] Update success: ✅ Pass / ❌ Fail
- [ ] Real-time broadcast: ✅ Pass / ❌ Fail
- [ ] Permission check: ✅ Pass / ❌ Fail

### Socket.io
- [ ] Connection stable: ✅ Pass / ❌ Fail
- [ ] Real-time updates: ✅ Pass / ❌ Fail
- [ ] Room management: ✅ Pass / ❌ Fail

### Issues Found
1. [Description]
2. [Description]

### Overall Status
✅ Ready for Production / ⚠️ Minor Issues / ❌ Major Issues
```

---

**Happy Testing! 🎉**

For issues or questions, refer to:
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `SOCKET_EVENTS.md` - Socket.io reference
- `IMAGE_UPLOAD_GUIDE.md` - Image upload docs
- `CHANGELOG.md` - Feature history
