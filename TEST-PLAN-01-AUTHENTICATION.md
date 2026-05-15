# Test Plan 01: Authentication & Login System

**Feature**: User Authentication and Role-Based Access Control  
**Priority**: CRITICAL  
**Dependencies**: Backend API (authService.ts)  
**Estimated Time**: 2-3 hours

---

## 1. Overview

This test plan covers the complete authentication flow including login, logout, token management, role-based access, and session persistence.

---

## 2. Test Scope

### In Scope:
- Login functionality for all 8 roles
- Password validation
- Token generation and storage
- Role-based dashboard routing
- Session persistence (localStorage)
- Automatic token refresh on 401 errors
- Logout functionality
- Invalid credential handling
- Network error handling

### Out of Scope:
- Password reset (not implemented)
- Two-factor authentication (not implemented)
- Account lockout after failed attempts (not implemented)

---

## 3. Test Environment Setup

### Prerequisites:
1. Backend API running and accessible
2. Frontend dev server running (`npm run dev`)
3. Browser DevTools open (Network + Console tabs)
4. Clear browser localStorage before starting

### Test Data Required:
```
Super Admin:    SA001 / [valid password]
School Admin:   AD001 / [valid password]
Vice Principal: VP001 / [valid password]
Teacher:        TC001 / [valid password]
Finance Clerk:  FC001 / [valid password]
Auditor:        AU001 / [valid password]
Student:        ST001 / [valid password]
Driver:         DR001 / [valid password]
Parent:         PR001 / [valid password]
```

---

## 4. Test Cases

### TC-AUTH-001: Valid Login - Super Admin
**Priority**: CRITICAL  
**Preconditions**: User is on login page, not authenticated

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `http://localhost:5173/` | Login page displays with ID and Password fields |
| 2 | Enter `SA001` in Login ID field | Input accepted |
| 3 | Enter valid password | Input masked with dots |
| 4 | Click "Sign In" button | Loading state shows briefly |
| 5 | Observe network request | POST to `/api/auth/login` with status 200 |
| 6 | Check response | Contains `token`, `user` object with `role: "super_admin"` |
| 7 | Check localStorage | `token` and `user` stored correctly |
| 8 | Observe redirect | Redirected to `/super-admin` dashboard |
| 9 | Check dashboard content | Super Admin dashboard loads with branch health matrix |
| 10 | Check sidebar | Shows Super Admin menu items (Branches, Users, Settings) |

**Pass Criteria**: User successfully logs in and sees Super Admin dashboard

---

### TC-AUTH-002: Valid Login - School Admin
**Priority**: CRITICAL  
**Preconditions**: User is on login page, not authenticated

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to login page | Login page displays |
| 2 | Enter `AD001` in Login ID | Input accepted |
| 3 | Enter valid password | Input masked |
| 4 | Click "Sign In" | Loading state shows |
| 5 | Check API response | Status 200, `role: "school_admin"` |
| 6 | Observe redirect | Redirected to `/admin` dashboard |
| 7 | Check dashboard | School Admin dashboard with registration pipeline |
| 8 | Check sidebar | Shows Admin menu (Students, Teachers, Registration, Reports) |

**Pass Criteria**: School Admin logs in and sees correct dashboard

---

### TC-AUTH-003: Valid Login - Vice Principal
**Priority**: HIGH  
**Preconditions**: User is on login page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login with `VP001` | Successful login |
| 2 | Check redirect | Redirected to `/vp` dashboard |
| 3 | Check dashboard | VP dashboard with Staff Shortage Command Center |
| 4 | Check sidebar | Shows VP menu (Attendance, Proxy Management, Reports) |

**Pass Criteria**: VP logs in and sees attendance oversight dashboard

---

### TC-AUTH-004: Valid Login - Teacher
**Priority**: HIGH  
**Preconditions**: User is on login page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login with `TC001` | Successful login |
| 2 | Check redirect | Redirected to `/teacher` dashboard |
| 3 | Check dashboard | Teacher dashboard with classes and schedule |
| 4 | Check sidebar | Shows Teacher menu (My Classes, Grades, Attendance, Schedule) |

**Pass Criteria**: Teacher logs in and sees class management dashboard

---

### TC-AUTH-005: Valid Login - Finance Clerk
**Priority**: HIGH  
**Preconditions**: User is on login page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login with `FC001` | Successful login |
| 2 | Check redirect | Redirected to `/finance` dashboard |
| 3 | Check dashboard | Finance dashboard with payment stats and pending payments |
| 4 | Check sidebar | Shows Finance menu (Payments, Audit Logs, Reports, Assets) |

**Pass Criteria**: Finance Clerk logs in and sees financial dashboard

---

### TC-AUTH-006: Valid Login - Auditor
**Priority**: HIGH  
**Preconditions**: User is on login page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login with `AU001` | Successful login |
| 2 | Check redirect | Redirected to `/auditor` dashboard |
| 3 | Check dashboard | Auditor dashboard with read-only financial overview |
| 4 | Check sidebar | Shows Auditor menu (Audit Logs, Reports, Fee Reductions) |

**Pass Criteria**: Auditor logs in and sees read-only financial dashboard

---

### TC-AUTH-007: Valid Login - Student
**Priority**: MEDIUM  
**Preconditions**: User is on login page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login with `ST001` | Successful login |
| 2 | Check redirect | Redirected to `/student` dashboard |
| 3 | Check dashboard | Student portal with courses, grades, schedule |
| 4 | Check sidebar | Shows Student menu (Courses, Grades, Schedule, Fees) |

**Pass Criteria**: Student logs in and sees student portal

---

### TC-AUTH-008: Valid Login - Driver
**Priority**: LOW  
**Preconditions**: User is on login page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login with `DR001` | Successful login |
| 2 | Check redirect | Redirected to `/driver` dashboard |
| 3 | Check dashboard | Driver portal with routes and notices |
| 4 | Check sidebar | Shows Driver menu (Routes, Notices, Stations) |

**Pass Criteria**: Driver logs in and sees logistics dashboard

---

### TC-AUTH-009: Valid Login - Parent
**Priority**: LOW  
**Preconditions**: User is on login page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login with `PR001` | Successful login |
| 2 | Check redirect | Redirected to `/parent` dashboard |
| 3 | Check dashboard | Parent portal with child monitoring |
| 4 | Check sidebar | Shows Parent menu (Children, Fees, Clinic Chat, Notices) |

**Pass Criteria**: Parent logs in and sees child monitoring dashboard

---

### TC-AUTH-010: Invalid Login - Wrong Password
**Priority**: CRITICAL  
**Preconditions**: User is on login page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter `SA001` in Login ID | Input accepted |
| 2 | Enter `wrongpassword123` | Input masked |
| 3 | Click "Sign In" | Loading state shows |
| 4 | Check API response | Status 401 or 400 |
| 5 | Observe UI | Error toast/message: "Invalid credentials" |
| 6 | Check localStorage | No token or user data stored |
| 7 | Check current page | Still on login page |

**Pass Criteria**: Login fails with appropriate error message

---

### TC-AUTH-011: Invalid Login - Non-existent User
**Priority**: HIGH  
**Preconditions**: User is on login page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter `XX999` in Login ID | Input accepted |
| 2 | Enter any password | Input masked |
| 3 | Click "Sign In" | Loading state shows |
| 4 | Check API response | Status 404 or 401 |
| 5 | Observe UI | Error message: "User not found" or "Invalid credentials" |
| 6 | Check localStorage | No data stored |

**Pass Criteria**: Login fails with appropriate error message

---

### TC-AUTH-012: Invalid Login - Empty Fields
**Priority**: MEDIUM  
**Preconditions**: User is on login page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Leave Login ID empty | Field empty |
| 2 | Leave Password empty | Field empty |
| 3 | Click "Sign In" | No API call made |
| 4 | Observe UI | Validation error: "Login ID is required" |
| 5 | Enter `SA001` only | Password still empty |
| 6 | Click "Sign In" | Validation error: "Password is required" |

**Pass Criteria**: Form validation prevents submission with empty fields

---

### TC-AUTH-013: Logout Functionality
**Priority**: CRITICAL  
**Preconditions**: User is logged in as any role

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as `SA001` | Successfully logged in |
| 2 | Check localStorage | Token and user data present |
| 3 | Click user profile/logout button | Logout confirmation or immediate logout |
| 4 | Confirm logout | User logged out |
| 5 | Check localStorage | Token and user data removed |
| 6 | Observe redirect | Redirected to login page |
| 7 | Try to navigate to `/super-admin` | Redirected back to login (protected route) |

**Pass Criteria**: User successfully logs out and cannot access protected routes

---

### TC-AUTH-014: Session Persistence
**Priority**: HIGH  
**Preconditions**: User is logged in

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as `SA001` | Successfully logged in |
| 2 | Check localStorage | Token and user stored |
| 3 | Refresh the page (F5) | Page reloads |
| 4 | Observe behavior | User remains logged in |
| 5 | Check current page | Still on Super Admin dashboard |
| 6 | Check sidebar | Super Admin menu still visible |

**Pass Criteria**: User session persists after page refresh

---

### TC-AUTH-015: Token Expiration & Auto-Refresh
**Priority**: HIGH  
**Preconditions**: User is logged in, token is about to expire

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as `SA001` | Successfully logged in |
| 2 | Wait for token to expire OR manually expire token | Token becomes invalid |
| 3 | Make any API request (e.g., fetch students) | Request returns 401 |
| 4 | Observe axios interceptor | Automatically attempts token refresh |
| 5 | Check network | POST to `/api/auth/refresh-token` |
| 6 | Check response | New token received |
| 7 | Check localStorage | Token updated with new value |
| 8 | Observe original request | Retried with new token and succeeds |

**Pass Criteria**: Token automatically refreshes without user intervention

---

### TC-AUTH-016: Network Error Handling
**Priority**: MEDIUM  
**Preconditions**: User is on login page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Stop backend server | Backend not accessible |
| 2 | Enter `SA001` and password | Input accepted |
| 3 | Click "Sign In" | Loading state shows |
| 4 | Wait for timeout | Request fails |
| 5 | Observe UI | Error message: "Network error. Please check your connection." |
| 6 | Check localStorage | No data stored |
| 7 | Restart backend | Backend accessible |
| 8 | Click "Sign In" again | Login succeeds |

**Pass Criteria**: Network errors handled gracefully with user-friendly messages

---

### TC-AUTH-017: Role-Based Route Protection
**Priority**: CRITICAL  
**Preconditions**: User is logged in as Teacher

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as `TC001` | Successfully logged in as Teacher |
| 2 | Manually navigate to `/super-admin` | Access denied |
| 3 | Observe redirect | Redirected to `/teacher` or error page |
| 4 | Try to navigate to `/admin` | Access denied |
| 5 | Try to navigate to `/finance` | Access denied |
| 6 | Navigate to `/teacher/grades` | Access granted (Teacher route) |

**Pass Criteria**: Users cannot access routes outside their role permissions

---

### TC-AUTH-018: Concurrent Login Sessions
**Priority**: LOW  
**Preconditions**: None

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open browser window 1 | Login page displays |
| 2 | Login as `SA001` in window 1 | Successfully logged in |
| 3 | Open browser window 2 (same browser) | Login page displays |
| 4 | Login as `SA001` in window 2 | Successfully logged in |
| 5 | Check both windows | Both sessions active (or second session invalidates first) |
| 6 | Perform action in window 1 | Action succeeds or fails based on backend policy |

**Pass Criteria**: System handles concurrent sessions according to backend policy

---

### TC-AUTH-019: Special Characters in Password
**Priority**: MEDIUM  
**Preconditions**: User account has password with special characters

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter valid Login ID | Input accepted |
| 2 | Enter password with `!@#$%^&*()` | Special characters accepted |
| 3 | Click "Sign In" | Login succeeds |
| 4 | Check API request payload | Password properly encoded |

**Pass Criteria**: Special characters in passwords handled correctly

---

### TC-AUTH-020: Browser Back Button After Logout
**Priority**: MEDIUM  
**Preconditions**: User is logged in

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as `SA001` | Successfully logged in |
| 2 | Navigate to `/super-admin/branches` | Page loads |
| 3 | Logout | Redirected to login page |
| 4 | Click browser back button | Attempt to go back |
| 5 | Observe behavior | Redirected to login (cannot access protected route) |
| 6 | Check localStorage | No token present |

**Pass Criteria**: Cannot access protected routes via back button after logout

---

## 5. Test Execution Checklist

- [ ] All test cases executed
- [ ] All CRITICAL priority tests passed
- [ ] All HIGH priority tests passed
- [ ] Defects logged for failed tests
- [ ] Network tab screenshots captured for API calls
- [ ] Console errors documented
- [ ] Cross-browser testing completed (Chrome, Firefox, Edge)
- [ ] Mobile responsive testing completed

---

## 6. Test Data Cleanup

After testing:
1. Clear browser localStorage
2. Clear browser cookies
3. Close all browser windows
4. Document any test accounts that need password reset

---

## 7. Defect Reporting Template

```
Defect ID: AUTH-BUG-XXX
Test Case: TC-AUTH-XXX
Severity: Critical/High/Medium/Low
Summary: [Brief description]
Steps to Reproduce:
1. [Step 1]
2. [Step 2]
Expected Result: [What should happen]
Actual Result: [What actually happened]
Screenshots: [Attach screenshots]
Console Errors: [Copy console errors]
Network Response: [Copy API response]
```

---

## 8. Success Metrics

- **Pass Rate Target**: 95% (19/20 test cases)
- **Critical Tests**: 100% pass rate required
- **High Priority Tests**: 95% pass rate required
- **Execution Time**: Should complete within 2-3 hours

---

## 9. Notes for Tester

- Test in **incognito/private mode** to avoid cache issues
- Keep DevTools open throughout testing
- Document any unexpected behavior even if test passes
- Test with both keyboard (Tab + Enter) and mouse interactions
- Verify accessibility (screen reader compatibility) if time permits

---

**Status**: ⏳ NOT STARTED  
**Assigned To**: [Your Name]  
**Start Date**: [Date]  
**Completion Date**: [Date]
