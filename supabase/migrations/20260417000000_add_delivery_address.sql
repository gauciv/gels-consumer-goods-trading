-- Add delivery_address column to orders table
-- This allows custom delivery addresses that override the store's default address

alter table public.orders
add column delivery_address text;

comment on column public.orders.delivery_address is 'Custom delivery address for this order, overrides store address if set';
