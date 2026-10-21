# Changelog

All notable changes to Khursh app are listed here, newest first.

Versions follow MAJOR.MINOR.PATCH:
- **PATCH** (1.0.1) — bug fixes only
- **MINOR** (1.1.0) — new features, nothing breaks
- **MAJOR** (2.0.0) — big changes that break how things worked before

## [Unreleased]

## [1.0.0] — 2026-10-21

First tagged release of the HOA platform: resident app, admin app and backend.

### Added
- Per-HOA feature switches for platform admins
- Group chat shortcut in the top bar
- Photo uploads on feedback (up to 3, via Cloudinary)
- Admin dashboard with KPIs, trends, collection chart and recent activity
- End-to-end backend tests

### Changed
- Resident app redesign: new theme and shell; Home, Payments, Gate & vehicles, Feedback, Notifications, Profile, Calendar, Chat, Contact & Rules and Login pages
- Admin app redesign: new shell and login; Payments, Users, Vehicles, Feedback, Calendar, Contact & Rules, Notifications, Chat and Profile pages
- Platform Organizations page: searchable HOA list, create form in a dialog
- `/electricity` now redirects to Payments

### Fixed
- Password reset now accepts the 6-digit code
- White logo shows in the top bar in dark mode
- Admin dialogs no longer steal focus on every re-render

### Removed
- Unused ElectricityBill page
- GSAP animation library
