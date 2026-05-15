# TEST PLAN 03: Vice Principal System Testing

**Role:** Vice Principal  
**Test Environment:** http://localhost:5173  
**Backend API:** http://localhost:3000  
**Status:** ⏳ Pending Testing  
**Created:** 2025-01-16

---

## 📋 Overview

Vice Principal has academic oversight responsibilities including:
- Review and approve teacher lesson plans
- Manage student absence queue
- Monitor attendance across all classes
- View academic performance metrics
- Manage grade locks (future feature)

---

## 🔐 Test Credentials

| Field | Value |
|-------|-------|
| **Email/Digital ID** | `test-vp@example.com` or VP Digital ID |
| **Password** | (Temporary password from Super Admin) |
| **Role** | `vice-principal` |

---

## 🎯 Test Scenarios

### **TS-VP-01: Authentication & Dashboard Access**

#### TC-VP-01-01: Login as Vice Principal
- **Steps:**
  1. Navigate to `/login`
  2. Enter VP credentials
  3. Click "Sign In"
- **Expected:**
  - ✅ Redirect to `/dashboard/vice-principal`
  - ✅ See personalized welcome: "Welcome, VP [FirstName]"
  - ✅ Dashboard shows 4 stat cards:
    - Pending Plans
    - Pending Absences
    - Today's Attendance
    - Grade Locks
  - ✅ See "Pending Lesson Plans" section
  - ✅ See "Absence Queue" section
- **API Calls:**
  - `POST /api/auth/login`
  - `GET /api/vice-principal/dashboard`
  - `GET /api/vice-principal/absence-queue?status=pending`
  - `GET /api/vice-principal/weekly-plans?status=Pending`

#### TC-VP-01-02: Dashboard Stats Display
- **Steps:**
  1. Login as VP
  2. Observe stat cards
- **Expected:**
  - ✅ "Pending Plans" shows count of lesson plans awaiting review
  - ✅ "Pending Absences" shows count of absences to process
  - ✅ "Today's Attendance" shows percentage (e.g., "93.5%")
  - ✅ All stats load from real API data
- **API Calls:**
  - `GET /api/vice-principal/dashboard`

---

### **TS-VP-02: Lesson Plan Review**

#### TC-VP-02-01: View Pending Lesson Plans
- **Steps:**
  1. Login as VP
  2. Scroll to "Pending Lesson Plans" section
- **Expected:**
  - ✅ See list of pending plans with:
    - Teacher name
    - Week number
    - Submission date
    - "Review" button
  - ✅ Badge shows count: "X pending"
  - ✅ If no plans: "No pending lesson plans 🎉"
- **API Calls:**
  - `GET /api/vice-principal/weekly-plans?status=Pending`

#### TC-VP-02-02: Open Lesson Plan Review Modal
- **Steps:**
  1. Click "Review" button on any plan
- **Expected:**
  - ✅ Modal opens with title "Review Lesson Plan"
  - ✅ Shows teacher name and week number
  - ✅ Displays plan details:
    - Objectives
    - Activities
    - Materials
    - Assessment
  - ✅ Shows "Decision" dropdown (Approve / Request Revision)
  - ✅ Shows rating stars (1-5)
  - ✅ Shows "Feedback (Optional)" textarea
  - ✅ Shows "Cancel" and action button

#### TC-VP-02-03: Approve Lesson Plan
- **Steps:**
  1. Open review modal
  2. Select "Approve" from dropdown
  3. Set rating (e.g., 4 stars)
  4. Add optional feedback
  5. Click "Approve Plan"
- **Expected:**
  - ✅ Button shows "Submitting..." during API call
  - ✅ Success toast: "Lesson plan reviewed successfully!"
  - ✅ Modal closes
  - ✅ Plan removed from pending list
  - ✅ Pending count decreases by 1
- **API Calls:**
  - `PATCH /api/vice-principal/weekly-plans/{planId}/review`
  - Request body: `{ status: "Approved", deanRating: 4, deanFeedback: "..." }`

#### TC-VP-02-04: Request Revision on Lesson Plan
- **Steps:**
  1. Open review modal
  2. Select "Request Revision" from dropdown
  3. Set rating (e.g., 2 stars)
  4. Add feedback explaining what needs improvement
  5. Click "Request Revision"
- **Expected:**
  - ✅ Button text changes to "Request Revision"
  - ✅ Button color changes to orange
  - ✅ Success toast: "Lesson plan reviewed successfully!"
  - ✅ Plan removed from pending list
  - ✅ Teacher receives notification (backend responsibility)
- **API Calls:**
  - `PATCH /api/vice-principal/weekly-plans/{planId}/review`
  - Request body: `{ status: "Revision Required", deanRating: 2, deanFeedback: "..." }`

#### TC-VP-02-05: Cancel Review
- **Steps:**
  1. Open review modal
  2. Click "Cancel"
- **Expected:**
  - ✅ Modal closes
  - ✅ No API call made
  - ✅ Plan remains in pending list

---

### **TS-VP-03: Absence Queue Management**

#### TC-VP-03-01: View Pending Absences
- **Steps:**
  1. Login as VP
  2. Scroll to "Absence Queue" section
- **Expected:**
  - ✅ See list of pending absences with:
    - Student name
    - Grade level
    - Date
    - Reason
    - Two action buttons (green checkmark, blue icon)
  - ✅ Badge shows count: "X pending"
  - ✅ If no absences: "No pending absences 🎉"
- **API Calls:**
  - `GET /api/vice-principal/absence-queue?status=pending`

#### TC-VP-03-02: Mark Absence as Excused
- **Steps:**
  1. Click green checkmark button on an absence
- **Expected:**
  - ✅ Success toast: "Absence marked as excused"
  - ✅ Absence removed from list
  - ✅ Pending count decreases by 1
- **API Calls:**
  - `PATCH /api/vice-principal/absence-queue/{id}`
  - Request body: `{ status: "excused" }`

#### TC-VP-03-03: Mark Absence as Notified
- **Steps:**
  1. Click blue icon button on an absence
- **Expected:**
  - ✅ Success toast: "Absence marked as notified"
  - ✅ Absence removed from list
  - ✅ Pending count decreases by 1
- **API Calls:**
  - `PATCH /api/vice-principal/absence-queue/{id}`
  - Request body: `{ status: "notified" }`

#### TC-VP-03-04: Handle Absence Action Error
- **Steps:**
  1. Disconnect from backend
  2. Try to mark absence as excused
- **Expected:**
  - ✅ Error toast with message from API
  - ✅ Absence remains in list
  - ✅ No UI state change

---

### **TS-VP-04: Attendance Oversight**

#### TC-VP-04-01: Navigate to Attendance Oversight
- **Steps:**
  1. Login as VP
  2. Click "Attendance" in sidebar
- **Expected:**
  - ✅ Navigate to `/vp-attendance`
  - ✅ See "VP Attendance Oversight" page
  - ✅ See attendance overview by class
  - ✅ See attendance alerts
- **API Calls:**
  - `GET /api/vice-principal/attendance-overview`
  - `GET /api/vice-principal/attendance-alerts`

#### TC-VP-04-02: View Attendance Overview
- **Steps:**
  1. On VP Attendance page
  2. View attendance overview table
- **Expected:**
  - ✅ See columns: Class, Section, Teacher, Total Students, Present, Absent, Late, Rate
  - ✅ Attendance rate shown as percentage
  - ✅ Color coding for rates (green >90%, yellow 80-90%, red <80%)
- **API Calls:**
  - `GET /api/vice-principal/attendance-overview?date=YYYY-MM-DD`

#### TC-VP-04-03: View Attendance Alerts
- **Steps:**
  1. On VP Attendance page
  2. View attendance alerts section
- **Expected:**
  - ✅ See alerts with severity badges (High/Medium/Low)
  - ✅ See student name, class, date, type, details
  - ✅ See action buttons (Approve/Flag)
- **API Calls:**
  - `GET /api/vice-principal/attendance-alerts`

#### TC-VP-04-04: Approve Attendance Alert
- **Steps:**
  1. Click "Approve" on an alert
  2. Add optional remarks
  3. Confirm
- **Expected:**
  - ✅ Success toast
  - ✅ Alert removed from list or status updated
- **API Calls:**
  - `PATCH /api/vice-principal/attendance-alerts/{alertId}`
  - Request body: `{ status: "Approved", remarks: "..." }`

---

### **TS-VP-05: Grade Management**

#### TC-VP-05-01: Navigate to Grades
- **Steps:**
  1. Login as VP
  2. Click "Grades" in sidebar
- **Expected:**
  - ✅ Navigate to `/grades`
  - ✅ See grade entry interface
  - ✅ VP has read-only access (cannot edit grades)
  - ✅ Can view all grades across all classes

#### TC-VP-05-02: View Transcripts
- **Steps:**
  1. Click "Transcripts" in sidebar
- **Expected:**
  - ✅ Navigate to `/transcripts`
  - ✅ See student transcript viewer
  - ✅ Can search and filter students
  - ✅ Can view academic history
- **API Calls:**
  - `GET /api/vice-principal/transcripts` (if exists)

---

### **TS-VP-06: Teacher Management**

#### TC-VP-06-01: View Teachers List
- **Steps:**
  1. Click "Teachers" in sidebar
- **Expected:**
  - ✅ Navigate to `/teachers`
  - ✅ See list of all teachers
  - ✅ Can view teacher profiles
  - ✅ Can see teacher performance metrics
- **API Calls:**
  - `GET /api/vice-principal/teachers`

---

### **TS-VP-07: Academic Performance Monitoring**

#### TC-VP-07-01: View Academic Performance
- **Steps:**
  1. Access academic performance section (if available)
- **Expected:**
  - ✅ See performance metrics by grade level
  - ✅ See performance metrics by course
  - ✅ Can filter by grade level and course
- **API Calls:**
  - `GET /api/vice-principal/academic-performance?gradeLevel=X&courseId=Y`

---

### **TS-VP-08: Error Handling & Edge Cases**

#### TC-VP-08-01: Empty States
- **Steps:**
  1. Login when no pending plans or absences exist
- **Expected:**
  - ✅ "No pending lesson plans 🎉"
  - ✅ "No pending absences 🎉"
  - ✅ Stat cards show "0"

#### TC-VP-08-02: API Error Handling
- **Steps:**
  1. Disconnect backend
  2. Try to review a plan
- **Expected:**
  - ✅ Error toast with meaningful message
  - ✅ No UI crash
  - ✅ Can retry action

#### TC-VP-08-03: Loading States
- **Steps:**
  1. Login with slow network
- **Expected:**
  - ✅ Loading spinner on dashboard
  - ✅ "Submitting..." on action buttons
  - ✅ Disabled buttons during API calls

---

## 📊 API Endpoints Summary

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/vice-principal/dashboard` | Get VP dashboard stats | ⏳ |
| GET | `/api/vice-principal/absence-queue` | Get pending absences | ⏳ |
| PATCH | `/api/vice-principal/absence-queue/{id}` | Update absence status | ⏳ |
| GET | `/api/vice-principal/weekly-plans` | Get pending lesson plans | ⏳ |
| PATCH | `/api/vice-principal/weekly-plans/{id}/review` | Review lesson plan | ⏳ |
| GET | `/api/vice-principal/attendance-overview` | Get attendance by class | ⏳ |
| GET | `/api/vice-principal/attendance-alerts` | Get attendance alerts | ⏳ |
| PATCH | `/api/vice-principal/attendance-alerts/{id}` | Approve/flag alert | ⏳ |
| GET | `/api/vice-principal/teachers` | Get teachers list | ⏳ |
| GET | `/api/vice-principal/academic-performance` | Get performance metrics | ⏳ |
| GET | `/api/vice-principal/grade-locks` | Get grade lock status | ⏳ |
| POST | `/api/vice-principal/grade-locks` | Toggle grade lock | ⏳ |

---

## 🎨 UI/UX Checklist

- [ ] Dashboard has indigo/purple gradient theme
- [ ] Welcome message shows "VP [FirstName]"
- [ ] Stat cards have proper icons and colors
- [ ] Lesson plan modal is scrollable for long content
- [ ] Rating stars are interactive and show selected state
- [ ] Toast notifications auto-dismiss after 3 seconds
- [ ] All buttons have hover states
- [ ] Loading states prevent double-clicks
- [ ] Empty states have friendly messages with emojis
- [ ] Dark mode support throughout

---

## 🐛 Known Issues

1. **Grade Locks Feature** - Not yet implemented in UI (shows "Manage" placeholder)
2. **Attendance Summary** - May need date picker for historical data
3. **Teacher Performance** - Metrics calculation needs backend support

---

## ✅ Test Results

| Test Case | Status | Notes | Tester | Date |
|-----------|--------|-------|--------|------|
| TC-VP-01-01 | ⏳ | | | |
| TC-VP-01-02 | ⏳ | | | |
| TC-VP-02-01 | ⏳ | | | |
| TC-VP-02-02 | ⏳ | | | |
| TC-VP-02-03 | ⏳ | | | |
| TC-VP-02-04 | ⏳ | | | |
| TC-VP-02-05 | ⏳ | | | |
| TC-VP-03-01 | ⏳ | | | |
| TC-VP-03-02 | ⏳ | | | |
| TC-VP-03-03 | ⏳ | | | |
| TC-VP-03-04 | ⏳ | | | |
| TC-VP-04-01 | ⏳ | | | |
| TC-VP-04-02 | ⏳ | | | |
| TC-VP-04-03 | ⏳ | | | |
| TC-VP-04-04 | ⏳ | | | |
| TC-VP-05-01 | ⏳ | | | |
| TC-VP-05-02 | ⏳ | | | |
| TC-VP-06-01 | ⏳ | | | |
| TC-VP-07-01 | ⏳ | | | |
| TC-VP-08-01 | ⏳ | | | |
| TC-VP-08-02 | ⏳ | | | |
| TC-VP-08-03 | ⏳ | | | |

---

## 📝 Testing Notes

### Pre-Testing Setup
1. Ensure backend is running on `http://localhost:3000`
2. Create VP test account via Super Admin
3. Have at least 2-3 pending lesson plans (create via Teacher account)
4. Have at least 2-3 pending absences (create via Teacher attendance marking)
5. Clear browser cache before testing

### Testing Priority
1. **High Priority:** Authentication, Dashboard, Lesson Plan Review, Absence Queue
2. **Medium Priority:** Attendance Oversight, Grade Viewing
3. **Low Priority:** Academic Performance, Teacher Management

### Success Criteria
- ✅ All High Priority tests pass
- ✅ No console errors during normal operation
- ✅ All API calls return expected data
- ✅ UI is responsive and accessible
- ✅ Error handling works gracefully

---

## 🔄 Next Steps

1. [ ] Create VP test account
2. [ ] Seed test data (lesson plans, absences)
3. [ ] Execute test cases in order
4. [ ] Document bugs in separate file
5. [ ] Create bug fix tickets
6. [ ] Retest after fixes
7. [ ] Mark test plan as complete

---

**Last Updated:** 2025-01-16  
**Test Plan Version:** 1.0  
**Prepared By:** Amazon Q Developer
