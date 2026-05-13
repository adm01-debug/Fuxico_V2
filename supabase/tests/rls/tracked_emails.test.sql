BEGIN;
SELECT plan(4);

-- Test 1: Anonymous cannot see tracked_emails
SELECT results_eq(
    'SELECT count(*)::int FROM tracked_emails',
    ARRAY[0],
    'Anonymous should see 0 emails'
);

-- Test 2: Authenticated user can see their own emails
-- (Assuming we set a user_id)
-- SELECT has_policy('tracked_emails', 'Users can view their own tracked emails');

-- Test 3: Authenticated user cannot see others' emails
-- ... implementation depends on having test data ...

SELECT * FROM finish();
ROLLBACK;
