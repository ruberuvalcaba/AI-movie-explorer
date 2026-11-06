begin;

-- Only the trigger may invoke this privileged function. Never trust metadata for
-- identity/ownership. Normalize optional display metadata instead of failing signup.
create function private.create_signup_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    case when jsonb_typeof(new.raw_user_meta_data -> 'display_name') = 'string'
      then left(btrim(new.raw_user_meta_data ->> 'display_name'), 100)
      else ''
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.create_signup_profile() from public, anon, authenticated;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function private.create_signup_profile();

-- Users registered before this migration must receive profiles too.
insert into public.profiles (id, display_name)
select id,
  case when jsonb_typeof(raw_user_meta_data -> 'display_name') = 'string'
    then left(btrim(raw_user_meta_data ->> 'display_name'), 100)
    else ''
  end
from auth.users
on conflict (id) do nothing;

commit;
