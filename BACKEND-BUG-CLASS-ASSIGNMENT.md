# 🐛 BACKEND BUG REPORT: Class Assignment Not Displaying

**Date**: May 15, 2026  
**Severity**: HIGH  
**Status**: ❌ BACKEND FIX REQUIRED  
**Reporter**: Frontend Team

---

## 📋 Issue Summary

When a School Admin assigns a student to a class, the assignment saves successfully to the database, but the class information does not display in the Students list after page refresh or navigation.

---

## 🔍 Root Cause Analysis

The `/api/school-admin/users?role=student` endpoint **does NOT return class assignment information** (`class_id` and `class_name` fields).

### Current API Response (BROKEN):
```json
{
  "success": true,
  "data": [
    {
      "id": "725b90c6-e755-4222-835a-7eb36a5b36b6",
      "digital_id": "STD-AD-0001",
      "name": "John Doe",
      "email": "johndoeadama@gmail.com",
      "role": "student",
      "status": "Approved",
      "branch_id": "eef9e95e-7833-49cd-b093-2d6581a00260"
      // ❌ MISSING: class_id
      // ❌ MISSING: class_name
    }
  ]
}
```

### Expected API Response (FIXED):
```json
{
  "success": true,
  "data": [
    {
      "id": "725b90c6-e755-4222-835a-7eb36a5b36b6",
      "digital_id": "STD-AD-0001",
      "name": "John Doe",
      "email": "johndoeadama@gmail.com",
      "role": "student",
      "status": "Approved",
      "branch_id": "eef9e95e-7833-49cd-b093-2d6581a00260",
      "class_id": "eec0636f-1cd5-4659-8c87-750600205bc0",  // ✅ ADD THIS
      "class_name": "Grade 10"  // ✅ ADD THIS
    }
  ]
}
```

---

## 🛠️ Required Backend Fix

### Endpoint to Fix:
```
GET /api/school-admin/users?role=student
```

### Current SQL Query (BROKEN):
```sql
SELECT * FROM users 
WHERE role = 'student' AND branch_id = ?
```

### Fixed SQL Query (REQUIRED):
```sql
SELECT 
  u.id,
  u.digital_id,
  u.username,
  u.name,
  u.email,
  u.role,
  u.branch_id,
  u.status,
  u.is_active,
  u.is_branch_auditor,
  u.created_at,
  u.updated_at,
  b.name as branch_name,
  s.class_id,           -- ✅ ADD THIS
  c.name as class_name  -- ✅ ADD THIS
FROM users u
LEFT JOIN branches b ON u.branch_id = b.id
LEFT JOIN students s ON u.id = s.user_id  -- ✅ ADD THIS JOIN
LEFT JOIN classes c ON s.class_id = c.id  -- ✅ ADD THIS JOIN
WHERE u.role = 'student' AND u.branch_id = ?
```

---

## 📊 Additional Issues Found

### 1. Missing Endpoint: `/api/school-admin/students`
**Status**: ❌ 404 Not Found  
**Expected**: Should return student records with class information  
**Current**: Endpoint doesn't exist

### 2. Class Student Count Not Updating
**Endpoint**: `GET /api/school-admin/classes`  
**Issue**: After assigning a student to a class, the `student_count` and `actual_student_count` fields don't update

**Example**:
```json
// Before assignment:
{
  "id": "eec0636f-1cd5-4659-8c87-750600205bc0",
  "name": "Grade 10",
  "student_count": 2,
  "actual_student_count": "2"
}

// After assigning a new student:
{
  "id": "eec0636f-1cd5-4659-8c87-750600205bc0",
  "name": "Grade 10",
  "student_count": 2,  // ❌ Should be 3
  "actual_student_count": "2"  // ❌ Should be "3"
}
```

**Fix**: Update the class count calculation or add a database trigger to auto-update counts.

---

## ✅ Verification Steps

After implementing the fix, verify:

1. **Assign a student to a class**
   - POST `/api/school-admin/students/assign-class`
   - Should return success

2. **Fetch students list**
   - GET `/api/school-admin/users?role=student`
   - Response should include `class_id` and `class_name`

3. **Navigate away and back**
   - Class assignment should persist in the UI

4. **Check class counts**
   - GET `/api/school-admin/classes`
   - `student_count` and `actual_student_count` should reflect the new assignment

---

## 🎯 Impact

**Current Behavior**:
- ✅ Class assignment saves to database
- ✅ UI updates immediately after assignment (optimistic update)
- ❌ Class info disappears after page refresh
- ❌ Class info disappears after navigation
- ❌ Class counts don't update

**After Fix**:
- ✅ Class assignment saves to database
- ✅ UI updates immediately after assignment
- ✅ Class info persists after page refresh
- ✅ Class info persists after navigation
- ✅ Class counts update correctly

---

## 📝 Related Endpoints

### Working Correctly ✅:
- `POST /api/school-admin/students/assign-class` - Saves assignment successfully
- `DELETE /api/school-admin/students/:id/remove-class` - Removes assignment

### Needs Fix ❌:
- `GET /api/school-admin/users?role=student` - Missing class fields
- `GET /api/school-admin/students` - Endpoint doesn't exist (404)
- `GET /api/school-admin/classes` - Student counts not updating

---

## 🔧 Database Schema Reference

```sql
-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  digital_id VARCHAR,
  name VARCHAR,
  email VARCHAR,
  role VARCHAR,
  branch_id UUID,
  status VARCHAR,
  ...
);

-- students table
CREATE TABLE students (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  class_id UUID REFERENCES classes(id),  -- ← This is the link!
  branch_id UUID,
  grade VARCHAR,
  ...
);

-- classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY,
  name VARCHAR,
  section VARCHAR,
  capacity INTEGER,
  student_count INTEGER,
  ...
);
```

---

## 🚨 Priority

**HIGH** - This affects core functionality of the student management system. School admins cannot see which students are assigned to which classes.

---

## 📞 Contact

If you need clarification or have questions about this issue, contact the frontend team.

**Frontend Developer**: [Your Name]  
**Date Reported**: May 15, 2026
