-- ============================================================
-- Notifications table + triggers
-- Covers: order status changes, low stock, out of stock,
--         price changes
-- ============================================================

-- 1. Table
create table if not exists public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  type       text        not null,   -- 'order_status_changed' | 'low_stock' | 'out_of_stock' | 'price_changed'
  title      text        not null,
  body       text        not null,
  data       jsonb       not null default '{}',
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user
  on public.notifications(user_id, created_at desc);

-- 2. RLS
alter table public.notifications enable row level security;

create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can mark own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

-- ============================================================
-- 3. Trigger: order status changes → notify collector
-- ============================================================
create or replace function public.notify_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_body  text;
begin
  if OLD.status is distinct from NEW.status then
    v_title := 'Order ' || NEW.order_number;
    v_body := case NEW.status
      when 'confirmed'  then 'Your order has been confirmed by the admin.'
      when 'processing' then 'Your order is now being processed.'
      when 'completed'  then 'Your order has been completed successfully.'
      when 'cancelled'  then 'Your order has been cancelled.'
      else 'Your order status changed to ' || NEW.status || '.'
    end;

    insert into public.notifications (user_id, type, title, body, data)
    values (
      NEW.collector_id,
      'order_status_changed',
      v_title,
      v_body,
      jsonb_build_object(
        'order_id',     NEW.id,
        'order_number', NEW.order_number,
        'status',       NEW.status,
        'store_id',     NEW.store_id
      )
    );
  end if;
  return NEW;
end;
$$;

create trigger trg_notify_order_status
  after update on public.orders
  for each row execute function public.notify_order_status_change();

-- ============================================================
-- 4. Trigger: product stock/price changes → notify all active collectors
-- ============================================================
create or replace function public.notify_product_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type  text;
  v_title text;
  v_body  text;
begin
  -- Out of stock (stock hits 0)
  if NEW.stock_quantity = 0 and OLD.stock_quantity > 0 then
    v_type  := 'out_of_stock';
    v_title := NEW.name || ' is out of stock';
    v_body  := 'Stock has reached 0 and can no longer be ordered.';

  -- Low stock transition (drops into ≤10 zone)
  elsif NEW.stock_quantity <= 10
    and OLD.stock_quantity > 10
    and NEW.stock_quantity > 0 then
    v_type  := 'low_stock';
    v_title := NEW.name || ' is running low';
    v_body  := 'Only ' || NEW.stock_quantity || ' unit(s) remaining.';

  -- Price change
  elsif NEW.price is distinct from OLD.price then
    v_type  := 'price_changed';
    v_title := NEW.name || ' — price updated';
    v_body  := 'Price changed from ₱' || OLD.price || ' to ₱' || NEW.price || '.';

  else
    return NEW;
  end if;

  insert into public.notifications (user_id, type, title, body, data)
  select
    p.id,
    v_type,
    v_title,
    v_body,
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

create trigger trg_notify_product_change
  after update on public.products
  for each row execute function public.notify_product_change();
