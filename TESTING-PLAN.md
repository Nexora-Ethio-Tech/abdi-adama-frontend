# 🧪 API Integration Testing Plan
**Abdi Adama School Management System**

> **Testing Approach:** One thing at a time, clean and clear  
> **API Base URL:** `https://api.abdi-adama.com/api`

---

## 📋 Testing Checklist Template

For each feature, verify:
- ✅ **API Call:** Request sent correctly
- ✅ **Loading State:** Spinner shows while loading
- ✅ **Success:** Data displays correctly
- ✅ **Error Handling:** Error message shows on failure
- ✅ **UI Update:** Page refreshes after create/update/delete

---

## 🔧 How to Test (Step-by-Step)

1. **Open Browser DevTools** (F12)
2. **Go to Network tab**
3. **Perform action** (e.g., click "Create Branch")
4. **Check Network tab** for API request
5. **Verify response** (200 OK = success)
6. **Check Console** for any errors
7. **Verify UI** updated correctly

---

## Phase 1: Authentication (Foundation)
**Test Order:** Must pass before testing any other endpoints

### 1.1 Login Flow
- [ ] Test Super Admin login (`abdiadamaschooloffice@gmail.com` / `SuperAdmin@2026`)
- [ ] Verify token storage in localStorage (`accessToken`, `refreshToken`)
- [ ] Check user object returned with correct role
- [ ] Test wrong credentials (should show error message)
- [ ] Test empty fields (should show validation error)

### 1.2 Token Refresh
- [ ] Test automatic token refresh on 401 error
- [ ] Verify new tokens stored in localStorage
- [ ] Verify user stays logged in after refresh

### 1.3 Get Current User
- [ ] Test `/auth/me` endpoint
- [ ] Verify user data matches login response
- [ ] Test with invalid token (should redirect to login)

**✅ Checkpoint:** Authentication working? → Proceed to Phase 2

---

## Phase 2: Super Admin (Network Control)
**Login as:** Super Admin (`abdiadamaschooloffice@gmail.com`)

### 2.1 Dashboard
- [ ] Load Super Admin dashboard
- [ ] Verify stats display (totalUsers, totalBranches, pendingApprovals, activeUsers)
- [ ] Check branch health matrix loads all branches
- [ ] Test drill-down to specific branch
- [ ] Test back to network view

### 2.2 Branch Management
- [ ] Navigate to `/branches`
- [ ] View all branches (GET `/super-admin/branches`)
- [ ] Create new branch (POST `/super-admin/branches`)
  - Name, code, phone, email, address
- [ ] View branch by ID (GET `/super-admin/branches/{id}`)
- [ ] Update branch details (PATCH `/super-admin/branches/{id}`)
- [ ] Delete test branch (DELETE `/super-admin/branches/{id}`)

### 2.3 User Management
- [ ] Navigate to user management
- [ ] Create School Admin (POST `/super-admin/create-school-admin`)
  - Save temporary password
  - Verify digitalId format (ADM-{BRANCH}-{number})
- [ ] Create Vice Principal (POST `/super-admin/create-vice-principal`)
- [ ] Create Auditor (POST `/super-admin/create-auditor`)
- [ ] View all users (GET `/super-admin/users`)
- [ ] Filter by role (GET `/super-admin/users?role=teacher`)
- [ ] Filter by status (GET `/super-admin/users?status=Pending`)
- [ ] Filter by branch (GET `/super-admin/users?branchId={id}`)
- [ ] Get user by ID (GET `/super-admin/users/{id}`)
- [ ] Approve pending user (PATCH `/super-admin/users/{id}/status` → `Approved`)
- [ ] Revoke user (PATCH `/super-admin/users/{id}/status` → `Revoked`)
- [ ] Delete user (DELETE `/super-admin/users/{id}`)

### 2.4 Academic Years
- [ ] Create global academic year (POST `/super-admin/academic-years`)
  - yearName: "2025-2026"
  - startDate, endDate
- [ ] View all academic years (GET `/super-admin/academic-years`)
- [ ] Activate academic year (PATCH `/super-admin/academic-years/{id}/activate`)

### 2.5 Reports
- [ ] Get system report (GET `/super-admin/reports/system`)
  - Verify totalUsers, totalBranches, totalStudents, totalTeachers
- [ ] Get branch report (GET `/super-admin/reports/branch/{branchId}`)
  - Verify branch-specific stats

**✅ Checkpoint:** Super Admin features working? → Proceed to Phase 3

---

## Phase 3: School Admin (Branch Management)
**Login as:** School Admin (created in Phase 2 or use `65plante@gmail.com`)

### 3.1 Dashboard
- [ ] Load School Admin dashboard (GET `/school-admin/dashboard`)
- [ ] Verify stats (totalStudents, totalTeachers, totalClasses, pendingApplications)
- [ ] Check recent activities display

### 3.2 User Registration
- [ ] Navigate to user registration
- [ ] Register Teacher (POST `/school-admin/register-user`)
  - role: "teacher", name, email
  - Save temporary password
- [ ] Register Student (POST `/school-admin/register-user`)
  - role: "student", name, email, grade (required)
- [ ] Register Parent (POST `/school-admin/register-user`)
- [ ] Register Finance Clerk (POST `/school-admin/register-user`)
- [ ] Register Librarian (POST `/school-admin/register-user`)
- [ ] Register Clinic Admin (POST `/school-admin/register-user`)
- [ ] Register Driver (POST `/school-admin/register-user`)
- [ ] Verify all users have status "Pending" (awaiting Super Admin approval)

### 3.3 Branch Users
- [ ] Navigate to `/branch-users`
- [ ] View all branch users (GET `/school-admin/users`)
- [ ] Filter by role
- [ ] Filter by status
- [ ] Verify only shows users from School Admin's branch

### 3.4 Classes
- [ ] Navigate to `/classes`
- [ ] Create class (POST `/school-admin/classes`)
  - name: "Grade 10", capacity: 40, section: "A"
- [ ] View all classes (GET `/school-admin/classes`)
- [ ] Update class (PATCH `/school-admin/classes/{id}`)
- [ ] Delete class (DELETE `/school-admin/classes/{id}`)
- [ ] Assign teacher to class (PATCH `/school-admin/classes/{id}/assign-teacher`)

### 3.5 Subjects
- [ ] Navigate to `/subjects`
- [ ] Create subject (POST `/school-admin/subjects`)
  - name: "Mathematics", code: "MATH101", description, gradeLevel
- [ ] View all subjects (GET `/school-admin/subjects`)
- [ ] Update subject (PATCH `/school-admin/subjects/{id}`)
- [ ] Delete subject (DELETE `/school-admin/subjects/{id}`)

### 3.6 Students
- [ ] Navigate to `/students`
- [ ] Create student (POST `/school-admin/students`)
  - Full student form with guardian info
- [ ] View all students (GET `/school-admin/students`)
- [ ] Filter by grade
- [ ] Filter by class
- [ ] Filter by status
- [ ] Get student by ID (GET `/school-admin/students/{id}`)
- [ ] Update student (PATCH `/school-admin/students/{id}`)
- [ ] Delete student (DELETE `/school-admin/students/{id}`)
- [ ] Assign student to class (PATCH `/school-admin/students/{id}/assign-class`)
- [ ] Get students by class (GET `/school-admin/students/class/{classId}`)
- [ ] Export students to CSV

### 3.7 Attendance
- [ ] Navigate to `/attendance-management`
- [ ] Select class and date
- [ ] Mark attendance (POST `/school-admin/attendance`)
  - Test all statuses: Present, Absent, Late, Excused
- [ ] View attendance records (GET `/school-admin/attendance`)
- [ ] Get attendance by class (GET `/school-admin/attendance/class/{classId}`)
- [ ] Get student attendance (GET `/school-admin/attendance/student/{studentId}`)
- [ ] Update attendance (PATCH `/school-admin/attendance/{id}`)
- [ ] Test bulk actions

### 3.8 Courses
- [ ] Create course (POST `/school-admin/courses`)
  - name: "Mathematics", code: "MATH101", teacherId, classId
- [ ] View all courses (GET `/school-admin/courses`)

### 3.9 Schedules
- [ ] Create schedule (POST `/school-admin/schedules`)
  - teacherId, day: "Monday", timeSlot: "08:00-09:00", className, subject
- [ ] View all schedules (GET `/school-admin/schedules`)

### 3.10 Branch Academic Years
- [ ] Create branch academic year (POST `/school-admin/academic-years`)
- [ ] View branch academic years (GET `/school-admin/academic-years`)
- [ ] Activate branch academic year (PATCH `/school-admin/academic-years/{id}/activate`)

### 3.11 Applications
- [ ] View pending applications (GET `/school-admin/applications`)
- [ ] Approve application (PATCH `/school-admin/applications/{id}/status` → `Approved`)
- [ ] Reject application (PATCH `/school-admin/applications/{id}/status` → `Rejected`)

### 3.12 Financial Policies
- [ ] Create financial policy (POST `/school-admin/financial-policies`)
  - gradeLevel, monthlyTuition, registrationFee, busFee, penaltyRate, academicYear
- [ ] View financial policies (GET `/school-admin/financial-policies`)

### 3.13 Get Branch Teachers
- [ ] View branch teachers (GET `/school-admin/teachers`)

**✅ Checkpoint:** School Admin features working? → Proceed to Phase 4

---

## Phase 4: Teacher (Classroom Operations)
**Login as:** Teacher (created in Phase 3, approved by Super Admin)

### 4.1 Dashboard
- [ ] Load Teacher dashboard (GET `/teacher/dashboard`)
- [ ] Verify stats (totalClasses, totalStudents, todaysSchedule, pendingGrades)

### 4.2 Classes
- [ ] Navigate to `/teacher-classes`
- [ ] View assigned classes (GET `/teacher/classes`)
- [ ] Click on class to view students
- [ ] View student roster (GET `/teacher/students/{classId}`)

### 4.3 Grades
- [ ] Navigate to `/teacher-grades`
- [ ] Select class
- [ ] Submit grade (POST `/teacher/grades`)
  - studentId, courseId, type: "midterm", score, total, weight
  - Test all types: Quiz, Exam, Assignment, Project, Midterm, Final
- [ ] View class grades (GET `/teacher/grades/{courseId}`)
- [ ] View student grades (GET `/teacher/grades/student/{studentId}`)
- [ ] Update grade (PATCH `/teacher/grades/{id}`)
- [ ] Verify color-coded performance indicators

### 4.4 Attendance
- [ ] Mark attendance (POST `/teacher/attendance`)
  - date, attendanceRecords array with studentId and status
- [ ] View attendance by class (GET `/teacher/attendance/{classId}`)

### 4.5 Schedule
- [ ] View teacher schedule (GET `/teacher/schedule`)
- [ ] Verify weekly timetable displays correctly

### 4.6 Weekly Plans
- [ ] Submit weekly plan (POST `/teacher/weekly-plans`)
  - status: "Draft"
  - All required fields: date, content, objectives, teacherActivity, etc.
- [ ] Submit weekly plan (POST `/teacher/weekly-plans`)
  - status: "Pending" (for VP review)
- [ ] View my weekly plans (GET `/teacher/weekly-plans`)
- [ ] Update weekly plan (PATCH `/teacher/weekly-plans/{id}`)

### 4.7 Communication Logs
- [ ] Submit communication log (POST `/teacher/communication-logs`)
  - studentId, weekEnding, ratings (0-3 for each category), teacherNote
- [ ] View communication logs (GET `/teacher/communication-logs/{studentId}`)

**✅ Checkpoint:** Teacher features working? → Proceed to Phase 5

---

## Phase 5: Vice Principal (Academic Oversight)
**Login as:** Vice Principal (created in Phase 2 or use `valerioero@gmail.com`)

### 5.1 Dashboard
- [ ] Load VP dashboard (GET `/vice-principal/dashboard`)
- [ ] Verify stats (totalStudents, totalTeachers, pendingAttendance, pendingWeeklyPlans)

### 5.2 Attendance Oversight
- [ ] Navigate to `/vp-attendance`
- [ ] View attendance overview (GET `/vice-principal/attendance-overview`)
- [ ] View attendance alerts (GET `/vice-principal/attendance-alerts`)
  - Check severity levels: High, Medium, Low
- [ ] Approve attendance (POST `/vice-principal/attendance/approve`)
  - Add remarks

### 5.3 Absence Queue
- [ ] View absence queue (GET `/vice-principal/absence-queue`)
- [ ] Update absence status (PATCH `/vice-principal/absence-queue/{id}`)
  - status: "excused"
  - status: "notified"

### 5.4 Weekly Plans Review
- [ ] View pending weekly plans (GET `/vice-principal/weekly-plans`)
- [ ] Review weekly plan - Approve (PATCH `/vice-principal/weekly-plans/{id}/review`)
  - status: "Approved", deanFeedback, deanRating (1-5)
- [ ] Review weekly plan - Revision Required (PATCH `/vice-principal/weekly-plans/{id}/review`)
  - status: "Revision Required", deanFeedback, deanRating

### 5.5 Grade Locks
- [ ] View grade locks (GET `/vice-principal/grade-locks`)
- [ ] Toggle grade lock - Lock (POST `/vice-principal/grade-locks`)
  - gradeLevel, isLocked: true, academicYearId
- [ ] Toggle grade lock - Unlock (POST `/vice-principal/grade-locks`)
  - isLocked: false

### 5.6 Reports
- [ ] View branch teachers (GET `/vice-principal/teachers`)
- [ ] View attendance summary (GET `/vice-principal/attendance-summary`)
- [ ] View academic performance (GET `/vice-principal/academic-performance`)

**✅ Checkpoint:** VP features working? → Proceed to Phase 6

---

## Phase 6: Auditor (Financial Oversight)
**Login as:** Auditor (created in Phase 2 or use `hailegit35@gmail.com`)

### 6.1 Dashboard
- [ ] Load Auditor dashboard (GET `/auditor/dashboard`)
- [ ] Verify stats (totalRevenue, totalExpenses, netProfit, pendingFeeReductions)
- [ ] Check recent transactions display

### 6.2 Payments (Read-Only)
- [ ] View all payments (GET `/auditor/payments`)
- [ ] Verify table displays correctly
- [ ] Verify cannot modify payments (read-only access)

### 6.3 Fee Reductions
- [ ] View fee reduction requests (GET `/auditor/fee-reductions`)
- [ ] Approve fee reduction (PATCH `/auditor/fee-reductions/{id}/status`)
  - status: "Approved", remarks
- [ ] Reject fee reduction (PATCH `/auditor/fee-reductions/{id}/status`)
  - status: "Rejected", remarks
- [ ] Verify status updates in UI

### 6.4 Reports
- [ ] View financial report (GET `/auditor/financial-report`)
  - Verify revenue/expense breakdown
- [ ] View audit trail (GET `/auditor/audit-trail`)
  - Check timestamp, user, action, changes

**✅ Checkpoint:** Auditor features working? → Proceed to Phase 7

---

## Phase 7: Finance Clerk (Fee Management)
**Login as:** Finance Clerk (created in Phase 3, approved by Super Admin)

### 7.1 Dashboard
- [ ] Navigate to `/finance-dashboard`
- [ ] Load dashboard (GET `/finance-clerk/dashboard`)
- [ ] Verify stats (totalRevenue, monthlyRevenue, pendingPayments, paidStudents)

### 7.2 Fees
- [ ] View all fees (GET `/finance-clerk/fees`)
- [ ] Filter by status (Paid, Pending, Overdue, Partial)
- [ ] Filter by grade
- [ ] Filter by term
- [ ] Search by student name
- [ ] View fees by student (GET `/finance-clerk/fees/student/{studentId}`)
- [ ] View pending payments (GET `/finance-clerk/fees/pending`)

### 7.3 Payments
- [ ] Record payment - Cash (POST `/finance-clerk/fees/payment`)
  - studentId, amount, feeType, paymentMethod: "Cash", transactionReference, remarks
- [ ] Record payment - Bank Transfer (POST `/finance-clerk/fees/payment`)
  - paymentMethod: "Bank Transfer"
- [ ] Record payment - Mobile Money (POST `/finance-clerk/fees/payment`)
  - paymentMethod: "Mobile Money"
- [ ] Record payment - Cheque (POST `/finance-clerk/fees/payment`)
  - paymentMethod: "Cheque"
- [ ] Verify payment recorded successfully
- [ ] Verify fee status updates

### 7.4 Audit Logs
- [ ] Navigate to `/audit-logs`
- [ ] View all audit logs (GET `/finance-clerk/audit-logs`)
- [ ] Test Gmail-style pagination
  - Navigate to page 2, 3, etc.
- [ ] Filter by direction (Money In / Money Out)
- [ ] Filter by category (Fees, Staff, Inventory, Other)
- [ ] Filter by section
- [ ] Filter by action type
- [ ] Filter by role
- [ ] Filter by amount range (min/max)
- [ ] Filter by date range (start/end date)
- [ ] Clear all filters
- [ ] Get audit log by ID (GET `/finance-clerk/audit-logs/{id}`)
- [ ] Export audit logs to CSV (POST `/finance-clerk/audit-logs/export`)
  - Verify CSV downloads correctly

**✅ Checkpoint:** Finance Clerk features working? → All Done! 🎉

---

## 🎯 Final Verification

### Cross-Role Testing
- [ ] Super Admin can view all branches
- [ ] School Admin can only see their branch users
- [ ] Teacher can only see their assigned classes
- [ ] VP can see all branch data
- [ ] Auditor has read-only access to payments
- [ ] Finance Clerk can only modify fee reductions (Auditor approves)

### Error Handling
- [ ] Test with expired token (should auto-refresh)
- [ ] Test with invalid data (should show validation errors)
- [ ] Test with network error (should show error message)
- [ ] Test with 404 (should show "not found" message)
- [ ] Test with 403 (should show "access denied" message)

### UI/UX
- [ ] Loading spinners show during API calls
- [ ] Success messages show after create/update/delete
- [ ] Error messages are clear and helpful
- [ ] Tables paginate correctly
- [ ] Filters work as expected
- [ ] Modals open/close properly
- [ ] Forms validate before submission

---

## 📊 Testing Progress Tracker

| Phase | Status | Completed | Total | Notes |
|-------|--------|-----------|-------|-------|
| Phase 1: Authentication | ⏳ | 0 | 3 | |
| Phase 2: Super Admin | ⏳ | 0 | 5 | |
| Phase 3: School Admin | ⏳ | 0 | 13 | |
| Phase 4: Teacher | ⏳ | 0 | 7 | |
| Phase 5: Vice Principal | ⏳ | 0 | 6 | |
| Phase 6: Auditor | ⏳ | 0 | 4 | |
| Phase 7: Finance Clerk | ⏳ | 0 | 4 | |
| **TOTAL** | ⏳ | **0** | **42** | |

**Legend:**
- ⏳ Not Started
- 🔄 In Progress
- ✅ Complete
- ❌ Failed

---

## 🐛 Bug Tracking

| Bug ID | Phase | Description | Severity | Status | Fixed In |
|--------|-------|-------------|----------|--------|----------|
| | | | | | |

**Severity Levels:**
- 🔴 Critical (Blocker)
- 🟠 High (Major issue)
- 🟡 Medium (Minor issue)
- 🟢 Low (Enhancement)

---

## 📝 Notes

- Always test in order (Phase 1 → Phase 7)
- Each phase depends on previous phases
- Document any issues in Bug Tracking section
- Update progress tracker after each phase
- Take screenshots of errors for debugging

---

**Last Updated:** 2025-01-XX  
**Tester:** [Your Name]  
**Environment:** Development  
**API Version:** v1
