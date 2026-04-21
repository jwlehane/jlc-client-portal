# Track Specification - JLC Client Portal Standalone Migration

## Overview
Migrate the `client-portal` from a sub-directory in the Timely Signs repository to a standalone repository. This includes rebranding for Johnny LeHane Consulting (JLC) and transitioning to a new Firebase project ID.

## Core Requirements
- **Standalone Repository:** Extract `client-portal/` files to a new repository structure.
- **Project Renaming:** Update all configuration to point to the new Firebase project ID: `jlc-client-portal`.
- **Infrastructure:** Set up Firebase Hosting, Firestore, and Auth on the new project.
- **Clean Start:** Initialize a fresh Git repository without history from the original project.

## Success Criteria
- [ ] New repository `jlc-client-portal` exists and contains all application code.
- [ ] Application is deployed to `jlc-client-portal.web.app`.
- [ ] Admin and Client views are functional on the new infrastructure.
- [ ] Original `client-portal/` directory can be removed from the Timely Signs repo.
