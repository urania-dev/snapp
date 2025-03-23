# Database Policies

## Overview

This document introduces the new access control policies for the Snapp database, implemented using the ZenStack plugin for Prisma. These policies regulate API access and enforce fine-grained permissions at the model level to ensure secure data operations.

## Policy Definition Format

Policies are defined using the `@@allow` directive, which specifies the allowed operations and the conditions under which they are permitted.

```prisma
@@allow("operation", condition)
```

- **operation**: Specifies which CRUD operations are allowed (e.g., `create`, `read`, `update`, `delete`, or `all`).
- **condition**: A boolean expression that determines whether access is granted.

## Model-Specific Policies

### User Model

```prisma
@@allow("all", auth().id == this.id)
@@allow("all", auth().role == "admin" || auth().role == "root")
```

- Users can access their own data.
- Administrators (`admin` and `root`) have full access.

### Session Model

```prisma
@@allow("create", true)
@@allow("all", auth().id == user.id)
@@allow("all", auth().role == "admin" || auth().role == "root")
```

- Anyone can create a session.
- Users can access their own sessions.
- Administrators have full access.

### PasswordReset Model

```prisma
@@allow("create,read", true)
@@allow("all", auth().id == userId)
@@allow("all", auth().role == "admin" || auth().role == "root")
```

- Password resets can be created and read by anyone.
- Users can manage their own password resets.
- Administrators have full access.

### Setting Model

```prisma
@@allow("read", userId == null )
@@allow("all", auth().role == "admin" || auth().role == "root" || auth().id == userId)
```

- Public settings (`userId == null`) can be read by anyone.
- Users can manage their own settings.
- Administrators have full access.

### Token Model

```prisma
@@allow("all", auth().id == userId)
@@allow("all", auth().role == "admin" || auth().role == "root")
```

- Users can access their own tokens.
- Administrators have full access.

### Snapp Model

```prisma
@@allow("read", auth() != null || auth() == null && !disabled || group.users?[id == auth().id] && !disabled)
@@allow("all", user.id == auth().id)
@@allow("all", auth().role == "admin" || auth().role == "root")
```

- Public Snapps can be read by anyone unless disabled.
- Group members can access Snapps within their group.
- Users can manage their own Snapps.
- Administrators have full access.

### Usage Model

```prisma
@@allow("all", ownerId == auth().id)
@@allow("all", auth().role == "admin" || auth().role == "root")
```

- Users can access their own usage data.
- Administrators have full access.

### Tag Model

```prisma
@@allow("all", auth() != null)
@@allow("read", true)
@@allow("all", auth().role == "admin" || auth().role == "root")
```

- Tags can be read by anyone.
- Any authenticated user can manage tags.
- Administrators have full access.

### Group Model

```prisma
@@allow("read", users?[id == auth().id])
@@allow("all", auth().role == "admin" || auth().role == "root")
```

- Group members can read group data.
- Administrators have full access.

### VtApiCache Model

```prisma
@@allow("all", auth() != null)
```

- Any authenticated user can access VirusTotal API cache.

### WatchList Model

```prisma
@@allow("read", true)
@@allow("all", auth().role == "admin" || auth().role == "root")
```

- Anyone can read watchlists.
- Administrators have full access.

## API Accessibility

The API, now regulated by these new policies, will ensure secure and structured access to the Snapp database. Authentication and authorization mechanisms will be enforced to align with the defined permissions, allowing for a well-protected system while maintaining usability.

## Conclusion

These policies, powered by ZenStack for Prisma, provide a robust security layer for the Snapp database. By enforcing strict access control while enabling necessary operations, they enhance security and regulatory compliance in managing user data and API interactions.

