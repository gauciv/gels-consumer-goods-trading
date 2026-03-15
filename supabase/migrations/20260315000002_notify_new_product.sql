-- Notify all active collectors when a new product is added

create or replace function public.notify_new_product()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, data)
  select
    p.id,
    'new_product',
    'New product: ' || NEW.name,
    'A new product is now available to order.',
    jsonb_build_object(
      'product_id',   NEW.id,
      'product_name', NEW.name
    )
  from public.profiles p
  where p.role      = 'collector'
    and p.is_active = true;

  return NEW;
end;
$$;

create trigger trg_notify_new_product
  after insert on public.products
  for each row execute function public.notify_new_product();
