# 📸 Instagram-Style Image Upload Guide

## Overview
TCETian now supports Instagram-style 1:1 aspect ratio image uploads for event posters, providing a consistent and professional look across all events.

---

## ✨ Features

### 1. Square Aspect Ratio (1:1)
- All event posters displayed in perfect square format
- Matches Instagram post dimensions
- Consistent visual appearance across the platform

### 2. Recommended Dimensions
- **Optimal Size:** 1080 x 1080 pixels
- **Minimum Size:** 400 x 400 pixels
- **Maximum File Size:** 5 MB
- **Supported Formats:** JPG, PNG, WebP

### 3. Live Preview
- Real-time preview as you upload
- Gradient overlay showing event title and category
- Aspect ratio maintained automatically
- Cropping preview for non-square images

### 4. Dual Input Methods
- **File Upload:** Select from local device
- **URL Input:** Paste image URL directly

---

## 🎨 Design Implementation

### Frontend Component Structure

#### CreateEventModal.jsx
```jsx
{/* Image Upload Section */}
<div className="space-y-4">
  <h3 className="text-lg font-semibold border-b border-white/20 pb-2">
    Event Poster
  </h3>

  {/* Tab Selection */}
  <div className="flex space-x-2">
    <button
      type="button"
      onClick={() => updateField('imageInputType', 'upload')}
      className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
        formData.imageInputType === 'upload'
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
          : 'bg-white/5 hover:bg-white/10'
      }`}
    >
      Upload Image
    </button>
    <button
      type="button"
      onClick={() => updateField('imageInputType', 'url')}
      className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
        formData.imageInputType === 'url'
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
          : 'bg-white/5 hover:bg-white/10'
      }`}
    >
      Image URL
    </button>
  </div>

  {/* Upload Interface */}
  {formData.imageInputType === 'upload' ? (
    <div>
      <input
        type="file"
        name="poster"
        accept="image/*"
        onChange={(e) => updateField('posterFile', e.target.files[0])}
        className="file-input w-full"
      />
      <p className="text-xs text-gray-400 mt-2">
        📐 Recommended: 1080x1080px square image for best results
      </p>
    </div>
  ) : (
    <div>
      <input
        type="url"
        name="imageUrl"
        value={formData.imageUrl}
        onChange={handleChange}
        placeholder="https://example.com/image.jpg"
        className="input-field w-full"
      />
    </div>
  )}

  {/* Instagram-Style Preview */}
  {(formData.posterFile || formData.imageUrl) && (
    <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-white/20 bg-gradient-to-br from-purple-500/20 to-blue-500/20">
      <img
        src={formData.posterFile 
          ? URL.createObjectURL(formData.posterFile)
          : formData.imageUrl
        }
        alt="Event poster preview"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
        <h4 className="text-white font-bold text-xl mb-2">
          {formData.title || 'Event Title'}
        </h4>
        <p className="text-white/90 text-sm">
          {formData.category || 'Category'}
        </p>
      </div>
    </div>
  )}
</div>
```

### CSS Styling (Tailwind)
```css
/* Square aspect ratio container */
.aspect-square {
  aspect-ratio: 1 / 1;
}

/* Gradient overlay */
.bg-gradient-to-t {
  background-image: linear-gradient(to top, var(--tw-gradient-stops));
}

/* Object cover for proper image fitting */
.object-cover {
  object-fit: cover;
}
```

---

## 🔧 Backend Implementation

### File Upload Configuration (Multer)

#### eventRoutes.js
```javascript
const multer = require('multer')
const path = require('path')

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/events/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)
  
  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed!'))
  }
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
})

// Route with file upload
router.post('/', auth, upload.single('poster'), eventController.createEvent)
router.put('/:id', auth, upload.single('poster'), eventController.updateEvent)
```

### Event Controller

#### eventController.js
```javascript
exports.createEvent = async (req, res) => {
  try {
    const eventData = req.body
    
    // Handle poster upload
    if (req.file) {
      eventData.poster = `/uploads/events/${req.file.filename}`
    } else if (req.body.imageUrl) {
      eventData.poster = req.body.imageUrl
    }
    
    // Create event...
    const event = await Event.create(eventData)
    
    res.status(201).json({
      success: true,
      data: { event }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
```

---

## 📊 Image Processing Flow

```
User Selects Image
       ↓
Frontend Validation (size, format)
       ↓
Generate Preview (1:1 aspect ratio)
       ↓
User Confirms
       ↓
FormData Created
       ↓
POST to Backend
       ↓
Multer Middleware
       ↓
File Saved to uploads/events/
       ↓
Path Stored in MongoDB
       ↓
Response to Frontend
       ↓
Display in UI
```

---

## 🎯 Best Practices

### For Users
1. **Use square images** (1080x1080px) for best results
2. **Center important content** - some cropping may occur
3. **High contrast** text/graphics for overlay visibility
4. **Avoid text at edges** - keep important info in the center
5. **Test preview** before submitting

### For Developers
1. **Validate file size** on both frontend and backend
2. **Compress images** before storing (use Sharp.js)
3. **Generate thumbnails** for better performance
4. **CDN integration** for faster image loading
5. **Lazy loading** for image-heavy pages

---

## 🚀 Advanced Features (Future)

### 1. Image Cropping Tool
```javascript
// Using react-image-crop
import ReactCrop from 'react-image-crop'

const [crop, setCrop] = useState({
  unit: '%',
  width: 100,
  aspect: 1 / 1
})

<ReactCrop
  crop={crop}
  onChange={c => setCrop(c)}
  aspect={1}
>
  <img src={imageSrc} />
</ReactCrop>
```

### 2. Image Optimization (Sharp.js)
```javascript
const sharp = require('sharp')

const optimizeImage = async (inputPath, outputPath) => {
  await sharp(inputPath)
    .resize(1080, 1080, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 85 })
    .toFile(outputPath)
}
```

### 3. Multiple Image Variants
```javascript
// Generate different sizes
const sizes = {
  thumbnail: { width: 200, height: 200 },
  medium: { width: 600, height: 600 },
  large: { width: 1080, height: 1080 }
}

for (const [name, size] of Object.entries(sizes)) {
  await sharp(inputPath)
    .resize(size.width, size.height)
    .toFile(`${outputDir}/${name}.jpg`)
}
```

### 4. Cloudinary Integration
```javascript
const cloudinary = require('cloudinary').v2

const uploadToCloudinary = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'tcetian/events',
    transformation: [
      { width: 1080, height: 1080, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  })
  return result.secure_url
}
```

---

## 🐛 Troubleshooting

### Issue 1: Preview Not Showing
**Solution:**
- Check if file is selected: `console.log(formData.posterFile)`
- Verify URL validity: Test URL in browser
- Clear browser cache

### Issue 2: Upload Fails
**Solution:**
- Check file size (must be < 5MB)
- Verify file format (jpg, png, webp only)
- Check network connection
- Verify backend is running

### Issue 3: Aspect Ratio Distorted
**Solution:**
- Use `object-fit: cover` CSS property
- Ensure container has `aspect-ratio: 1 / 1`
- Check image natural dimensions

### Issue 4: Slow Upload
**Solution:**
- Compress image before upload
- Use image optimization tools
- Consider CDN integration
- Implement progress indicator

---

## 📱 Responsive Design

### Mobile Optimization
```jsx
<div className="relative w-full aspect-square rounded-xl overflow-hidden 
                sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">
  {/* Image content */}
</div>
```

### Touch-Friendly Upload
```jsx
<input
  type="file"
  accept="image/*"
  capture="environment"  // Mobile camera access
  className="file-input w-full"
/>
```

---

## 🎨 Example Screenshots

### Create Event Modal
```
┌────────────────────────────────┐
│   Create New Event     ╳      │
├────────────────────────────────┤
│ Basic Information              │
│ ┌──────────────────────────┐   │
│ │ Event Title            │   │
│ └──────────────────────────┘   │
│                                │
│ Event Poster                   │
│ ┌──────┬──────┐               │
│ │Upload│  URL │               │
│ └──────┴──────┘               │
│ 📁 Choose File                 │
│ 📐 Recommended: 1080x1080px    │
│                                │
│ Preview:                       │
│ ┌────────────────┐             │
│ │                │             │
│ │   Event Image  │             │
│ │                │             │
│ │ Title          │             │
│ │ Category       │             │
│ └────────────────┘             │
│                                │
│      [Create Event]            │
└────────────────────────────────┘
```

---

## 📈 Performance Metrics

### Target Metrics
- Image upload time: < 2 seconds
- Preview rendering: < 500ms
- Page load with images: < 3 seconds
- Mobile data usage: < 1MB per event

### Optimization Checklist
- [x] 1:1 aspect ratio enforcement
- [x] 5MB file size limit
- [x] Accepted formats: JPG, PNG, WebP
- [x] Real-time preview
- [ ] Image compression (Sharp.js)
- [ ] Lazy loading
- [ ] CDN integration
- [ ] Thumbnail generation
- [ ] WebP conversion
- [ ] Responsive images (srcset)

---

**Last Updated:** 2024  
**Component:** CreateEventModal.jsx  
**Compatible with:** TCETian v2.0.0
