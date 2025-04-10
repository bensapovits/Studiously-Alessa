# Bug Report: Contact Stage Limitation

## Summary
Users are unable to add more than 3 contacts to a single contact stage, despite there being no intended database or code-level limitation.

## Environment
- Application Version: 1.0
- Browser: All browsers affected
- Database: Supabase PostgreSQL
- Relevant Tables: `contacts`

## Steps to Reproduce
1. Navigate to `/stages` in the application
2. Select any contact stage (e.g., "New", "Contacted", "Meeting Booked")
3. Add contacts to the stage until it contains 3 contacts
4. Attempt to add a fourth contact to the same stage by:
   - Dragging a contact from another stage
   - Creating a new contact and assigning it to the stage
   - Updating an existing contact's stage

## Current Behavior
- The system prevents adding more than 3 contacts to any single stage
- No error message is displayed
- The UI silently fails to update when attempting to add more contacts
- Affects all contact stages defined in the schema:
  ```sql
  CHECK (stage IN (
    'New',
    'Contacted', 
    'Meeting Booked',
    'Call Completed',
    'Follow Up',
    'Weekly',
    'Biweekly',
    'Monthly',
    'Quarterly',
    'Semiannual',
    'Annual'
  ))
  ```

## Expected Behavior
- Users should be able to add unlimited contacts to any stage
- The database schema shows no row limit constraints
- The application code has no artificial limitations implemented

## Technical Analysis
### Database Schema
```sql
-- From contacts table definition
ALTER TABLE contacts
  ADD CONSTRAINT contacts_stage_check 
  CHECK (stage IN (
    'New',
    'Contacted', 
    'Meeting Booked',
    'Call Completed',
    'Follow Up',
    'Weekly',
    'Biweekly',
    'Monthly',
    'Quarterly',
    'Semiannual',
    'Annual'
  ));
```

### Affected Components
1. Frontend:
   - `src/pages/Stages.tsx`: Contact stage management
   - `src/lib/contacts.ts`: Contact data operations

2. Backend:
   - Supabase RLS policies on contacts table
   - Stage constraint definitions

## Impact
- **Severity**: High
- **Scope**: All users attempting to manage more than 3 contacts per stage
- **Business Impact**: Severely limits contact management capabilities
- **User Experience**: Creates confusion and workflow bottlenecks

## Possible Causes
1. Frontend rendering limitation in the stage columns
2. Unintended row limit in RLS policies
3. Race condition in contact stage updates
4. Client-side state management issue in React components

## Suggested Investigation
1. Review React state management in Stages component
2. Analyze network requests during stage updates
3. Verify Supabase RLS policies for unintended limitations
4. Check for any client-side filtering or pagination issues
5. Monitor database query performance with larger contact sets

## Additional Notes
- Issue persists after page refresh
- No related errors in browser console
- Database queries show successful execution
- RLS policies show correct permissions

## Related Files
- `src/pages/Stages.tsx`
- `src/lib/contacts.ts`
- `supabase/migrations/*_contacts.sql`

## Attachments
- Screenshots to be added
- Network request logs to be added
- Database query logs to be added

## Reporter
[Your Name]
Date: [Current Date]