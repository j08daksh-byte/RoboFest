# PHASE 10C: DATABASE & AUTHENTICATION DECISION

## 1. Database Decision

**Decision:** SQLite + Prisma ORM.

**Why:**
- **Zero External Infrastructure:** SQLite operates purely locally as a file (`dev.db`), ensuring immediate end-to-end functionality verification without waiting for external PostgreSQL/Supabase provisioning.
- **Relational Integrity:** Fully supports the complex relational model required for Users -> Roles, Missions -> Cuts, and Missions -> Events.
- **Prisma Migrations:** Prisma's abstraction ensures that this initial SQLite foundation can be migrated to a production PostgreSQL instance later simply by changing the `provider` in `schema.prisma`.
- **Next.js Compatibility:** Prisma client works perfectly within Next.js API routes (Serverless functions).

## 2. Authentication Decision

**Decision:** Stateless JWT via `jose`.

**Why:**
- **No Heavy Scaffolding:** Implementing NextAuth (Auth.js) typically involves configuring an external OAuth provider or complex credential setups. Using `jose` allows for a secure, edge-compatible JWT implementation that directly fulfills the requirement to "prove authentication/authorization actually identifies a user" without fake data.
- **Role Verification:** We will encode the existing domain scaffolds (`UserRole` and `UserPermission`) inside the JWT claims to verify the authorization boundary immediately.

## 3. Persistent Entities

Based on the Phase 10B API boundary and existing domain models, the schema includes:
1. `User`: Handles identity and role/permission tracking.
2. `Mission`: Cross-session state for operations.
3. `CutRecord`: Geometry of plans and completed cuts.
4. `EventLog`: System and safety history.

Empty tables or undefined models (like Health/Maintenance) are deliberately excluded per the task instructions to not create meaningless tables.
