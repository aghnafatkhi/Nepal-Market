-- Restrict two trigger functions installed by the original setup.
-- The triggers continue to run; clients do not need RPC access to these functions.
alter function public.handle_new_user() set search_path = '';
alter function public.handle_updated_at() set search_path = '';
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_updated_at() from public, anon, authenticated;
