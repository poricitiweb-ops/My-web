# Security Specification for Porichiti (পরিচিতি)

## 1. Data Invariants
- A user document must always have a `userId` that exactly matches the document ID and the authenticated user's UID.
- Public readers can only `get` individual profiles and cannot `list` the entire users collection.
- Only admins (poriciti.web@gmail.com) can `list` users, delete users, or modify `isSuspended` and `isVerified` fields.
- Basic users can only update their own profile fields (name, bio, photoURL, socialLinks, mobileNumber, phoneNumber).
- Payment fields (`paymentStatus`, `senderNumber`, `lastTrxId`, `paymentDate`, `expiryDate`) can only be updated via the subscription "action" which is restricted. (In this app, the user *submits* these fields, so we must be careful).
- Terminal states: Once a user is suspended by an admin, only an admin should be able to unsuspend (though common logic might allow user self-un-suspension if payment is fixed, but here we'll stick to admin control over suspension flag).
- `views` can be incremented by anyone but ONLY incremented by 1.

## 2. The "Dirty Dozen" Payloads

1. **Identity Spoofing**: User A attempts to create a document with `userId: "UserB"`.
2. **Shadow Field Injection**: User attempts to set `isVerified: true` during profile update.
3. **Admin Privilege Escalation**: User attempts to set `isAdmin: true` (though not a field in User entity, check for shadow fields).
4. **Malicious ID Poisoning**: Attempting to create a user with a 2KB string as `userId`.
5. **Orphaned Record**: Creating a user profile without a required field like `name`.
6. **State Shortcut**: User attempts to update `paymentStatus` to 'paid' without providing a `lastTrxId`.
7. **Resource Exhaustion**: Sending a `bio` string of 1MB.
8. **Unauthorized List**: Anonymous user attempts to list all users.
9. **Deletion Theft**: User A attempts to delete User B's profile.
10. **Timestamp Fraud**: User attempts to set `createdAt` to a future date instead of `request.time`.
11. **Bulk Field Modification**: User tries to update `views` and `name` in the same request while also trying to set `isSuspended: false`.
12. **Array Poisoning**: Sending `socialLinks` with 10,000 items.

## 3. Test Runner (Conceptual)
Tests would verify:
- `get` on `/users/uid1` -> ALLOW if existing or being created correctly.
- `list` on `/users` -> DENY unless `auth.token.email == "poriciti.web@gmail.com"`.
- `update` on `/users/uid1` with `{"isVerified": true}` -> DENY if not admin.
- `update` on `/users/uid1` with `{"views": 100}` -> DENY (must be increment by 1).
