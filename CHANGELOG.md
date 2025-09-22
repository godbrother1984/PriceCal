# Changelog

All notable changes to the PriceCal project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [3.10] - 2025-09-22

### Fixed
- **Critical**: Fixed "Failed to create the price request" error caused by Foreign Key constraints
- **Database**: Made `customerId`, `productId`, and `createdBy` columns nullable in PriceRequest entity
- **Service**: Enhanced DataService to properly handle null foreign keys
- **Package**: Resolved Git merge conflicts in server/package.json

### Changed
- **Architecture**: Completely eliminated all mock data and hardcoded values
- **Database**: Full migration to SQLite database with TypeORM entities
- **Authentication**: Replaced hardcoded admin/admin with JWT + bcrypt authentication
- **API**: Updated all endpoints from `/mock-data` to `/api/data`
- **Frontend**: Updated all API calls to use new database-backed endpoints

### Added
- **Database Entities**:
  - User (UUID primary key, bcrypt passwords)
  - Customer, Product, RawMaterial
  - PriceRequest (with nullable foreign keys)
  - CustomerGroup, SystemConfig
- **Authentication**: Real JWT token generation and verification
- **Data Seeding**: Automatic database seeding with master data
- **User Repository**: Added User repository injection to DataService

### Technical Details
- **Files Modified**:
  - `src/entities/price-request.entity.ts` (lines 17, 24, 32)
  - `src/data/data.service.ts` (lines 60-114)
  - `server/package.json` (dependencies consolidation)
- **Database**: SQLite for development, PostgreSQL for production
- **ORM**: TypeORM with proper entity relationships
- **Security**: bcrypt password hashing, JWT tokens

## [3.9] - Previous Release
- Initial project setup
- Basic frontend and backend structure

## [3.8] - Previous Release
- Setup wizard implementation
- Basic mock data system

---

**Legend:**
- 🔧 **Fixed**: Bug fixes
- 🔄 **Changed**: Changes in existing functionality
- ✨ **Added**: New features
- 🗑️ **Removed**: Removed features
- ⚠️ **Deprecated**: Soon-to-be removed features
- 🔒 **Security**: Security-related changes