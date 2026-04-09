create table if not exists public.telegram_users (
  chat_id text primary key,
  credits integer not null default 0,
  referred_by text null,
  first_run_done boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.telegram_credit_ledger (
  id bigint generated always as identity primary key,
  chat_id text not null references public.telegram_users(chat_id) on delete cascade,
  delta integer not null,
  reason text not null,
  balance_after integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.telegram_payments (
  telegram_payment_charge_id text primary key,
  chat_id text not null references public.telegram_users(chat_id) on delete cascade,
  invoice_payload text not null,
  currency text not null,
  total_amount integer not null,
  credits_added integer not null,
  provider_payment_charge_id text null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.paypal_orders (
  order_id text primary key,
  chat_id text not null references public.telegram_users(chat_id) on delete cascade,
  package_key text null,
  credits_added integer not null,
  capture_id text null,
  user_email text null,
  currency text null,
  total integer null,
  status text null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.tg_register_user(
  p_chat_id text,
  p_initial_credits integer default 50,
  p_referred_by text default null,
  p_reason text default 'signup_bonus',
  p_metadata jsonb default '{}'::jsonb
)
returns public.telegram_users
language plpgsql
as $$
declare
  v_user public.telegram_users;
  v_inserted boolean := false;
begin
  insert into public.telegram_users (
    chat_id,
    credits,
    referred_by,
    first_run_done,
    created_at,
    updated_at
  )
  values (
    p_chat_id,
    greatest(coalesce(p_initial_credits, 0), 0),
    nullif(p_referred_by, ''),
    false,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (chat_id) do nothing;

  v_inserted := found;

  select *
    into v_user
    from public.telegram_users
   where chat_id = p_chat_id;

  if v_inserted and coalesce(p_initial_credits, 0) <> 0 then
    insert into public.telegram_credit_ledger (
      chat_id,
      delta,
      reason,
      balance_after,
      metadata
    )
    values (
      p_chat_id,
      greatest(coalesce(p_initial_credits, 0), 0),
      coalesce(nullif(p_reason, ''), 'signup_bonus'),
      v_user.credits,
      coalesce(p_metadata, '{}'::jsonb)
    );
  end if;

  return v_user;
end;
$$;

create or replace function public.tg_add_credits(
  p_chat_id text,
  p_amount integer,
  p_reason text default 'credit_add',
  p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
as $$
declare
  v_balance integer;
begin
  insert into public.telegram_users (
    chat_id,
    credits,
    first_run_done,
    created_at,
    updated_at
  )
  values (
    p_chat_id,
    greatest(coalesce(p_amount, 0), 0),
    false,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (chat_id) do update
    set credits = greatest(public.telegram_users.credits + coalesce(p_amount, 0), 0),
        updated_at = timezone('utc', now())
  returning credits into v_balance;

  insert into public.telegram_credit_ledger (
    chat_id,
    delta,
    reason,
    balance_after,
    metadata
  )
  values (
    p_chat_id,
    coalesce(p_amount, 0),
    coalesce(nullif(p_reason, ''), 'credit_add'),
    coalesce(v_balance, 0),
    coalesce(p_metadata, '{}'::jsonb)
  );

  return coalesce(v_balance, 0);
end;
$$;

create or replace function public.tg_deduct_credits(
  p_chat_id text,
  p_amount integer,
  p_reason text default 'credit_deduct',
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_balance integer;
begin
  update public.telegram_users
     set credits = credits - p_amount,
         updated_at = timezone('utc', now())
   where chat_id = p_chat_id
     and credits >= p_amount
  returning credits into v_balance;

  if found then
    insert into public.telegram_credit_ledger (
      chat_id,
      delta,
      reason,
      balance_after,
      metadata
    )
    values (
      p_chat_id,
      -p_amount,
      coalesce(nullif(p_reason, ''), 'credit_deduct'),
      v_balance,
      coalesce(p_metadata, '{}'::jsonb)
    );
    return jsonb_build_object('success', true, 'balance', v_balance);
  end if;

  select credits
    into v_balance
    from public.telegram_users
   where chat_id = p_chat_id;

  if v_balance is null then
    return jsonb_build_object('success', false, 'balance', 0);
  end if;

  return jsonb_build_object('success', false, 'balance', v_balance);
end;
$$;

create or replace function public.tg_begin_first_run(
  p_chat_id text
)
returns jsonb
language plpgsql
as $$
declare
  v_referrer text;
begin
  update public.telegram_users
     set first_run_done = true,
         updated_at = timezone('utc', now())
   where chat_id = p_chat_id
     and first_run_done = false
  returning referred_by into v_referrer;

  if found then
    return jsonb_build_object('first_run', true, 'referrer_id', v_referrer);
  end if;

  select referred_by
    into v_referrer
    from public.telegram_users
   where chat_id = p_chat_id;

  return jsonb_build_object('first_run', false, 'referrer_id', v_referrer);
end;
$$;

create or replace function public.tg_record_payment(
  p_chat_id text,
  p_telegram_payment_charge_id text,
  p_invoice_payload text,
  p_currency text,
  p_total_amount integer,
  p_credits_added integer,
  p_provider_payment_charge_id text default null,
  p_raw jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_balance integer;
begin
  insert into public.telegram_users (
    chat_id,
    credits,
    first_run_done,
    created_at,
    updated_at
  )
  values (
    p_chat_id,
    0,
    false,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (chat_id) do nothing;

  insert into public.telegram_payments (
    telegram_payment_charge_id,
    chat_id,
    invoice_payload,
    currency,
    total_amount,
    credits_added,
    provider_payment_charge_id,
    raw
  )
  values (
    p_telegram_payment_charge_id,
    p_chat_id,
    p_invoice_payload,
    p_currency,
    p_total_amount,
    p_credits_added,
    p_provider_payment_charge_id,
    coalesce(p_raw, '{}'::jsonb)
  )
  on conflict (telegram_payment_charge_id) do nothing;

  if found then
    update public.telegram_users
       set credits = credits + p_credits_added,
           updated_at = timezone('utc', now())
     where chat_id = p_chat_id
    returning credits into v_balance;

    insert into public.telegram_credit_ledger (
      chat_id,
      delta,
      reason,
      balance_after,
      metadata
    )
    values (
      p_chat_id,
      p_credits_added,
      'payment',
      v_balance,
      jsonb_build_object(
        'telegram_payment_charge_id', p_telegram_payment_charge_id,
        'currency', p_currency,
        'total_amount', p_total_amount
      )
    );

    return jsonb_build_object('applied', true, 'balance', v_balance);
  end if;

  select credits
    into v_balance
    from public.telegram_users
   where chat_id = p_chat_id;

  return jsonb_build_object('applied', false, 'balance', coalesce(v_balance, 0));
end;
$$;

create or replace function public.tg_record_paypal_order(
  p_order_id text,
  p_chat_id text,
  p_package_key text default null,
  p_credits_added integer default 0,
  p_capture_id text default null,
  p_user_email text default null,
  p_currency text default null,
  p_total integer default null,
  p_status text default null,
  p_raw jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_balance integer;
begin
  insert into public.telegram_users (
    chat_id,
    credits,
    first_run_done,
    created_at,
    updated_at
  )
  values (
    p_chat_id,
    0,
    false,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (chat_id) do nothing;

  insert into public.paypal_orders (
    order_id,
    chat_id,
    package_key,
    credits_added,
    capture_id,
    user_email,
    currency,
    total,
    status,
    raw
  )
  values (
    p_order_id,
    p_chat_id,
    nullif(p_package_key, ''),
    greatest(coalesce(p_credits_added, 0), 0),
    nullif(p_capture_id, ''),
    nullif(p_user_email, ''),
    nullif(p_currency, ''),
    p_total,
    nullif(p_status, ''),
    coalesce(p_raw, '{}'::jsonb)
  )
  on conflict (order_id) do nothing;

  if found then
    update public.telegram_users
       set credits = credits + greatest(coalesce(p_credits_added, 0), 0),
           updated_at = timezone('utc', now())
     where chat_id = p_chat_id
    returning credits into v_balance;

    insert into public.telegram_credit_ledger (
      chat_id,
      delta,
      reason,
      balance_after,
      metadata
    )
    values (
      p_chat_id,
      greatest(coalesce(p_credits_added, 0), 0),
      'paypal_payment',
      v_balance,
      jsonb_build_object(
        'order_id', p_order_id,
        'package_key', p_package_key,
        'capture_id', p_capture_id,
        'currency', p_currency,
        'total', p_total
      )
    );

    return jsonb_build_object('applied', true, 'balance', v_balance);
  end if;

  select credits
    into v_balance
    from public.telegram_users
   where chat_id = p_chat_id;

  return jsonb_build_object('applied', false, 'balance', coalesce(v_balance, 0));
end;
$$;
