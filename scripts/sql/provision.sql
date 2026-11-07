\set ON_ERROR_STOP on
\getenv app_role DB_USER
\getenv app_password DB_PASSWORD
\getenv test_role TEST_DB_USER
\getenv test_password TEST_DB_PASSWORD
\getenv development_database DB_NAME
\getenv test_database TEST_DB_NAME
\getenv admin_role POSTGRES_USER

SELECT (
  :'app_role' ~ '^[A-Za-z_][A-Za-z0-9_]{0,62}$'
  AND :'test_role' ~ '^[A-Za-z_][A-Za-z0-9_]{0,62}$'
  AND :'development_database' ~ '^[A-Za-z_][A-Za-z0-9_]{0,62}$'
  AND :'test_database' ~ '^[A-Za-z_][A-Za-z0-9_]{0,62}$'
  AND :'app_role' <> :'test_role'
  AND :'app_role' <> :'admin_role'
  AND :'test_role' <> :'admin_role'
  AND :'app_role' <> session_user
  AND :'test_role' <> session_user
  AND :'app_password' <> ''
  AND :'test_password' <> ''
  AND :'development_database' <> :'test_database'
  AND :'development_database' NOT IN ('postgres', 'template0', 'template1')
  AND :'test_database' NOT IN ('postgres', 'template0', 'template1')
) AS identifiers_are_valid \gset

\if :identifiers_are_valid
\else
\echo "Refusing invalid database provisioning identifiers."
\quit 2
\endif

SELECT EXISTS (
  SELECT 1
  FROM pg_roles
  WHERE rolname = session_user
    AND rolsuper
) AS has_admin_privileges \gset

\if :has_admin_privileges
\else
\echo "The connected PostgreSQL role must be a superuser to provision these resources safely."
\quit 2
\endif

SELECT (
  NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_role')
  OR EXISTS (
    SELECT 1
    FROM pg_roles AS role
    WHERE role.rolname = :'app_role'
      AND NOT role.rolsuper
      AND NOT role.rolcreatedb
      AND NOT role.rolcreaterole
      AND NOT role.rolreplication
      AND NOT role.rolbypassrls
      AND NOT EXISTS (
        SELECT 1 FROM pg_auth_members AS membership
        WHERE membership.member = role.oid
      )
  )
) AS app_role_is_safe \gset

SELECT (
  NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'test_role')
  OR EXISTS (
    SELECT 1
    FROM pg_roles AS role
    WHERE role.rolname = :'test_role'
      AND NOT role.rolsuper
      AND NOT role.rolcreatedb
      AND NOT role.rolcreaterole
      AND NOT role.rolreplication
      AND NOT role.rolbypassrls
      AND NOT EXISTS (
        SELECT 1 FROM pg_auth_members AS membership
        WHERE membership.member = role.oid
      )
  )
) AS test_role_is_safe \gset

\if :app_role_is_safe
\else
\echo "Refusing to alter an existing development role with elevated privileges or memberships."
\quit 2
\endif

\if :test_role_is_safe
\else
\echo "Refusing to alter an existing test role with elevated privileges or memberships."
\quit 2
\endif

SELECT (
  NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'development_database')
  OR EXISTS (
    SELECT 1
    FROM pg_database AS database
    JOIN pg_roles AS role ON role.oid = database.datdba
    WHERE database.datname = :'development_database'
      AND role.rolname = :'app_role'
  )
) AS development_owner_is_safe \gset

SELECT (
  NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'test_database')
  OR EXISTS (
    SELECT 1
    FROM pg_database AS database
    JOIN pg_roles AS role ON role.oid = database.datdba
    WHERE database.datname = :'test_database'
      AND role.rolname = :'test_role'
  )
) AS test_owner_is_safe \gset

\if :development_owner_is_safe
\else
\echo "Development database exists but is not owned by DB_USER; no changes were made."
\quit 2
\endif

\if :test_owner_is_safe
\else
\echo "Test database exists but is not owned by TEST_DB_USER; no changes were made."
\quit 2
\endif

SELECT format(
  'CREATE ROLE %I WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L',
  :'app_role',
  :'app_password'
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_role')
\gexec

SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'app_role', :'app_password')
\gexec

SELECT format(
  'CREATE ROLE %I WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L',
  :'test_role',
  :'test_password'
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'test_role')
\gexec

SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'test_role', :'test_password')
\gexec

SELECT format('CREATE DATABASE %I OWNER %I ENCODING %L', :'development_database', :'app_role', 'UTF8')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'development_database')
\gexec

SELECT format('CREATE DATABASE %I OWNER %I ENCODING %L', :'test_database', :'test_role', 'UTF8')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'test_database')
\gexec

SELECT EXISTS (
  SELECT 1
  FROM pg_database AS database
  JOIN pg_roles AS role ON role.oid = database.datdba
  WHERE database.datname = :'development_database'
    AND role.rolname = :'app_role'
) AS development_owner_is_valid \gset

SELECT EXISTS (
  SELECT 1
  FROM pg_database AS database
  JOIN pg_roles AS role ON role.oid = database.datdba
  WHERE database.datname = :'test_database'
    AND role.rolname = :'test_role'
) AS test_owner_is_valid \gset

\if :development_owner_is_valid
\else
\echo "Development database exists but is not owned by DB_USER; no ownership was changed."
\quit 2
\endif

\if :test_owner_is_valid
\else
\echo "Test database exists but is not owned by TEST_DB_USER; no ownership was changed."
\quit 2
\endif
