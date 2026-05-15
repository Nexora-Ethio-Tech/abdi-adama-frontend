# Test Plan 02: School Admin - Student Management

**Feature**: School Admin Student Management & Class Assignment  
**Priority**: CRITICAL  
**Dependencies**: Backend API (schoolAdminService.ts, studentService.ts, classService.ts)  
**Estimated Time**: 3-4 hours

---

## 1. Overview

This test plan covers all School Admin student management features including creating students, editing student information, assigning students to classes, approving/revoking students, and deleting students.

---

## 2. Test Scope

### In Scope:
- View all students with filtering (grade, status)
- Search students by name, email, or digital ID
- Create new students
- Edit existing student information
- Assign students to classes
- Remove students from classes
- Approve pending students
- Revoke approved students
- Delete students
- Export student list to CSV
- Real-time UI updates after actions

### Out of Scope:
- Student portal features (covered in separate test plan)
- Parent-student relationships (not implemented)
- Bulk operations (not implemented)

---

## 3. Test Environment Setup

### Prerequisites:
1. Backend API running
2. Frontend dev server running
3. Logged in as School Admin (AD001)
4. At least 2-3 classes created in the system
5. Browser DevTools open (Network + Console tabs)

### Test Data Required:
```
School Admin Login: AD001 / [valid password]
Test Student 1: New student to be created
Test Student 2: Existing student for editing
Test Classes: At least 2 classes (e.g., "Grade 10 - Section A", "Grade 11 - Section B")
```

---

## 4. Test Cases

### TC-ADMIN-STU-001: View Students List
**Priority**: CRITICAL  
**Preconditions**: Logged in as School Admin, at least 1 student exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Students page | Students page loads |
| 2 | Observe page header | Shows "Students" title and "Manage student records and class assignments" subtitle |
| 3 | Check action buttons | "Add Student" and "Export" buttons visible |
| 4 | Observe students table | Table displays with columns: Student, Digital ID, Grade, Class, Status, Actions |
| 5 | Check student data | Each row shows student avatar, name, email, digital ID, grade, class, status badge |
| 6 | Verify status badges | Color-coded: Green (Active), Gray (Inactive), Red (Suspended), Blue (Graduated) |
| 7 | Check action buttons | Each row has: Assign Class (Users icon), Edit (Edit2 icon), Approve/Revoke (Check/XCircle), Delete (Trash2) |
| 8 | Check API call | Network tab shows GET to `/api/school-admin/users?role=student` with status 200 |

**Pass Criteria**: Students list displays correctly with all data and action buttons

---

### TC-ADMIN-STU-002: Search Students
**Priority**: HIGH  
**Preconditions**: Multiple students exist in the system

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Locate search input | Search box with magnifying glass icon visible |
| 2 | Type student name (e.g., "John") | Input accepted |
| 3 | Observe table | Table filters to show only matching students |
| 4 | Clear search | Type empty string |
| 5 | Observe table | All students displayed again |
| 6 | Search by email (e.g., "john@") | Matching students displayed |
| 7 | Search by digital ID (e.g., "STD-AD-0001") | Matching student displayed |
| 8 | Search non-existent name | "No students found" message displayed |

**Pass Criteria**: Search filters students correctly by name, email, and digital ID

---

### TC-ADMIN-STU-003: Filter by Grade
**Priority**: HIGH  
**Preconditions**: Students from multiple grades exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Locate grade filter dropdown | Dropdown shows "All Grades" |
| 2 | Click dropdown | Shows options: All Grades, Grade 1-12 |
| 3 | Select "Grade 10" | Dropdown updates to "Grade 10" |
| 4 | Observe table | Only Grade 10 students displayed |
| 5 | Check student grades | All displayed students show "Grade 10" |
| 6 | Select "All Grades" | All students displayed again |

**Pass Criteria**: Grade filter correctly filters students by selected grade

---

### TC-ADMIN-STU-004: Filter by Status
**Priority**: HIGH  
**Preconditions**: Students with different statuses exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Locate status filter dropdown | Dropdown shows "All Status" |
| 2 | Click dropdown | Shows: All Status, Active, Inactive, Suspended, Graduated |
| 3 | Select "Active" | Dropdown updates to "Active" |
| 4 | Check API call | GET to `/api/school-admin/users?role=student&status=Active` |
| 5 | Observe table | Only Active students displayed |
| 6 | Check status badges | All displayed students have green "ACTIVE" badge |
| 7 | Select "Pending" | Only Pending students displayed |
| 8 | Select "All Status" | All students displayed |

**Pass Criteria**: Status filter triggers API call and displays correct students

---

### TC-ADMIN-STU-005: Create New Student - Valid Data
**Priority**: CRITICAL  
**Preconditions**: Logged in as School Admin

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add Student" button | Modal opens with title "Add New Student" |
| 2 | Check modal fields | Shows: Full Name, Email, Grade dropdown |
| 3 | Check note | Blue info box: "A 4-digit PIN will be auto-generated" |
| 4 | Enter name: "Abebe Bekele" | Input accepted |
| 5 | Enter email: "abebe.bekele@test.com" | Input accepted |
| 6 | Select grade: "Grade 10" | Dropdown updates |
| 7 | Click "Create Student" | Button shows loading spinner "Creating..." |
| 8 | Check API call | POST to `/api/school-admin/register-user` with body: `{name, email, role: "student", grade}` |
| 9 | Check response | Status 200, returns user object with digital_id and temporaryPassword |
| 10 | Observe UI | Success toast: "Student created successfully!" |
| 11 | Check modal | Modal closes automatically |
| 12 | Check table | New student appears in the list |
| 13 | Verify new student data | Shows correct name, email, grade, status "Pending" |
| 14 | Check digital ID | Format: STD-AD-XXXX (e.g., STD-AD-0003) |

**Pass Criteria**: Student created successfully and appears in the list immediately

---

### TC-ADMIN-STU-006: Create New Student - Missing Required Fields
**Priority**: HIGH  
**Preconditions**: Add Student modal is open

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Leave all fields empty | Fields empty |
| 2 | Click "Create Student" | Browser validation: "Please fill out this field" on Full Name |
| 3 | Enter name only | Name filled |
| 4 | Click "Create Student" | Browser validation on Email field |
| 5 | Enter name and email | Both filled |
| 6 | Leave grade empty | Grade dropdown shows "Select Grade" |
| 7 | Click "Create Student" | Browser validation on Grade field |
| 8 | Check API call | No API call made (form validation prevents submission) |

**Pass Criteria**: Form validation prevents submission with missing required fields

---

### TC-ADMIN-STU-007: Create New Student - Duplicate Email
**Priority**: HIGH  
**Preconditions**: Student with email "existing@test.com" already exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add Student" | Modal opens |
| 2 | Enter name: "Test Duplicate" | Input accepted |
| 3 | Enter email: "existing@test.com" | Input accepted |
| 4 | Select grade: "Grade 9" | Dropdown updates |
| 5 | Click "Create Student" | Loading state shows |
| 6 | Check API response | Status 400 or 409, error message: "Email already exists" or similar |
| 7 | Observe UI | Error toast: "Failed to create student" or specific error message |
| 8 | Check modal | Modal remains open |
| 9 | Check table | No new student added |

**Pass Criteria**: Duplicate email rejected with appropriate error message

---

### TC-ADMIN-STU-008: Edit Student Information
**Priority**: CRITICAL  
**Preconditions**: At least one student exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Locate a student row | Student visible in table |
| 2 | Click Edit icon (pencil) | Edit modal opens with title "Edit Student" |
| 3 | Check pre-filled data | Name, email, and grade fields populated with current values |
| 4 | Change name to "Updated Name" | Input accepted |
| 5 | Change email to "updated@test.com" | Input accepted |
| 6 | Change grade to "Grade 11" | Dropdown updates |
| 7 | Click "Save Changes" | Button shows loading: "Saving..." |
| 8 | Check API call | PATCH to `/api/school-admin/users/{userId}` with updated data |
| 9 | Check response | Status 200, returns updated user object |
| 10 | Observe UI | Success toast: "Student updated successfully!" |
| 11 | Check modal | Modal closes |
| 12 | Check table | Student row shows updated information |
| 13 | Verify changes | Name, email, and grade reflect new values |

**Pass Criteria**: Student information updated successfully and UI reflects changes

---

### TC-ADMIN-STU-009: Edit Student - Cancel Without Saving
**Priority**: MEDIUM  
**Preconditions**: Edit modal is open with changes made

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open edit modal for a student | Modal opens with current data |
| 2 | Change name to "Test Cancel" | Input accepted |
| 3 | Click "Cancel" button | Modal closes immediately |
| 4 | Check API call | No PATCH request made |
| 5 | Check table | Student data unchanged (original values) |

**Pass Criteria**: Cancel button closes modal without saving changes

---

### TC-ADMIN-STU-010: Assign Student to Class - Success
**Priority**: CRITICAL  
**Preconditions**: Student exists without class assignment, at least 2 classes exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Locate student with "Unassigned" class | Student visible |
| 2 | Click "Assign Class" icon (Users) | Assign Class modal opens |
| 3 | Check modal header | Shows "Assign Class" title and student name |
| 4 | Observe class list | All available classes displayed as clickable cards |
| 5 | Check class card info | Each shows: Class name, Section, Capacity |
| 6 | Click a class card (e.g., "Grade 10 - Section A") | Card highlights on hover |
| 7 | Confirm selection | Class selected |
| 8 | Check API call | POST to `/api/school-admin/students/assign-class` with `{studentId, classId}` |
| 9 | Check response | Status 200, returns: `{success: true, data: {student, class}}` |
| 10 | Observe UI | Success toast: "Class assigned successfully!" |
| 11 | Check modal | Modal closes |
| 12 | **Check table immediately** | Student row updates to show assigned class name (e.g., "Grade 10 - Section A") |
| 13 | Verify class column | No longer shows "Unassigned" |
| 14 | Refresh page | Class assignment persists after refresh |

**Pass Criteria**: ✅ **Student assigned to class AND UI updates immediately without page refresh**

---

### TC-ADMIN-STU-011: Assign Student to Class - No Classes Available
**Priority**: MEDIUM  
**Preconditions**: No classes exist in the system

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Assign Class" for a student | Modal opens |
| 2 | Observe modal content | Message: "No classes available. Create classes first." |
| 3 | Check for class cards | No class cards displayed |
| 4 | Close modal | Modal closes |

**Pass Criteria**: Appropriate message shown when no classes exist

---

### TC-ADMIN-STU-012: Assign Student to Different Class (Reassignment)
**Priority**: HIGH  
**Preconditions**: Student already assigned to "Grade 10 - Section A"

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Locate student with existing class | Shows "Grade 10 - Section A" |
| 2 | Click "Assign Class" icon | Modal opens |
| 3 | Select different class "Grade 10 - Section B" | Class selected |
| 4 | Check API call | POST to assign-class endpoint |
| 5 | Observe UI | Success toast |
| 6 | Check table | Class updates to "Grade 10 - Section B" |
| 7 | Verify old class | No longer shows "Section A" |

**Pass Criteria**: Student successfully reassigned to new class

---

### TC-ADMIN-STU-013: Approve Pending Student
**Priority**: CRITICAL  
**Preconditions**: Student with status "Pending" exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Filter by status "Pending" | Only pending students shown |
| 2 | Locate pending student | Status badge shows "PENDING" |
| 3 | Check action buttons | Green checkmark icon (Approve) visible |
| 4 | Click Approve icon | Confirmation modal opens |
| 5 | Check modal | Title: "Confirm Approval", message asks for confirmation |
| 6 | Click "Approve" button | Button shows "Processing..." |
| 7 | Check API call | PATCH to `/api/school-admin/users/{userId}/status` with `{status: "Approved"}` |
| 8 | Check response | Status 200 |
| 9 | Observe UI | Success toast: "Student approved successfully!" |
| 10 | Check modal | Modal closes |
| 11 | Check table | Student status updates to "APPROVED" with green badge |
| 12 | Check action buttons | Approve button replaced with Revoke button (orange XCircle) |

**Pass Criteria**: Student approved successfully and status updates in UI

---

### TC-ADMIN-STU-014: Revoke Approved Student
**Priority**: HIGH  
**Preconditions**: Student with status "Approved" exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Locate approved student | Status badge shows "APPROVED" (green) |
| 2 | Check action buttons | Orange XCircle icon (Revoke) visible |
| 3 | Click Revoke icon | Confirmation modal opens |
| 4 | Check modal | Title: "Confirm Revocation", asks for confirmation |
| 5 | Click "Revoke" button | Button shows "Processing..." |
| 6 | Check API call | PATCH to status endpoint with `{status: "Revoked"}` |
| 7 | Observe UI | Success toast: "Student revoked successfully!" |
| 8 | Check table | Status updates to "REVOKED" |
| 9 | Check action buttons | Revoke button replaced with Approve button |

**Pass Criteria**: Student revoked successfully and UI updates

---

### TC-ADMIN-STU-015: Delete Student - Confirm Deletion
**Priority**: CRITICAL  
**Preconditions**: At least one student exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Locate a student | Student visible in table |
| 2 | Click Delete icon (Trash2) | Confirmation modal opens |
| 3 | Check modal | Title: "Confirm Deletion", warning message with student name |
| 4 | Check warning | States "This action cannot be undone" |
| 5 | Click "Delete Student" button | Button processes |
| 6 | Check API call | DELETE to `/api/school-admin/students/{studentId}` |
| 7 | Check response | Status 200 or 204 |
| 8 | Observe UI | Success toast: "Student deleted successfully!" |
| 9 | Check modal | Modal closes |
| 10 | Check table | Student removed from list immediately |
| 11 | Refresh page | Student remains deleted (not in list) |

**Pass Criteria**: Student deleted successfully and removed from UI

---

### TC-ADMIN-STU-016: Delete Student - Cancel Deletion
**Priority**: MEDIUM  
**Preconditions**: Delete confirmation modal is open

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open delete confirmation | Modal shows |
| 2 | Click "Cancel" button | Modal closes immediately |
| 3 | Check API call | No DELETE request made |
| 4 | Check table | Student still present in list |

**Pass Criteria**: Cancel prevents deletion

---

### TC-ADMIN-STU-017: Export Students to CSV
**Priority**: MEDIUM  
**Preconditions**: At least 3 students exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Export" button | File download initiates |
| 2 | Check download | File named "students.csv" downloaded |
| 3 | Open CSV file | File opens in spreadsheet application |
| 4 | Check headers | First row: "ID,Name,Email,Grade,Class,Status" |
| 5 | Check data rows | Each student on separate row with correct data |
| 6 | Verify format | Comma-separated values, proper escaping |
| 7 | Check student count | Number of rows matches number of students in table |
| 8 | Verify class column | Shows class name or "Unassigned" |

**Pass Criteria**: CSV file exports correctly with all student data

---

### TC-ADMIN-STU-018: Combined Filters (Search + Grade + Status)
**Priority**: MEDIUM  
**Preconditions**: Multiple students with various grades and statuses

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select grade "Grade 10" | Only Grade 10 students shown |
| 2 | Select status "Active" | Only Active Grade 10 students shown |
| 3 | Type search "John" | Only Active Grade 10 students named John shown |
| 4 | Clear search | Active Grade 10 students shown |
| 5 | Change grade to "All Grades" | All Active students shown |
| 6 | Change status to "All Status" | All students shown |

**Pass Criteria**: Multiple filters work together correctly

---

### TC-ADMIN-STU-019: UI Responsiveness - Mobile View
**Priority**: MEDIUM  
**Preconditions**: Students page loaded

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Resize browser to mobile width (375px) | Layout adapts to mobile |
| 2 | Check header | Title and buttons stack vertically |
| 3 | Check filters | Filters stack vertically or wrap |
| 4 | Check table | Table scrolls horizontally or adapts |
| 5 | Check modals | Modals fit mobile screen |
| 6 | Test all actions | All buttons remain clickable and functional |

**Pass Criteria**: Page is fully functional on mobile devices

---

### TC-ADMIN-STU-020: Loading States
**Priority**: MEDIUM  
**Preconditions**: Slow network or large dataset

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Students page | Loading spinner shows while fetching |
| 2 | Observe loading state | Centered spinner with blue color |
| 3 | Wait for data | Spinner disappears when data loads |
| 4 | Create new student | Button shows "Creating..." with spinner |
| 5 | Edit student | Button shows "Saving..." with spinner |
| 6 | Approve student | Button shows "Processing..." |
| 7 | Check disabled state | Buttons disabled during processing |

**Pass Criteria**: All loading states display correctly and prevent duplicate submissions

---

### TC-ADMIN-STU-021: Error Handling - Network Failure
**Priority**: HIGH  
**Preconditions**: Backend server stopped or network disconnected

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Stop backend server | Server not accessible |
| 2 | Navigate to Students page | Loading spinner shows |
| 3 | Wait for timeout | Error message displays in red box |
| 4 | Check error message | Shows "Failed to fetch students" or network error |
| 5 | Try to create student | Error toast: "Failed to create student" |
| 6 | Restart backend | Server accessible |
| 7 | Refresh page | Data loads successfully |

**Pass Criteria**: Network errors handled gracefully with user-friendly messages

---

### TC-ADMIN-STU-022: Error Handling - API Errors
**Priority**: HIGH  
**Preconditions**: Backend returns error responses

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Trigger 400 error (invalid data) | Error toast shows specific error message |
| 2 | Trigger 401 error (unauthorized) | Redirected to login or token refreshed |
| 3 | Trigger 403 error (forbidden) | Error toast: "Access denied" |
| 4 | Trigger 404 error (not found) | Error toast: "Student not found" |
| 5 | Trigger 500 error (server error) | Error toast: "Server error. Please try again." |

**Pass Criteria**: All API errors handled with appropriate user feedback

---

### TC-ADMIN-STU-023: Toast Notifications Auto-Dismiss
**Priority**: LOW  
**Preconditions**: Any action that triggers toast

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Perform successful action | Success toast appears (green) |
| 2 | Wait 3 seconds | Toast automatically disappears |
| 3 | Perform error action | Error toast appears (red) |
| 4 | Wait 3 seconds | Toast automatically disappears |
| 5 | Check animation | Toast slides in from top-right |

**Pass Criteria**: Toasts auto-dismiss after 3 seconds

---

### TC-ADMIN-STU-024: Data Persistence After Actions
**Priority**: HIGH  
**Preconditions**: Perform multiple actions

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create new student | Student appears in list |
| 2 | Refresh page (F5) | New student still in list |
| 3 | Assign class to student | Class assignment shows |
| 4 | Refresh page | Class assignment persists |
| 5 | Edit student info | Changes show |
| 6 | Refresh page | Changes persist |
| 7 | Approve student | Status updates |
| 8 | Refresh page | Status remains approved |

**Pass Criteria**: All changes persist after page refresh

---

### TC-ADMIN-STU-025: Concurrent User Actions
**Priority**: LOW  
**Preconditions**: Two admin users logged in

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Admin 1: Edit student | Changes saved |
| 2 | Admin 2: Refresh page | Sees Admin 1's changes |
| 3 | Admin 2: Assign class | Class assigned |
| 4 | Admin 1: Refresh page | Sees Admin 2's class assignment |
| 5 | Check data consistency | Both admins see same data |

**Pass Criteria**: Changes from one admin visible to other admins after refresh

---

## 5. Bug Found & Fixed

### 🐛 **BUG-ADMIN-STU-001: Class Assignment Not Updating UI**

**Severity**: HIGH  
**Status**: ✅ FIXED

**Description**: When assigning a student to a class, the API returns success and the class assignment is saved in the database, but the UI does not update to show the assigned class name. The student row continues to show "Unassigned" until the page is manually refreshed.

**Root Cause**: 
- The `handleAssignClass` function was not using the API response data to update the local state
- The function called `fetchStudents()` to refetch all students, but there was no optimistic UI update
- The response structure from the API includes the assigned class information that was being ignored

**Fix Applied**:
```typescript
// Before (line 157-166):
const handleAssignClass = async (classId: string) => {
  if (!selectedStudent) return;
  try {
    await assignStudentToClass(selectedStudent.userId, classId);
    showToast('Class assigned successfully!', 'success');
    setShowAssignModal(false);
    setSelectedStudent(null);
    fetchStudents();
  } catch (err: any) {
    showToast(err.response?.data?.error?.message || 'Failed to assign class', 'error');
  }
};

// After (FIXED):
const handleAssignClass = async (classId: string) => {
  if (!selectedStudent) return;
  try {
    const response = await assignStudentToClass(selectedStudent.userId, classId);
    
    // Get the assigned class name from the response
    const assignedClassName = response.data?.class?.name || '';
    
    // Update the student in local state immediately (optimistic update)
    setStudents(prevStudents => 
      prevStudents.map(s => 
        s.userId === selectedStudent.userId 
          ? { ...s, classId, className: assignedClassName }
          : s
      )
    );
    
    showToast('Class assigned successfully!', 'success');
    setShowAssignModal(false);
    setSelectedStudent(null);
    
    // Refetch to ensure data consistency
    fetchStudents();
  } catch (err: any) {
    showToast(err.response?.data?.error?.message || 'Failed to assign class', 'error');
  }
};
```

**Verification Steps**:
1. Assign a student to a class
2. Observe the student row in the table
3. ✅ Class name should update immediately without page refresh
4. Refresh the page
5. ✅ Class assignment should persist

---

## 6. Test Execution Checklist

- [ ] All 25 test cases executed
- [ ] All CRITICAL priority tests passed (TC-001, 005, 008, 010, 013, 015)
- [ ] All HIGH priority tests passed
- [ ] Bug BUG-ADMIN-STU-001 verified as fixed
- [ ] Defects logged for any failed tests
- [ ] Network tab screenshots captured
- [ ] Console errors documented
- [ ] Mobile responsive testing completed
- [ ] Cross-browser testing (Chrome, Firefox, Edge)

---

## 7. Test Data Cleanup

After testing:
1. Delete all test students created during testing
2. Document any students that should remain for other tests
3. Clear browser localStorage
4. Reset database to known state if needed

---

## 8. Success Metrics

- **Pass Rate Target**: 95% (24/25 test cases)
- **Critical Tests**: 100% pass rate required
- **High Priority Tests**: 95% pass rate required
- **Execution Time**: Should complete within 3-4 hours
- **Bug Fix Verification**: BUG-ADMIN-STU-001 must be verified as fixed

---

## 9. Known Issues

1. ✅ **FIXED**: Class assignment not updating UI immediately (BUG-ADMIN-STU-001)

---

## 10. Next Test Plans

After completing this test plan, proceed to:
- **Test Plan 03**: School Admin - Teacher Management
- **Test Plan 04**: School Admin - Class Management
- **Test Plan 05**: School Admin - Registration Pipeline

---

**Status**: ⏳ READY FOR TESTING  
**Assigned To**: [Your Name]  
**Start Date**: [Date]  
**Completion Date**: [Date]
