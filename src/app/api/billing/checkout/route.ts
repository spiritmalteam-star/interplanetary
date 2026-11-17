import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailGateRequired, getSessionUser } from "@/lib/server/access";
import {
  ensureStripeCustomer,
  getStripe,
  stripeConfigured,
} from "@/lib/server/billing";
import { CREDIT_PACKS, PLANS } from "@/lib/server/plans";
import {
  WALLET_PACKS,
  WALLET_PLANS,
  WALLET_TOPUP,
  ensureWallet,
  grantWalletCredits,
  packById,
  type PlanTier,
} from "@/lib/server/wallet";
import { ensureVisitorProvisions } from "@/lib/server/workspace";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import {
  allocationFor,
  getComplimentaryConfig,
  packageMayBeFree,
} from "@/lib/server/features";

/* ------------------------------------------------------------------ */
/*  POST /api/billing/checkout — a Stripe Checkout session.            */
/*                                                                     */
/*  Body: { plan: "SEEKER" | "OBSERVATORY_PRO" }   — the wallet passes  */
/*     or { plan: "PRO" | "PRO_PLUS" | "BUSINESS" } — the legacy passes */
/*     or { pack: "topup" }                         — the pouch of light*/
/*     or { pack: "pack_10k" | "pack_50k" | "pack_200k" }               */
/*                                                                     */
/*  Honest gates:                                                      */
/*   - no STRIPE_SECRET_KEY        → 503, nothing pretended            */
/*   - the answer is a URL, never a promise of payment — Stripe's    */
/*     signed webhook is the only thing that fills a wallet.           */
/* ------------------------------------------------------------------ */

/** The wallet's own Stripe customer — created once, kept forever. */
async function walletCustomerId(
  userId: string,
  email: string,
  name: string | null
): Promise<string | null> {
  const existing = await db.userWallet.findUnique({ where: { userId } });
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: { userId },
  });
  await db.userWallet.update({
    where: { userId },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

export async function POST(req: NextRequest) {
  try {
    const gate = rateLimit(`checkout:${requestIp(req)}`, GATES.password);
    if (!gate.ok) {
      return NextResponse.json({ error: "One moment — the doors rest a little." }, { status: 429 });
    }

    const user = await getSessionUser(req);
    if (!user || user.email.startsWith("anon:")) {
      return NextResponse.json(
        { error: "Sign in first — a passage is needed before coins change hands." },
        { status: 401 }
      );
    }
    /* THE VERIFICATION GATE — coins change hands only through a passage
       that has proven its mailbox (a direct API call cannot walk around
       it — the gate lives ahead of any Stripe session). The complimentary
       door keeps the same law: a confirmed passage, free or paid. */
    if (emailGateRequired(user)) {
      return NextResponse.json(
        {
          error: "Confirm your email first — the letter's key opens the purse's doors.",
          code: "email_unverified",
        },
        { status: 403, headers: { "cache-control": "private, no-store" } }
      );
    }

    const body = await req.json().catch(() => null);
    const planId = typeof body?.plan === "string" ? body.plan.toUpperCase() : null;
    const packId = typeof body?.pack === "string" ? body.pack : null;
    const wantsFree = body?.free === true;

    /* the paid door needs Stripe's key; the complimentary door does not
       — the free branch below reads the body first, so it can open even
       while the coin keeper still rests */
    if (!wantsFree && !stripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Billing rests — STRIPE_SECRET_KEY is not yet placed in the environment vault. Add it (and the STRIPE_PRICE_* ids) on Vercel, then this door opens.",
          code: "stripe_not_configured",
        },
        { status: 503 }
      );
    }

    /* ---------------- THE COMPLIMENTARY DOOR (the owner's own mode) ---
       The same packages, the same credit allocations, the same
       entitlements — laid in through a COMPLIMENTARY transaction
       instead of a bank one. NEVER recorded as paid:
         Payment.type      = "complimentary"
         Payment.status    = "NOT_REQUIRED"
         Payment.amount    = 0 (the original value kept in description)
         Ledger.metadata   = { complimentary: true, reason:
                              "DEVELOPMENT_ACCESS", originalValueCents }
       Every number comes from the SERVER-SIDE definitions (the
       wallet's own plan constants); nothing from the request but the
       package's name. The grant is idempotent (one activation per
       package per user per day, by referenceId) and atomic (the
       ledger's own transaction). */
    if (wantsFree) {
      const config = await getComplimentaryConfig();
      if (!config.complimentaryCheckout && !config.openAccessMode) {
        return NextResponse.json(
          {
            error:
              "The complimentary door rests closed. The owner's own switch (COMPLIMENTARY_CHECKOUT) opens it.",
            code: "complimentary_disabled",
          },
          { status: 403 }
        );
      }

      /* which package? — the same names the paid door knows */
      const isWalletPlan = planId === "SEEKER" || planId === "OBSERVATORY_PRO";
      const isWalletTopup = packId === WALLET_TOPUP.id;
      const walletPack = packId ? packById(packId) : null;
      const legacyPlan = planId && planId in PLANS && planId !== "FREE" ? planId : null;
      const legacyPack = packId ? CREDIT_PACKS.find((p) => p.id === packId) : null;

      if (!isWalletPlan && !isWalletTopup && !walletPack && !legacyPlan && !legacyPack) {
        return NextResponse.json(
          { error: 'Say which plan ("plan") or credit pack ("pack") the free door should open.' },
          { status: 400 }
        );
      }

      const packageKey = isWalletPlan
        ? (planId as string)
        : isWalletTopup
          ? WALLET_TOPUP.id
          : walletPack
            ? walletPack.id
            : legacyPlan
              ? (legacyPlan as string)
              : (legacyPack as { id: string }).id;

      if (!packageMayBeFree(config, packageKey)) {
        return NextResponse.json(
          {
            error: "That package is not offered through the complimentary door right now.",
            code: "complimentary_package_closed",
          },
          { status: 403 }
        );
      }

      /* the allocation — the package's own normal credits (or the
         owner's explicit override); never a client number */
      const normalCredits = isWalletPlan
        ? WALLET_PLANS[packageKey as PlanTier].monthlyCredits
        : isWalletTopup
          ? WALLET_TOPUP.credits
          : walletPack
            ? walletPack.credits
            : legacyPlan
              ? PLANS[legacyPlan as keyof typeof PLANS].monthlyCredits
              : (legacyPack as { credits: number }).credits;
      const credits = allocationFor(config, packageKey, normalCredits);
      const originalValueCents = isWalletPlan
        ? WALLET_PLANS[packageKey as PlanTier].priceCents
        : isWalletTopup
          ? WALLET_TOPUP.priceCents
          : walletPack
            ? walletPack.priceCents
            : legacyPlan
              ? PLANS[legacyPlan as keyof typeof PLANS].priceCents
              : (legacyPack as { priceCents: number }).priceCents;
      const currency = walletPack ? walletPack.currency : "eur";

      /* the eligibility law — the owner's daily ceiling per user */
      const dayKey = new Date().toISOString().slice(0, 10);
      const referenceId = `complimentary:${user.id}:${packageKey}:${dayKey}`;
      const todaysGrants = await db.payment.count({
        where: {
          userId: user.id,
          type: "complimentary",
          createdAt: { gte: new Date(`${dayKey}T00:00:00.000Z`) },
        },
      });
      if (todaysGrants >= config.dailyLimit) {
        return NextResponse.json(
          {
            error: `The day's complimentary activations rest (${config.dailyLimit} for today). Tomorrow the door opens again.`,
            code: "complimentary_daily_limit",
          },
          { status: 429 }
        );
      }

      /* the transaction record — paid for by nothing, honestly labelled */
      const payment = await db.payment
        .create({
          data: {
            userId: user.id,
            stripeId: `comp_${referenceId}`,
            type: "complimentary",
            amountCents: 0,
            currency,
            status: "NOT_REQUIRED",
            description: JSON.stringify({
              reason: "DEVELOPMENT_ACCESS",
              package: packageKey,
              creditsGranted: credits,
              originalPackageValueCents: originalValueCents,
              originalPackageValue: `${(originalValueCents / 100).toFixed(2)} ${currency.toUpperCase()}`,
              transaction_type: "COMPLIMENTARY",
              payment_status: "NOT_REQUIRED",
            }),
          },
        })
        .catch(() => null);

      if (!payment) {
        /* the same activation was already recorded today — the unique
           reference refused the duplicate, the credits stand as they are */
        return NextResponse.json(
          { activated: true, duplicate: true, package: packageKey, credits },
          { status: 200 }
        );
      }

      /* the grant — through the wallet's own ledger, atomic + idempotent
         (the same referenceId can never fill the purse twice). No mint
         from the deposit: the complimentary mode is honestly free —
         DEVELOPMENT_ACCESS, no bank behind it — and the ledger row
         carries the complimentary labels beside the reference. */
      const isSubscription = isWalletPlan || Boolean(legacyPlan);
      const grant = await grantWalletCredits(user.id, {
        credits,
        actionType: isSubscription ? "SUBSCRIPTION_GRANT" : "TOPUP_PURCHASE",
        referenceId,
        description: `Complimentary activation — ${packageKey} (development access, nothing charged)`,
        planTier: isWalletPlan ? (packageKey as PlanTier) : null,
        actorEmail: user.email,
        mintFromDeposit: false,
        extraMetadata: {
          complimentary: true,
          reason: "DEVELOPMENT_ACCESS",
          package: packageKey,
          originalValueCents,
          transaction_type: "COMPLIMENTARY",
          payment_status: "NOT_REQUIRED",
        },
      });

      if (!grant.ok) {
        /* the record cannot stand without its grant — honest rollback */
        await db.payment.delete({ where: { id: payment.id } }).catch(() => null);
        return NextResponse.json(
          { error: "The purse could not be filled. Rest, then try again." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        activated: true,
        duplicate: Boolean(grant.duplicate),
        package: packageKey,
        credits,
        originalValueCents,
        total: grant.total,
        transaction: {
          id: payment.id,
          type: "COMPLIMENTARY",
          payment_status: "NOT_REQUIRED",
          amount_paid: 0,
          reason: "DEVELOPMENT_ACCESS",
        },
      });
    }

    /* ---------------- the future bank gateway's readiness law ---------
       CREDINS_ENABLED announces the bank gateway the owner will connect;
       until its keys rest in the vault, the paid door says so honestly
       (and Stripe keeps serving as the paid gateway meanwhile). */
    if (planId || packId) {
      const config = await getComplimentaryConfig();
      if (config.credinsEnabled && !stripeConfigured()) {
        return NextResponse.json(
          {
            error:
              "The bank gateway (CredIns) is announced but not yet connected — its keys are not in the vault. Paid checkout waits for them.",
            code: "credins_not_configured",
          },
          { status: 503 }
        );
      }
    }

    const stripe = getStripe();

    /* ---------------- the wallet's own passes (the frontier law) ------
       Seeker and Observatory Pro — subscriptions that fill the pass-
       age's OWN wallet every month; the pouch of light — a one-time
       top-up. metadata carries { userId, creditsToGrant, planTier }
       and client_reference_id carries the userId, so the signed
       webhook recognizes its owner instantly and idempotently. */
    if (planId === "SEEKER" || planId === "OBSERVATORY_PRO") {
      const tier = planId as PlanTier;
      const plan = WALLET_PLANS[tier];
      await ensureWallet(user.id);

      const customerId = await walletCustomerId(user.id, user.email, user.name);
      if (!customerId) {
        return NextResponse.json({ error: "The customer could not be created." }, { status: 500 });
      }

      const metadata = {
        userId: user.id,
        wallet: "1",
        planTier: tier,
        creditsToGrant: String(plan.monthlyCredits),
      };
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: user.id,
        line_items: [
          plan.stripePriceId
            ? { price: plan.stripePriceId, quantity: 1 }
            : {
                quantity: 1,
                price_data: {
                  currency: "usd",
                  unit_amount: plan.priceCents,
                  recurring: { interval: "month" as const },
                  product_data: {
                    name: `ReflectMe — ${plan.label} (every month ${plan.monthlyCredits} credits)`,
                  },
                },
              },
        ],
        success_url: `${req.nextUrl.origin}/?billing=success`,
        cancel_url: `${req.nextUrl.origin}/?billing=cancelled`,
        metadata,
        subscription_data: { metadata },
        allow_promotion_codes: true,
      });
      return NextResponse.json({ url: session.url });
    }

    if (packId === WALLET_TOPUP.id) {
      await ensureWallet(user.id);
      const customerId = await walletCustomerId(user.id, user.email, user.name);
      if (!customerId) {
        return NextResponse.json({ error: "The customer could not be created." }, { status: 500 });
      }
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        client_reference_id: user.id,
        line_items: [
          WALLET_TOPUP.stripePriceId
            ? { price: WALLET_TOPUP.stripePriceId, quantity: 1 }
            : {
                quantity: 1,
                price_data: {
                  currency: "usd",
                  unit_amount: WALLET_TOPUP.priceCents,
                  product_data: { name: `ReflectMe — ${WALLET_TOPUP.label} (${WALLET_TOPUP.credits} credits)` },
                },
              },
        ],
        success_url: `${req.nextUrl.origin}/?billing=success`,
        cancel_url: `${req.nextUrl.origin}/?billing=cancelled`,
        metadata: {
          userId: user.id,
          wallet: "1",
          creditsToGrant: String(WALLET_TOPUP.credits),
        },
      });
      return NextResponse.json({ url: session.url });
    }

    /* ---------- the credit packs — the one wallet's filling ----------
       THE CREATOR ECONOMY'S OWN PACKS: 100 · 250 · 700 lights, one
       wallet across music, books and the akashic readings. The price
       rides inline (no Stripe dashboard configuration needed), and the
       signed webhook is still the only hand that fills the purse. */
    const walletPack = packById(packId);
    if (walletPack) {
      await ensureWallet(user.id);
      const customerId = await walletCustomerId(user.id, user.email, user.name);
      if (!customerId) {
        return NextResponse.json({ error: "The customer could not be created." }, { status: 500 });
      }
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        client_reference_id: user.id,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: walletPack.currency,
              unit_amount: walletPack.priceCents,
              product_data: {
                name: `ReflectMe — ${walletPack.label} (${walletPack.credits} credits)`,
              },
            },
          },
        ],
        success_url: `${req.nextUrl.origin}/?billing=success`,
        cancel_url: `${req.nextUrl.origin}/?billing=cancelled`,
        metadata: {
          userId: user.id,
          wallet: "1",
          packId: walletPack.id,
          creditsToGrant: String(walletPack.credits),
        },
      });
      return NextResponse.json({ url: session.url });
    }

    const provisions = await ensureVisitorProvisions(user.id);

    if (planId && planId in PLANS && planId !== "FREE") {
      const plan = PLANS[planId as keyof typeof PLANS];
      if (!plan.stripePriceId) {
        return NextResponse.json(
          {
            error: `The ${plan.label} plan has no Stripe price id yet (STRIPE_PRICE_${planId} in the vault) — nothing was charged.`,
            code: "price_not_configured",
          },
          { status: 503 }
        );
      }
      const customerId = await ensureStripeCustomer(provisions.workspaceId, user.email, user.name);
      if (!customerId) {
        return NextResponse.json({ error: "The customer could not be created." }, { status: 500 });
      }
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        success_url: `${req.nextUrl.origin}/?billing=success`,
        cancel_url: `${req.nextUrl.origin}/?billing=cancelled`,
        metadata: {
          workspaceId: provisions.workspaceId,
          plan: plan.id,
          grantCredits: String(plan.monthlyCredits),
        },
        subscription_data: {
          metadata: { workspaceId: provisions.workspaceId, plan: plan.id },
        },
        allow_promotion_codes: true,
      });
      return NextResponse.json({ url: session.url });
    }

    if (packId) {
      const pack = CREDIT_PACKS.find((p) => p.id === packId);
      if (!pack) {
        return NextResponse.json({ error: "That credit pack does not exist." }, { status: 400 });
      }
      if (!pack.stripePriceId) {
        return NextResponse.json(
          {
            error: `That pack has no Stripe price id yet (${pack.id}) — nothing was charged.`,
            code: "price_not_configured",
          },
          { status: 503 }
        );
      }
      const customerId = await ensureStripeCustomer(provisions.workspaceId, user.email, user.name);
      if (!customerId) {
        return NextResponse.json({ error: "The customer could not be created." }, { status: 500 });
      }
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        line_items: [{ price: pack.stripePriceId, quantity: 1 }],
        success_url: `${req.nextUrl.origin}/?billing=success`,
        cancel_url: `${req.nextUrl.origin}/?billing=cancelled`,
        metadata: {
          workspaceId: provisions.workspaceId,
          packPriceId: pack.stripePriceId,
          credits: String(pack.credits),
        },
      });
      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json(
      { error: 'Say which plan ("plan") or credit pack ("pack") the passage seeks.' },
      { status: 400 }
    );
  } catch (err) {
    console.error("[billing/checkout] failed:", err);
    return NextResponse.json(
      { error: "The checkout could not be opened. Rest, then try again." },
      { status: 500 }
    );
  }
}
