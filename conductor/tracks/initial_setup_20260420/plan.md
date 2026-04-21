# Track Plan - JLC Client Portal Standalone Migration

## Phase 1: New Project Infrastructure
- [x] Task: Create new Firebase Project `jlc-client-portal` (Manual Action Required) [verified]
- [x] Task: Register Web App in new project and gather new configuration keys [verified]
- [x] Task: Update `.firebaserc` and `.env.local` with new project credentials [pending in new repo]

## Phase 2: Repository Extraction
- [x] Task: Create new directory `/home/jwlehane/projects/jlc-client-portal` [verified]
- [x] Task: Copy files from `timely-signs/client-portal/` to the new directory (excluding `node_modules`, `.git`, etc.) [verified]
- [x] Task: Initialize new Git repository in the new directory [verified]

## Phase 3: Final Configuration & Deployment
- [x] Task: Run `npm install` in the new repo to verify dependencies [verified]
- [x] Task: Verify Firebase Emulators work with new Project ID [verified]
- [x] Task: Deploy to new Firebase project (`jlc-client-portal.web.app`) [verified]
- [x] Task: Conductor - User Manual Verification 'Phase 3: Final Configuration & Deployment' [verified]

## Phase 4: Cleanup
- [ ] Task: Delete `client-portal/` directory from `timely-signs` repository
- [ ] Task: Update Timely Signs documentation to point to the new standalone portal repo
