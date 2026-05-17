with admin_user as (
    insert into app_users (role, full_name, email, password_hash, created_at, updated_at)
    values ('ADMIN', 'admin', 'admin', '$2a$10$2mMdNjaM6Gzr33UGKrc38eFx6jiFfwzKlSNrnuCFE52FCsFyGTL3m', now(), now())
    on conflict (email) do update
        set role = excluded.role,
            full_name = excluded.full_name,
            password_hash = excluded.password_hash,
            updated_at = now()
    returning id
)
insert into admins (user_id)
select id
from admin_user
on conflict (user_id) do nothing;
