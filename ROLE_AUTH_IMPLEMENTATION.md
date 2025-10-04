# Role-Based Authentication Implementation

## Changes Made

### 1. Database Model Updates (User.js)
- **Removed** `unique: true` constraint from email field
- **Added** compound index `{ email: 1, role: 1 }` with `unique: true`
- This allows same email for different roles but prevents duplicates within the same role

### 2. Backend Authentication Logic (authController.js)

#### Registration (`/api/auth/register`)
- **Enhanced validation**: Check for existing user with same email AND role
- **Allow cross-role emails**: Same email can be used for both student and club accounts
- **Improved error messages**: More specific feedback about email conflicts
- **Better logging**: Detailed logs for debugging registration issues

#### Login (`/api/auth/login`)
- **Added role parameter**: Optional role specification in login request
- **Role-specific authentication**: If role specified, find user with that specific role
- **Helpful error messages**: Suggest correct role if user exists with different role
- **Backward compatibility**: Still works without role specification

### 3. Frontend Updates

#### Login Component (Login.jsx)
- **Added role selection**: Student/Club toggle buttons
- **Visual indicators**: Clear UI showing selected account type
- **Helpful tips**: Explanation that same email can have both account types
- **Updated form submission**: Include role in login request

#### Register Component (Register.jsx)
- **Added informational tip**: Clarify that same email can be used for different roles
- **Enhanced UI**: Better visual separation between role types

#### Authentication Context (AuthContext.jsx)
- **Updated login function**: Accept optional role parameter
- **Pass role to service**: Include role in authentication request

### 4. User Experience Improvements

#### Clear Role Separation
```
Student Account (test@tcet.edu)
- Access to events, social features
- Student-specific profile fields

Club Account (test@tcet.edu)  
- Event creation and management
- Club-specific profile fields
```

#### Error Handling
- Specific error messages for different scenarios
- Suggestions when user tries wrong role
- Clear feedback about email availability

#### Visual Feedback
- Role selection buttons with icons
- Color-coded feedback
- Helpful tips and explanations

## How It Works

### Registration Flow
1. User selects role (Student or Club)
2. Fills appropriate fields based on role
3. System checks for existing user with same email AND role
4. If exists within same role → Error
5. If exists in different role → Allow (independent accounts)
6. Create new user with compound uniqueness

### Login Flow
1. User selects account type (Student or Club)
2. Enters email and password
3. System queries for user with specific email AND role
4. If not found with specified role → Check other role and suggest
5. If found → Authenticate and login
6. If no role specified → Find any user with email (backward compatibility)

### Database Structure
```javascript
// Compound Index
{ email: 1, role: 1 } // unique: true

// Allows:
{ email: "test@tcet.edu", role: "student" }
{ email: "test@tcet.edu", role: "club" }

// Prevents:
{ email: "test@tcet.edu", role: "student" } // duplicate
{ email: "test@tcet.edu", role: "student" } // duplicate
```

## Testing

Run the test script to verify functionality:
```bash
node testRoleAuth.js
```

This will test:
- Creating accounts with same email, different roles ✅
- Preventing duplicates within same role ✅ 
- Role-specific querying ✅
- Password validation for both accounts ✅

## Benefits

1. **Flexibility**: Users can have both student and club accounts
2. **Clarity**: Clear separation between account types
3. **User-Friendly**: Intuitive role selection process
4. **Data Integrity**: Prevents duplicate accounts within same role
5. **Scalability**: Easy to add more roles in the future