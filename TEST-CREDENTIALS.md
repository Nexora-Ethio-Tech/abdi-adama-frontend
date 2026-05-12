# 🔐 Test Credentials

**Last Updated:** 2025-01-XX

> **⚠️ IMPORTANT:** This file contains test credentials for development/testing only. Never commit this file to version control!

---

## 🎯 Super Admin

| Email | Password | Branch | Status | Notes |
|-------|----------|--------|--------|-------|
| `abdiadamaschooloffice@gmail.com` | `SuperAdmin@2026` | All Branches | ✅ Active | Main Super Admin account |

---

## 🏫 School Admins

| Email | Password | Branch | Status | Created Date | Notes |
|-------|----------|--------|--------|--------------|-------|
| `testschooladmin@adama.com` | `Adamaschool#123` | Adama Branch | ✅ Active | 2025-01-XX | Test account - Password changed from temporary |

---

## 👔 Vice Principals

| Email | Password | Branch | Status | Created Date | Notes |
|-------|----------|--------|--------|--------------|-------|
| - | - | - | - | - | No VP created yet |

---

## 🔍 Auditors

| Email | Password | Branch | Status | Created Date | Notes |
|-------|----------|--------|--------|--------------|-------|
| - | - | - | - | - | No Auditor created yet |

---

## 👨🏫 Teachers

| Email | Digital ID | PIN | Branch | Status | Created Date | Notes |
|-------|-----------|-----|--------|--------|--------------|-------|
| `testteacher@adama.com` | - | `7759` | Adama Branch | ⏳ Pending | 2025-01-XX | Awaiting School Admin approval |

---

## 💰 Finance Clerks

| Email | Password | Branch | Status | Created Date | Notes |
|-------|----------|--------|--------|--------------|-------|
| - | - | - | - | - | No Finance Clerks created yet |

---

## 📚 Students

| Email | Password | Branch | Grade | Status | Created Date | Notes |
|-------|----------|--------|-------|--------|--------------|-------|
| - | - | - | - | - | - | No Students created yet |

---

## 👨👩👧 Parents

| Email | Password | Branch | Children | Status | Created Date | Notes |
|-------|----------|--------|----------|--------|--------------|-------|
| - | - | - | - | - | - | No Parents created yet |

---

## 🚗 Drivers

| Email | Password | Branch | Status | Created Date | Notes |
|-------|----------|--------|--------|--------------|-------|
| - | - | - | - | - | No Drivers created yet |

---

## 📖 Librarians

| Email | Password | Branch | Status | Created Date | Notes |
|-------|----------|--------|--------|--------------|-------|
| - | - | - | - | - | No Librarians created yet |

---

## 🏥 Clinic Admins

| Email | Password | Branch | Status | Created Date | Notes |
|-------|----------|--------|--------|--------------|-------|
| - | - | - | - | - | No Clinic Admins created yet |

---

## 📝 Testing Notes

### Phase 1: Authentication ✅
- [x] Super Admin login working
- [x] Token storage verified
- [x] Password change working

### Phase 2: Super Admin
- [x] Dashboard loads
- [x] Branch health matrix (waiting for data)
- [x] User creation working (School Admin created)
- [x] User approval working
- [ ] Academic years
- [ ] Reports

### Phase 3: School Admin
- [x] Dashboard
- [x] Teacher registration (backend has bug with PIN generation)
- [ ] Classes
- [ ] Subjects
- [ ] Students
- [ ] Attendance
- [ ] Courses
- [ ] Schedules

### Phase 4-7: Other Roles
- Not started yet

---

## 🐛 Known Issues

1. Branch health matrix shows loading (no data created yet)
2. Individual branch drill-down shows hardcoded values
3. Backend bug: `generate4DigitPIN` function error when creating teachers

---

## 💡 Quick Login Commands

```bash
# Super Admin
Email: abdiadamaschooloffice@gmail.com
Password: SuperAdmin@2026

# School Admin (Adama)
Email: testschooladmin@adama.com
Password: Adamaschool#123

# Teacher (Adama) - Pending Approval
Email: testteacher@adama.com
PIN: 7759
```

---

**Remember:** Update this file every time you create a new test user! 🎯
