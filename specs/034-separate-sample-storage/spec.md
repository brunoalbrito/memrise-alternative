# Feature Specification: Separate Real and Sample Storage

**Feature Branch**: `feat/separate-sample-storage`

**Created**: 2026-10-18

**Status**: Draft

**Input**: The app has two ways to store courses: the installed app keeps the learner's real library; the sample course lives in its own development folder. The installed app must never see the sample data.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real data stays real (Priority: P1)

**Acceptance Scenarios**:

1. **Given** the installed app, **Then** its library is in the `MemBetter` folder and it ignores any sample file or data-folder setting.
2. **Given** the development app, **Then** its library is in `MemBetter-dev`, never in `MemBetter`.
3. **Given** a development window, **Then** its title says "MemBetter (sample data)".

### User Story 2 - One command for sample data (Priority: P1)

1. **Given** `pnpm dev:samples`, **Then** the development app starts and the sample course is loaded into `MemBetter-dev` when that library has no courses.
2. **Given** a sample library that already has courses (or had courses removed), **Then** the sample file is not loaded again.
3. **Given** `pnpm dev:reset`, **Then** only `MemBetter-dev` is emptied.

## Requirements

- **FR-001**: The choice of folder is made once at start, by a small tested function of: installed or not, command line, environment.
- **FR-002**: Tests can move the app-data folder with `MEMBETTER_APP_DATA`; the installed app ignores it.

## Success Criteria

- **SC-001**: An end-to-end test shows the sample course in `MemBetter-dev` and no `MemBetter` folder created.

## Assumptions

- Out of scope: a switch inside the installed app, syncing between the two.
