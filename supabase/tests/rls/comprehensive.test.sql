BEGIN;
SELECT plan(6);

-- Test tracked_emails
SELECT results_eq(
    'SELECT count(*)::int FROM tracked_emails',
    ARRAY[0],
    'Anonymous should see 0 emails'
);

-- Test fraud_alerts
SELECT results_eq(
    'SELECT count(*)::int FROM fraud_alerts',
    ARRAY[0],
    'Anonymous should see 0 fraud alerts'
);

-- Test security_events
SELECT results_eq(
    'SELECT count(*)::int FROM security_events',
    ARRAY[0],
    'Anonymous should see 0 security events'
);

-- Test user_roles
SELECT results_eq(
    'SELECT count(*)::int FROM user_roles',
    ARRAY[0],
    'Anonymous should see 0 roles'
);

SELECT * FROM finish();
ROLLBACK;
