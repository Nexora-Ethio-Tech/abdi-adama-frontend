# TEST PLAN 04: Teacher System Testing

**Role:** Teacher  
**Test Environment:** http://localhost:5173  
**Backend API:** http://localhost:3000  
**Status:** ⏳ Pending Testing  
**Created:** 2025-01-16

---

## 📋 Overview

Teachers are the core academic users with responsibilities including:
- Submit weekly lesson plans for VP review
- Mark daily attendance for assigned classes
- Enter and manage student grades
- View class schedules and student rosters
- Communicate with parents and administration

---

## 🔐 Test Credentials

| Field | Value |
|-------|-------|
| **Email/Digital ID** | `test-teacher@example.com` or Teacher Digital ID |
| **Password** | (Temporary password from School Admin) |
| **Role** | `teacher` |

---

## 🎯 Test Scenarios

### **TS-TC-01: Authentication & Dashboard Access**

#### TC-TC-01-01: Login as Teacher
- **Steps:**
  1. Navigate to `/login`
  2. Enter teacher credentials
  3. Click "Sign In"
- **Expected:**
  - ✅ Redirect to `/dashboard/teacher`
  - ✅ See Teacher Portal dashboard
  - ✅ See assigned classes overview
  - ✅ See quick action buttons (Attendance, Grades, Schedule)
- **API Calls:**
  - `POST /api/auth/login`
  - `GET /api/teacher/dashboard`

---

### **TS-TC-02: Weekly Lesson Plans**

#### TC-TC-02-01: Navigate to Lesson Plans
- **Steps:**
  1. Login as teacher
  2. Look for "Lesson Plans" or "Weekly Plans" link
- **Expected:**
  - ✅ Find navigation to lesson plans section
  - ✅ See list of submitted plans
  - ✅ See "Create New Plan" button

#### TC-TC-02-02: Create Weekly Lesson Plan
- **Steps:**
  1. Click "Create New Plan"
  2. Fill in form:
     - Week number
     - Subject/Course
     - Objectives
     - Activities
     - Materials needed
     - Assessment methods
  3. Click "Submit for Review"
- **Expected:**
  - ✅ Form validation works
  - ✅ Success message: "Lesson plan submitted for review"
  - ✅ Plan appears in "Pending" status
  - ✅ VP receives notification
- **API Calls:**
  - `POST /api/teacher/weekly-plans`
  - Request body: `{ weekNumber, courseId, objectives, activities, materials, assessment }`

#### TC-TC-02-03: View Lesson Plan Status
- **Steps:**
  1. View submitted lesson plans
  2. Check status badges
- **Expected:**
  - ✅ See status: Pending / Approved / Revision Required
  - ✅ If approved: See VP rating (stars)
  - ✅ If revision required: See VP feedback
  - ✅ Can edit and resubmit if revision required

#### TC-TC-02-04: Edit and Resubmit Plan
- **Steps:**
  1. Find plan with "Revision Required" status
  2. Click "Edit"
  3. Make changes based on VP feedback
  4. Click "Resubmit"
- **Expected:**
  - ✅ Form pre-filled with existing data
  - ✅ Can see VP feedback while editing
  - ✅ Status changes back to "Pending"
- **API Calls:**
  - `PATCH /api/teacher/weekly-plans/{id}`

---

### **TS-TC-03: Attendance Management**

#### TC-TC-03-01: Navigate to Attendance
- **Steps:**
  1. Click "Attendance" in sidebar or dashboard
- **Expected:**
  - ✅ Navigate to `/attendance` or teacher attendance page
  - ✅ See list of assigned classes
  - ✅ See today's date highlighted
  - ✅ Can select different dates
- **API Calls:**
  - `GET /api/teacher/classes`

#### TC-TC-03-02: Mark Daily Attendance
- **Steps:**
  1. Select a class
  2. Select today's date
  3. Mark each student: Present / Absent / Late
  4. For absences, add reason
  5. Click "Submit Attendance"
- **Expected:**
  - ✅ Student list loads with photos/names
  - ✅ Quick toggle buttons for status
  - ✅ Reason field appears for absences
  - ✅ Success message after submission
  - ✅ Absences appear in VP queue
- **API Calls:**
  - `GET /api/teacher/classes/{classId}/students`
  - `POST /api/teacher/attendance`
  - Request body: `{ classId, date, records: [{ studentId, status, reason }] }`

#### TC-TC-03-03: View Attendance History
- **Steps:**
  1. Select past date
  2. View attendance records
- **Expected:**
  - ✅ See previously submitted attendance
  - ✅ Can edit if within allowed timeframe
  - ✅ See attendance statistics (present %, absent %)

---

### **TS-TC-04: Grade Entry**

#### TC-TC-04-01: Navigate to Grades
- **Steps:**
  1. Click "Grades" in sidebar
- **Expected:**
  - ✅ Navigate to `/grades` or teacher grades page
  - ✅ See assigned courses/classes
  - ✅ See grade entry interface
  - ✅ Check if grades are locked/unlocked
- **API Calls:**
  - `GET /api/teacher/courses`

#### TC-TC-04-02: Enter Student Grades
- **Steps:**
  1. Select a course and assessment type
  2. Enter grades for each student
  3. Click "Save Grades"
- **Expected:**
  - ✅ Grade input fields appear
  - ✅ Validation (0-100 or grade scale)
  - ✅ Auto-save or manual save
  - ✅ Success confirmation
  - ✅ Cannot edit if grades locked
- **API Calls:**
  - `POST /api/teacher/grades`
  - Request body: `{ courseId, assessmentType, grades: [{ studentId, score }] }`

#### TC-TC-04-03: View Grade Lock Status
- **Steps:**
  1. Check grade entry page header
- **Expected:**
  - ✅ See lock status indicator
  - ✅ If locked: "Grade entry is currently locked"
  - ✅ If unlocked: Can enter/edit grades
  - ✅ Lock controlled by VP/School Admin

---

### **TS-TC-05: Class Management**

#### TC-TC-05-01: View Assigned Classes
- **Steps:**
  1. Navigate to "My Classes" or similar
- **Expected:**
  - ✅ See list of assigned classes
  - ✅ See class name, section, grade level
  - ✅ See student count
  - ✅ Can click to view details
- **API Calls:**
  - `GET /api/teacher/classes`

#### TC-TC-05-02: View Class Roster
- **Steps:**
  1. Click on a class
  2. View student list
- **Expected:**
  - ✅ See all enrolled students
  - ✅ See student photos, names, IDs
  - ✅ Can search/filter students
  - ✅ Can view individual student profiles

---

### **TS-TC-06: Schedule Management**

#### TC-TC-06-01: View Teaching Schedule
- **Steps:**
  1. Click "Schedule" in sidebar
- **Expected:**
  - ✅ Navigate to `/schedule`
  - ✅ See weekly calendar view
  - ✅ See assigned classes with times
  - ✅ See room numbers
  - ✅ Can switch between weeks
- **API Calls:**
  - `GET /api/teacher/schedule`

---

### **TS-TC-07: Error Handling**

#### TC-TC-07-01: Submit Duplicate Attendance
- **Steps:**
  1. Submit attendance for a class/date
  2. Try to submit again
- **Expected:**
  - ✅ Warning: "Attendance already submitted"
  - ✅ Option to edit existing record
  - ✅ No duplicate entries created

#### TC-TC-07-02: Grade Entry When Locked
- **Steps:**
  1. Try to enter grades when system is locked
- **Expected:**
  - ✅ Input fields disabled
  - ✅ Clear message: "Grade entry is locked"
  - ✅ No API call made

---

## 📊 API Endpoints Summary

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/teacher/dashboard` | Get teacher dashboard | ⏳ |
| GET | `/api/teacher/classes` | Get assigned classes | ⏳ |
| GET | `/api/teacher/classes/{id}/students` | Get class roster | ⏳ |
| POST | `/api/teacher/attendance` | Submit attendance | ⏳ |
| GET | `/api/teacher/attendance` | Get attendance history | ⏳ |
| POST | `/api/teacher/weekly-plans` | Create lesson plan | ⏳ |
| GET | `/api/teacher/weekly-plans` | Get lesson plans | ⏳ |
| PATCH | `/api/teacher/weekly-plans/{id}` | Update lesson plan | ⏳ |
| GET | `/api/teacher/courses` | Get assigned courses | ⏳ |
| POST | `/api/teacher/grades` | Submit grades | ⏳ |
| GET | `/api/teacher/grades` | Get grade records | ⏳ |
| GET | `/api/teacher/schedule` | Get teaching schedule | ⏳ |

---

## 🎨 UI/UX Checklist

- [ ] Dashboard shows personalized greeting
- [ ] Quick action buttons for common tasks
- [ ] Class cards show student count and next session
- [ ] Attendance interface is mobile-friendly
- [ ] Grade entry has keyboard shortcuts (Tab, Enter)
- [ ] Lesson plan form has autosave
- [ ] Success/error toasts for all actions
- [ ] Loading states during API calls
- [ ] Empty states with helpful messages
- [ ] Dark mode support

---

## ✅ Test Results

| Test Case | Status | Notes | Tester | Date |
|-----------|--------|-------|--------|------|
| TC-TC-01-01 | ⏳ | | | |
| TC-TC-02-01 | ⏳ | | | |
| TC-TC-02-02 | ⏳ | **CRITICAL for VP testing** | | |
| TC-TC-02-03 | ⏳ | | | |
| TC-TC-02-04 | ⏳ | | | |
| TC-TC-03-01 | ⏳ | | | |
| TC-TC-03-02 | ⏳ | **CRITICAL for VP testing** | | |
| TC-TC-03-03 | ⏳ | | | |
| TC-TC-04-01 | ⏳ | | | |
| TC-TC-04-02 | ⏳ | | | |
| TC-TC-04-03 | ⏳ | | | |
| TC-TC-05-01 | ⏳ | | | |
| TC-TC-05-02 | ⏳ | | | |
| TC-TC-06-01 | ⏳ | | | |
| TC-TC-07-01 | ⏳ | | | |
| TC-TC-07-02 | ⏳ | | | |

---

## 📝 Testing Notes

### Critical for VP Testing
These test cases MUST pass to enable VP testing:
- **TC-TC-02-02**: Create Weekly Lesson Plan (generates data for VP review)
- **TC-TC-03-02**: Mark Daily Attendance with absences (generates data for VP absence queue)

### Pre-Testing Setup
1. Ensure backend is running
2. Create teacher test account via School Admin
3. Assign teacher to at least 2 classes
4. Assign teacher to at least 2 courses
5. Ensure students exist in assigned classes

---

## 🔄 Next Steps

1. [ ] Create teacher test account
2. [ ] Assign classes and courses
3. [ ] Test lesson plan creation (TC-TC-02-02)
4. [ ] Test attendance marking (TC-TC-03-02)
5. [ ] Verify data appears in VP dashboard
6. [ ] Complete remaining test cases
7. [ ] Document any bugs

---

**Last Updated:** 2025-01-16  
**Test Plan Version:** 1.0  
**Prepared By:** Amazon Q Developer
