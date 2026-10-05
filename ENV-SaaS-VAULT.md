# ==================================================================
#  THE VAULT — environment variables for the SaaS sky.
#  Put these in Vercel → Project → Settings → Environment Variables.
#  Never commit real values. Never use NEXT_PUBLIC_ for any secret.
# ==================================================================

## ---------- already working ----------
# DATABASE_URL            ← set (see the Postgres note below)
# AUTH_SECRET             ← random 64-hex string (openssl rand -hex 32)
# APP_URL                 ← https://www.reflectme.space (used in email links)
# OPENAI_API_KEY          ← existing cloud AI key (or ZAI_API_KEY)
# GOOGLE_CLIENT_ID        ← existing Google OAuth id (rotate before use!)
# GOOGLE_CLIENT_SECRET    ← ROTATED secret — the old one was exposed
# ZAI_API_KEY / ZAI_BASE_URL / ZAI_MODEL (optional overrides)

## ---------- credits / plans (optional) ----------
# CREDITS_ENFORCED=false  ← leave unset/false to keep everything free;
#                           set "true" ONLY after Stripe is configured
# PLAN_PRO_CREDITS=100000
# PLAN_PRO_PLUS_CREDITS=400000
# PLAN_BUSINESS_CREDITS=1500000
# COST_CHAT=5  COST_IMAGE=150  COST_TRANSMISSION=20  … (see src/lib/server/costs.ts)

## ---------- Stripe (billing goes live with these) ----------
# STRIPE_SECRET_KEY=sk_live_…            ← dashboard.stripe.com/apikeys
# STRIPE_WEBHOOK_SECRET=whsec_…          ← dashboard → Webhooks → add endpoint
#                                          https://www.reflectme.space/api/webhooks/stripe
# STRIPE_PRICE_PRO=price_…               ← create the recurring prices first,
# STRIPE_PRICE_PRO_PLUS=price_…             then paste their ids here
# STRIPE_PRICE_BUSINESS=price_…
# STRIPE_PRICE_PACK_10K=price_…          ← one-time prices for credit packs
# STRIPE_PRICE_PACK_50K=price_…
# STRIPE_PRICE_PACK_200K=price_…

## ---------- transactional email (verification & reset letters) ----------
# RESEND_API_KEY=re_…                    ← resend.com → API Keys
# MAIL_FROM="Reflective Me <letters@reflectme.space>"
