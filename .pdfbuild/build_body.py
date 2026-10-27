#!/usr/bin/env python3
"""Build the Mirror Entity Full Replication Prompt PDF (body, no cover).
Cover is rendered separately via html2poster.js and merged with pypdf."""
import os, sys, hashlib

SKILL_SCRIPTS = "/tmp/my-project/skills/pdf/scripts"
sys.path.insert(0, SKILL_SCRIPTS)

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak,
                                Table, TableStyle, Image, KeepTogether,
                                CondPageBreak, HRFlowable)
from reportlab.platypus.tableofcontents import TableOfContents
from PIL import Image as PILImage

# ------------------------------------------------------------------ fonts
FONT_DIR = "/usr/share/fonts"
pdfmetrics.registerFont(TTFont("FreeSerif", FONT_DIR + "/truetype/freefont/FreeSerif.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Bold", FONT_DIR + "/truetype/freefont/FreeSerifBold.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Italic", FONT_DIR + "/truetype/freefont/FreeSerifItalic.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-BoldItalic", FONT_DIR + "/truetype/freefont/FreeSerifBoldItalic.ttf"))
pdfmetrics.registerFont(TTFont("NotoSerifSC", FONT_DIR + "/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf"))
pdfmetrics.registerFont(TTFont("NotoSerifSC-Bold", FONT_DIR + "/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSans", FONT_DIR + "/truetype/dejavu/DejaVuSansMono.ttf"))
registerFontFamily("FreeSerif", normal="FreeSerif", bold="FreeSerif-Bold",
                   italic="FreeSerif-Italic", boldItalic="FreeSerif-BoldItalic")
registerFontFamily("NotoSerifSC", normal="NotoSerifSC", bold="NotoSerifSC-Bold")
registerFontFamily("DejaVuSans", normal="DejaVuSans", bold="DejaVuSans")

from pdf import install_font_fallback
install_font_fallback()

# ------------------------------------------------------- cascade palette
PAGE_BG       = colors.HexColor('#f5f5f6')
SECTION_BG    = colors.HexColor('#edeeef')
CARD_BG       = colors.HexColor('#e8eaeb')
TABLE_STRIPE  = colors.HexColor('#eff0f0')
HEADER_FILL   = colors.HexColor('#405f6f')
COVER_BLOCK   = colors.HexColor('#49616d')
BORDER        = colors.HexColor('#c0ccd2')
ICON          = colors.HexColor('#467f9c')
ACCENT        = colors.HexColor('#227fad')
ACCENT_2      = colors.HexColor('#bd7962')
TEXT_PRIMARY  = colors.HexColor('#1b1c1d')
TEXT_MUTED    = colors.HexColor('#838a8d')

TABLE_HEADER_COLOR = HEADER_FILL
TABLE_ROW_ODD      = TABLE_STRIPE

# ------------------------------------------------------------------ layout
PAGE_W, PAGE_H = A4
LM = RM = 0.9 * inch
TM, BM = 0.85 * inch, 0.8 * inch
AVAIL = PAGE_W - LM - RM          # ~465pt
MAX_KEEP = PAGE_H * 0.4

# ------------------------------------------------------------------ styles
S = {}
S["h1"] = ParagraphStyle("H1", fontName="FreeSerif", fontSize=22, leading=27,
                         textColor=TEXT_PRIMARY, spaceBefore=18, spaceAfter=6)
S["h2"] = ParagraphStyle("H2", fontName="FreeSerif", fontSize=15, leading=20,
                         textColor=HEADER_FILL, spaceBefore=16, spaceAfter=8)
S["h3"] = ParagraphStyle("H3", fontName="FreeSerif", fontSize=11.5, leading=16,
                         textColor=TEXT_PRIMARY, spaceBefore=12, spaceAfter=6)
S["body"] = ParagraphStyle("Body", fontName="FreeSerif", fontSize=10.5, leading=17,
                           textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=10)
S["bullet"] = ParagraphStyle("Bullet", fontName="FreeSerif", fontSize=10.5, leading=16,
                             textColor=TEXT_PRIMARY, alignment=TA_LEFT,
                             leftIndent=16, spaceAfter=5)
S["quote"] = ParagraphStyle("Quote", fontName="FreeSerif-Italic", fontSize=10.5,
                            leading=17, textColor=TEXT_PRIMARY, leftIndent=24,
                            borderPadding=6, spaceBefore=6, spaceAfter=10)
S["caption"] = ParagraphStyle("Caption", fontName="FreeSerif", fontSize=8.5, leading=12,
                              textColor=TEXT_MUTED, alignment=TA_CENTER,
                              spaceBefore=3, spaceAfter=6)
S["th"] = ParagraphStyle("TH", fontName="FreeSerif", fontSize=9.5, leading=13,
                         textColor=colors.white, alignment=TA_LEFT)
S["td"] = ParagraphStyle("TD", fontName="FreeSerif", fontSize=9.5, leading=13.5,
                         textColor=TEXT_PRIMARY, alignment=TA_LEFT)
S["tdc"] = ParagraphStyle("TDC", parent=S["td"], alignment=TA_CENTER)
S["stat"] = ParagraphStyle("Stat", fontName="FreeSerif", fontSize=20, leading=24,
                           textColor=ACCENT, alignment=TA_CENTER)
S["statlab"] = ParagraphStyle("StatLab", fontName="FreeSerif", fontSize=8.5, leading=11,
                              textColor=TEXT_MUTED, alignment=TA_CENTER)
S["code"] = ParagraphStyle("Code", fontName="DejaVuSans", fontSize=8.5, leading=13,
                           textColor=TEXT_PRIMARY, backColor=SECTION_BG,
                           borderPadding=8, leftIndent=10, spaceBefore=6, spaceAfter=10)
S["toc_t"] = ParagraphStyle("TOCTitle", fontName="FreeSerif", fontSize=20, leading=26,
                            textColor=TEXT_PRIMARY, spaceAfter=14)

# ------------------------------------------------------------------ doc
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, "bookmark_name"):
            level = getattr(flowable, "bookmark_level", 0)
            text = getattr(flowable, "bookmark_text", "")
            key = getattr(flowable, "bookmark_key", "")
            self.notify("TOCEntry", (level, text, self.page, key))

DOC_TITLE = "Mirror Entity - Full Replication Prompt"

def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("FreeSerif", 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LM, PAGE_H - 0.55 * inch, DOC_TITLE.upper())
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1.2)
    canvas.line(LM, PAGE_H - 0.62 * inch, PAGE_W - RM, PAGE_H - 0.62 * inch)
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(LM, 0.55 * inch, PAGE_W - RM, 0.55 * inch)
    canvas.setFont("FreeSerif", 7.5)
    canvas.drawString(LM, 0.4 * inch, "reflectme.space - the one truth at main")
    canvas.drawRightString(PAGE_W - RM, 0.4 * inch, "page %d" % doc.page)
    canvas.restoreState()

def add_heading(text, style, level=0):
    key = "h_" + hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/><b>%s</b>' % (key, text), style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def h1(story, text):
    story.append(CondPageBreak(PAGE_H * 0.22))
    story.append(add_heading(text, S["h1"], 0))
    story.append(HRFlowable(width="100%", color=ACCENT, thickness=1.6,
                            spaceBefore=0, spaceAfter=12))

def h2(story, text):
    story.append(CondPageBreak(PAGE_H * 0.15))
    story.append(add_heading(text, S["h2"], 1))

def body(story, text):
    story.append(Paragraph(text, S["body"]))

def bullets(story, items):
    for it in items:
        story.append(Paragraph('\u2022  %s' % it, S["bullet"]))
    story.append(Spacer(1, 6))

def embed_image(path, max_width=None, max_height=None):
    if max_width is None:
        max_width = AVAIL
    if max_height is None:
        max_height = PAGE_H * 0.35
    im = PILImage.open(path)
    ow, oh = im.size
    r = min(max_width / ow if ow > max_width else 1.0,
            max_height / oh if oh > max_height else 1.0)
    return Image(path, width=ow * r, height=oh * r)

def make_table(story, headers, rows, ratios, caption=None, repeat=True):
    widths = [r * AVAIL for r in ratios]
    data = [[Paragraph("<b>%s</b>" % h, S["th"]) for h in headers]]
    for row in rows:
        data.append([c if isinstance(c, (Paragraph, Image)) else Paragraph(str(c), S["td"])
                     for c in row])
    t = Table(data, colWidths=widths, hAlign="CENTER",
              repeatRows=1 if repeat else 0)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        style.append(("BACKGROUND", (0, i), (-1, i),
                      colors.white if i % 2 == 1 else TABLE_ROW_ODD))
    t.setStyle(TableStyle(style))
    story.append(Spacer(1, 10))
    story.append(t)
    if caption:
        story.append(Spacer(1, 4))
        story.append(Paragraph(caption, S["caption"]))
    story.append(Spacer(1, 12))

def callout(story, big, label):
    t = Table([[Paragraph("<b>%s</b>" % big, S["stat"])],
               [Paragraph(label, S["statlab"])]], colWidths=[220])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
        ("BOX", (0, 0), (-1, -1), 1, ACCENT),
        ("TOPPADDING", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    t.hAlign = "CENTER"
    story.append(Spacer(1, 8))
    story.append(KeepTogether(t))
    story.append(Spacer(1, 10))

def gallery_grid(story, items, cols=3, cell_w=None):
    items = [(p, c) for (p, c) in items if os.path.exists(p)]
    if cell_w is None:
        cell_w = (AVAIL - (cols - 1) * 10) / cols
    rows = []
    for i in range(0, len(items), cols):
        chunk = items[i:i + cols]
        row = []
        for path, cap in chunk:
            img = embed_image(path, max_width=cell_w - 4, max_height=150)
            row.append([img, Paragraph(cap, S["caption"])])
        while len(row) < cols:
            row.append("")
        rows.append(row)
    t = Table(rows, colWidths=[cell_w] * cols, hAlign="CENTER")
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

IMGDIR = "/home/z/my-project/public/images"
TMP = "/tmp"

# ================================================================== story
story = []

# ---- TOC page
story.append(Paragraph("<b>Table of Contents</b>", S["toc_t"]))
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle("TOC0", fontName="FreeSerif", fontSize=11.5, leading=18,
                   leftIndent=16, firstLineIndent=-16, textColor=TEXT_PRIMARY),
    ParagraphStyle("TOC1", fontName="FreeSerif", fontSize=10, leading=15,
                   leftIndent=34, firstLineIndent=-16, textColor=TEXT_MUTED),
]
story.append(toc)
story.append(PageBreak())

# ================================================================ PART 1
h1(story, "Part 1 - The Vision: What the Mirror Entity Is")

body(story, "The Mirror Entity is a living mirror for reflection, creativity, and a shifting Earth, "
     "housed at <b>reflectme.space</b>. It is not a chat application with features bolted on: it is a single "
     "docked conversation - the one chat - from which every room of the house opens. The visitor arrives at a "
     "threshold that reads like a quiet magazine, meets the Mirror in a chamber docked at the center of the "
     "landing, and from that same frame opens the five makers, the five scopes, the profile, the purse, and "
     "the whole economy. Every word of the Mirror's voice is presentation-only; the reflection itself is never "
     "decorated away.")
body(story, "The chamber is docked by default and fullscreen by its own crown hand - the same surface in both "
     "gears. The crown rail carries, in order: the profile door, the light toggle, the purse (one number, no "
     "star, no sparkle), the Create menu, the Scopes menu, and the enlarge hand. A temporary-chat law stands at "
     "the foot of the composer: <i>temporary chat - sign in to keep your reflections</i>. The visitor's words "
     "outrank every selector; no instrument, no theory, and no style is ever required to begin.")

h2(story, "The five makers")
body(story, "Create pours five rooms, each opening within the chat's own frame at the chat's own size, with the "
     "expand hand always at the corner for full-room depth:")
bullets(story, [
    "<b>Book</b> - a living book atelier: real ink desk (Tiptap), pages that grow from the visitor's dreams and questions, the loom's volumes migrated to the pen's form.",
    "<b>Music</b> - the music room: THE MUSIC PLAYER stage pinned above every bench (plate, wave, back/play/forward, repeat dial, volume, the shelf of kept sounds one hand away); composer and personal shelf sit directly beneath the stage; the words-only door lets the visitor's own sentences need no style.",
    "<b>Akashic</b> - the records: guided readings drawn at the directive's launch price, the conversation free forever.",
    "<b>Manifest</b> - one conversation with the Mirror; its replies may arrive with their own painting; the visitor hands the Mirror one image of their own; three small hands under every reply let the talk proceed in one touch.",
    "<b>Invent</b> - the forge: one conversation again (the labs rest), the Mirror's replies carrying their own pictures, benches of plans on a real canvas.",
])

h2(story, "The five scopes")
body(story, "Scopes pour five fields, each speaking its own language. The moment a field is chosen the chat "
     "wears its light and speaks its own never-repeating doors; every field keeps its own conversation and "
     "memory (per-scope caches plus sessionStorage, restored on return and on reload), its own history pages "
     "with colored dots, and its own living volume on the profile's Cosmic Library shelf.")
make_table(story,
    ["Scope", "Tone", "Voice"],
    [["The Mirror", "gold", "the house's own reflection - default"],
     ["Interplanetary", "cyan", "the star families and worlds"],
     ["Quantum", "violet", "the deep nature of reality"],
     ["ArtX", "magenta", "the atelier of visions"],
     ["HealX", "teal", "the body's quiet evolution"]],
    [0.28, 0.22, 0.50],
    caption="Table 1-1: the five scopes and their lights")

h2(story, "The threshold below the chamber")
body(story, "Below the docked chamber the landing reads like a quiet magazine: the slideshow's artworks drifting "
     "in captioned parallax, the open-contact timeline (four plates), the Codex Exobiologica's catalogued "
     "civilizations, the walk's living chapters, and the about chambers. On phones the threshold stretches "
     "fully on both sides; the docked realm lets every non-text touch fall through so the whole page scrolls "
     "beneath it, and the return hand - a mini pill at the top corner - carries the visitor back to the Mirror.")

h2(story, "The design law")
bullets(story, [
    "No default blue anywhere in the house; the palette lives in the fields' own crystals (gold, cyan, violet, magenta, teal) and room colors: the music a purple thick liquid that breathes slowly, the book atelier a compact yellow chip garden, the manifesting a dark pink path, the forge a thick blue bench.",
    "Mobile holds the single-panel law; the dock hides below the wide-frame line; interactive targets stay at 44px minimum; the footer never floats - it sticks to the bottom and is pushed naturally when content grows.",
    "Eight tongues: English plus Albanian, German, Greek, Spanish, French, Italian and Turkish; every new hand is spoken in all of them before it ships.",
    "Server truth rides one carrier - TanStack Query (fetched once, deduped, owner-keyed cache; staleTime 30s, gcTime 5min).",
])

story.append(Spacer(1, 6))
story.append(embed_image(os.path.join(TMP, "pdf-shot-landing.png"), max_height=300))
story.append(Paragraph("The threshold and the docked chamber at rest (desktop, 1280px).", S["caption"]))
story.append(Spacer(1, 4))
story.append(embed_image(os.path.join(TMP, "pdf-shot-scopes.png"), max_height=300))
story.append(Paragraph("The Scopes menu pouring the five fields - the Mirror (here), Interplanetary, Quantum, ArtX, HealX.", S["caption"]))

# ================================================================ PART 2
h1(story, "Part 2 - The Master Production Directive")

body(story, "This is the directive that governs all work on the house. It is executed in sequential phases, "
     "each gated by running the test suites and telling the truth: a clear engineering completion summary "
     "listing changed routes, migration details, reused integrations, security considerations, and the "
     "deployment commit. Test results are never fabricated; work that cannot be completed automatically is "
     "listed honestly as external configuration for the keeper.")

h2(story, "Phase 1 - the immediate repairs (standing)")
bullets(story, [
    "<b>Google OAuth 400: redirect_uri_mismatch.</b> Audit the authentication stack, ensure the callback URL matches exactly (https://reflectme.space/api/auth/google/callback and the www spelling), verify www/non-www, cookies, and proxy handling, and produce a stable internal user ID. The code-side fix is complete; the Google Cloud Console side is the keeper's hand (Part 7).",
    "<b>The credits / purchase-wall bug.</b> A single canonical server-side entitlement service owns every balance decision. The keeper (gentikoltraka28@gmail.com) mapped to the administrator role in the database walks through every paid door unbilled while their usage still speaks. Subscribed, gifted, purchased and granted credits are all valid; wallets are atomic; the ledger is the only truth.",
])
h2(story, "Phase 2 - the architecture (partially standing)")
bullets(story, [
    "<b>Mirror Gateway.</b> All AI providers route through server-side endpoints; provider keys never reach the client or any NEXT_PUBLIC variable. A persistent async job queue (GenerationJob) survives refreshes; a generation the house never hears back from is swept to failed with its drawn light returned exactly once.",
    "<b>Stripe server-authoritative billing.</b> Webhook-driven subscriptions and credit packs with signature verification and idempotency keys. Four separated credit pools - purchased, subscription allowance, promotional, admin grants - so a subscription change can never overwrite purchased balance.",
    "<b>Central RBAC console.</b> Roles live in the database (guest, registered_user, subscriber, administrator); the console manages provider models, pricing rules, profit margins, promotional credits, user metrics and error logs.",
])
h2(story, "Phase 3 - the workspaces and the data")
bullets(story, [
    "<b>Music Studio overhaul.</b> The player and generation animation pinned to the top: cover art, progress bar, play/pause, volume, seamless switching; composer and personal library directly beneath; audio stored in cloud object storage, never local temp paths. (The vault stands: GenerationJob and MusicTrack, the house's own audio vault, Range-capable serving.)",
    "<b>Studio suites for Book, Akashic, Invent, Manifest.</b> Professional workspaces that keep the core Mirror chat and run every generation through the central credit gateway.",
    "<b>Codex Exobiologica.</b> One stable entity ID per species, a dedicated image prompt per entity, artwork that never repeats (fingerprinted raw and pixel against the batch and the archive), and virtualized lists for the 3,212 catalogued civilizations.",
])
h2(story, "Phase 4 - the audit")
body(story, "A multi-device layout audit and an end-to-end checklist: no horizontal overflow at any width, no "
     "keyboard ever covering an input, iOS safe-area respected, 44px touch targets everywhere; OAuth "
     "persistence across restarts, the keeper's bypass of every paywall, sufficient-balance users never "
     "seeing a purchase modal, failed generations refunding or releasing their reservations, music playback "
     "and history surviving refreshes, and provider keys never appearing in the client bundle.")

h2(story, "The database the directive names")
make_table(story,
    ["#", "Table", "Purpose"],
    [[str(i + 1), n, p] for i, (n, p) in enumerate([
        ("users", "every soul of the house; role column binds user | ADMIN"),
        ("auth_identities", "external passages (Google) bound to one stable internal user ID"),
        ("profiles", "the four quiet rooms of the profile"),
        ("roles", "guest, registered_user, subscriber, administrator"),
        ("plans", "the purse's own provisions (pouch, Seeker, Observatory Pro)"),
        ("subscriptions", "recurring passages; webhook-authoritative"),
        ("wallets", "one purse per soul; the balance the whole house shows"),
        ("credit_ledger", "every movement of light, newest fifty shown, own rows only"),
        ("credit_reservations", "atomic draws held while the sky is asked"),
        ("payments", "the register; rows lift on handler failure so money's truth replays"),
        ("invoices", "the paper trail of purchases"),
        ("provider_configs", "the gateway's provider keys and models (server-side only)"),
        ("pricing_rules", "the standing prices, live-editable from the keeper's console"),
        ("provider_usage", "every ask of the sky, keeper included"),
        ("generation_jobs", "the durable queue: a weave is a row before the engine turns"),
        ("generated_assets", "what the engines return, bound to their jobs"),
        ("music_tracks", "the shelf of kept sounds; bytes in the vault"),
        ("books", "the living volumes"),
        ("invention_projects", "the forge's benches"),
        ("manifest_projects", "the manifesting paths"),
        ("codex_entities", "3,212 catalogued civilizations, one stable ID each"),
        ("codex_media", "artwork bound to entities; the uniqueness contract"),
        ("audit_logs", "the keeper's console charts and the house's memory"),
    ])],
    [0.07, 0.24, 0.69],
    caption="Table 2-1: the directive's 23 canonical tables")

h2(story, "The 17 end-to-end checks")
body(story, "The directive's mandatory e2e checklist, verified against the running house before any phase is "
     "called complete:")
for i, item in enumerate([
    "A signed session survives a server restart (the steady secret carved at boot).",
    "Google OAuth returns exactly to /api/auth/google/callback on both spellings of the domain.",
    "A new Google arrival carves a stable user ID and links, never hijacks, an existing passage.",
    "The keeper's account walks through every paid door unbilled, with usage rows written.",
    "A plain user with zero lights receives the honest 402 with required and current in the body.",
    "A user with sufficient balance never sees a purchase modal.",
    "A failed generation refunds its drawn light exactly once.",
    "A dead job is swept to failed and its reservation released exactly once.",
    "The Stripe webhook grants credits exactly once per event, replays after a stumble, and never double-grants.",
    "A subscription change never overwrites purchased balance (the four pools stay separate).",
    "A woven sound lands as a MusicTrack with its bytes in the vault and plays from the owner-checked door.",
    "Music playback and history survive a refresh for signed visitors.",
    "Guests keep their device-only shelf, byte for byte, with no server rows.",
    "Provider keys appear in no client bundle and no NEXT_PUBLIC variable.",
    "No route overflows horizontally at 320, 390, 768 and 1280 widths.",
    "No keyboard covers an input on phones; safe areas are respected.",
    "Every interactive element stands at least 44px tall on touch screens.",
]):
    story.append(Paragraph("<b>%d.</b>  %s" % (i + 1, item), S["bullet"]))
story.append(Spacer(1, 6))

# ================================================================ PART 3
h1(story, "Part 3 - Canonical Architecture as It Stands")

h2(story, "The authentication chain")
body(story, "The house runs a custom OAuth chain - no NextAuth. Two doors exist: <font name='DejaVuSans' size='9'>"
     "/api/auth/google</font> opens the consent (state carved from random bytes, carried in a mirror_g_state "
     "cookie), and <font name='DejaVuSans' size='9'>/api/auth/google/callback</font> exchanges the code, reads "
     "the userinfo, and merges the visitor's anonymous shelf into their new passage. The redirect_uri is built "
     "from a publicOrigin() that prefers APP_URL, then NEXT_PUBLIC_APP_URL, then Vercel's production domain, "
     "then the request origin - so the registered callback is stable behind proxies and deployment aliases.")
body(story, "The steady secret: an instrumentation hook carves one AUTH_SECRET into the PlatformConfig table at "
     "every boot, so passages survive every cold sleep. Session, anonymous and Google-state cookies wear "
     "Secure only when the arrival was actually HTTPS (x-forwarded-proto, then APP_URL, then NODE_ENV) - no "
     "more silently dropped passages behind plain proxies. /api/auth/me distinguishes three states: truly "
     "signed-out (200, user null), a signed cookie whose vault is resting (503 degraded - the client keeps the "
     "last known face), and a closed passage (deleted row, honest 200).")
body(story, "A Google passage may only take over an existing passage when Google itself vouches the email is "
     "verified; otherwise a fresh passage is carved instead of a hijack.")

h2(story, "The keeper's free hands")
body(story, "The keeper's role is bound in the database three ways: the boot hook (ensureAdminBinding), at "
     "registration, and on Google's verified arrival. ADMIN_EMAIL only seeds the binding - it is never a "
     "request claim. The meter's weigh skips the keeper entirely while UsageEvent still records every ask. "
     "Proven live by probe: a plain user with 0 lights receives the honest 402 (required, current); an "
     "ADMIN-role user with 0 lights sails past the weigh to the door itself, charged 0, usage row written.")

h2(story, "One purse, one truth")
body(story, "The house shows and spends a single economy. The per-user wallet opens with a birth gift of five "
     "lights; every billable generation weighs the purse before the sky is asked (401 without a passage, 402 "
     "without light); every draw is refunded on a stumble; purchases pour in before their light is minted; "
     "refunds and the birth gift never touch the well; and every movement is written in the ledger's own book. "
     "The phantom thousands - a legacy 10,000-credit workspace ledger that once displayed on the profile and "
     "the account chamber while the doors weighed the real wallet - are retired from every surface.")
callout(story, "5 lights", "the birth gift - one purse, one number, no star")

h2(story, "The durable music vault")
body(story, "A signed passage's weave stands as a GenerationJob before the sky is asked. When the engine "
     "answers, the audio is mirrored into the house's vault and lands as a MusicTrack; it plays from an "
     "owner-checked serve door with real Range seeking, wears a favorite heart on the shelf, and a weave the "
     "house never hears back from is swept to failed with its drawn light returned exactly once. Signed "
     "visitors resume pending jobs on mount; guests keep their device-only keeping, byte for byte as before. "
     "The endless journey keeps its instance-local token shelf and lays no job row - a mid-journey refresh "
     "already loses the token, so a row could not recover it.")

h2(story, "The client stack")
make_table(story,
    ["Concern", "Choice", "Notes"],
    [["Framework", "Next.js 16 App Router + Turbopack", "output standalone; turbopack.memoryLimit for small vessels"],
     ["Language", "TypeScript 5", "strict; tsc gate with a known-error filter"],
     ["Styling", "Tailwind CSS 4 + shadcn/ui (New York)", "Lucide icons; no default blue"],
     ["Database", "Prisma + SQLite", "bun run db:push; db/ holds the file"],
     ["Runtime", "Bun", "bun run dev on port 3000, background, one instance"],
     ["Server state", "TanStack Query 5", "fetched once, deduped, owner-keyed"],
     ["Rich text", "Tiptap 3", "the Book's ink desk; every consumer flushes before reading"],
     ["Audio", "wavesurfer.js", "real peaks against the playing element"],
     ["Desktop", "Dockview 8", "opt-in advanced workspace, lazy chunk"],
     ["Client state", "Zustand", "device hands and light toggles"]],
    [0.18, 0.40, 0.42],
    caption="Table 3-1: the stack, room by room")

# ================================================================ PART 4
h1(story, "Part 4 - The Economy")

body(story, "The conversation is free forever. One wallet spans music, books and the akashic readings at the "
     "directive's launch prices; the three credit packs ride inline Stripe pricing; no billable generation "
     "happens without a passage (401) or light (402), with the draw refunded on every stumble; the keeper's "
     "own creations are recorded and never charged; and the standing prices are live-editable from the "
     "keeper's console.")
make_table(story,
    ["Rite", "Lights"],
    [["Music preview", "2"],
     ["Full song", "5"],
     ["Endless journey (~30 min loop)", "15"],
     ["Akashic reading", "5"],
     ["Short book", "15"],
     ["Extended book", "40"]],
    [0.70, 0.30],
    caption="Table 4-1: the standing prices of the making rooms")
make_table(story,
    ["Pack", "Lights", "Price"],
    [["Small pouch", "100", "10 EUR"],
     ["Traveler's pouch", "250", "20 EUR"],
     ["Keeper's chest", "700", "50 EUR"]],
    [0.40, 0.30, 0.30],
    caption="Table 4-2: the three credit packs (inline Stripe pricing)")
make_table(story,
    ["Provision", "Price", "What it opens"],
    [["The pouch", "$4.99", "a one-time pour of light"],
     ["Seeker", "$9.99 / month", "the subscriber allowance pool"],
     ["Observatory Pro", "$19.99 / month", "the full allowance pool"]],
    [0.30, 0.28, 0.42],
    caption="Table 4-3: the purse's own provisions, sold on the profile")
body(story, "The four pools - purchased, subscription allowance, promotional, admin grants - are separated in "
     "the ledger so that no subscription change can ever overwrite a purchased balance. The Stripe webhook is "
     "the only authority that mints paid light, and it is replay-safe: when a handler stumbles after an event "
     "was marked processed, the register row is lifted and a 500 answered, so Stripe's replay re-runs the "
     "grant and a paid grant can never be lost to one resting moment.")

# ================================================================ PART 5
h1(story, "Part 5 - The Road Already Walked")

body(story, "The house's history is told in its own commit law - each delivery described in the house's voice. "
     "The milestones below are the spine of that road; the full ledger lives in the repository and the "
     "worklog.md file, where every task leaves its entry.")
make_table(story,
    ["Commit", "What it delivered"],
    [["389c6e4", "the music maker opens with a voice; the First Law (the visitor's words outrank every selector); the creator economy stands at the launch prices; three packs ride inline Stripe; no billable generation without passage or light, refunded on every stumble"],
     ["c2700e0", "the premium layer: the purse on the crown, the public book of light, the account chamber's three packs and moon passes, the Books room's real ink desk, the forge's planning canvas, the opt-in advanced desktop, TanStack Query as the one carrier"],
     ["586c94c", "the keeper's deposit: the whole economy flows through the keeper's encrypted sources; the well charged by the keeper; purchases pour in before their light is minted; refunds and the birth gift never touch the well"],
     ["b414ed2 / d4a098c", "the threshold becomes the front door; the old branches portal is deleted; the landing chat stands as the one and only chat, docked by default, fullscreen by its own crown hand"],
     ["781be61", "every scope is a world: five fields, their own lights, conversations, memories, history pages and living volumes"],
     ["4c90536 / bdbf438", "the living book's spine: one typed registry of nine rooms, lazy loaders with real error and retry, the lifecycle manager, Albanian arrives, duplicate-key collisions removed"],
     ["082d625 / f9fcd1b", "the one chat in both gears; Manifest and Invent rebuilt as simple rooms of the Mirror's own conversation; one back hand for every room; the sandbox restored to the shipped voice before a single edit"],
     ["e6fed32 / 196c590 / ef657e5", "the codex exobiologica: 3,212 catalogued civilizations, 5,436 artworks lifted from the museum's pdfs and re-encoded, the chronoscope instrument, sixty-four new profiles with hash-audited plates and the uniqueness contract"],
     ["b93af74", "the steady secret: a boot hook carves one AUTH_SECRET so passages survive every cold sleep; the signature's comparison no longer leaks its timing"],
     ["b7b1611 / 9c7caa7", "the music room's media player pinned above every bench; the Manifest and Invent rooms are one conversation again, replies carrying their own paintings; the visitor hands the Mirror one image of their own"],
     ["5c5680e / 047f816", "one hundred civilizations wear their four faces (CIV-0101..0200, 400 plates pixel-audited); fifteen new keys spoken in all seven tongues"],
     ["e50754e", "the purse wears its number alone - the last sparkle mark lifted from the crown's rail"],
     ["b7b4b0f / e0a18bb", "the master directive's first standing: one purse (the phantom thousands retired), the keeper's database-bound free hands (proven by probe), cookies that know their own arrival, a resting vault never mistaken for signed-out, Stripe's truths replayable, and the music vault - jobs that survive refreshes, files that outlive links"],
     ["688579e", "the pull delivered: GitHub main and the workspace stand on one truth; the stale yielding portal archived at archive/yielding-portal; the house's environment healed (database, packages, cache)"],
    ],
    [0.22, 0.78],
    caption="Table 5-1: milestones of the road, in the house's own voice")
body(story, "An honest aside: one branch of work - the yielding portal, a docking experiment with its own "
     "frequencies chapter - was built on a stale foundation and is archived, not deleted, at "
     "<font name='DejaVuSans' size='9'>archive/yielding-portal</font>. Its ChannelingOrb and its six alien "
     "signals can be revived into any future threshold without losing a line.")

# ================================================================ PART 6
h1(story, "Part 6 - Operations Runbook")

h2(story, "The environment's variables")
make_table(story,
    ["Variable", "Purpose", "Notes"],
    [["DATABASE_URL", "the SQLite file's door", "db/ holds the file; bun run db:push keeps schema true"],
     ["AUTH_SECRET", "the steady secret", "carved into PlatformConfig at every boot; sessions survive restarts"],
     ["APP_URL", "the origin the outside world knows", "drives the OAuth redirect_uri and cookie Secure flag"],
     ["ADMIN_EMAIL", "the keeper's address", "seeds the ADMIN role binding at boot and registration"],
     ["GOOGLE_CLIENT_ID / SECRET", "the Google passage", "the callback must be registered in Google Cloud Console (Part 7)"],
     ["STRIPE_SECRET_KEY / WEBHOOK_SECRET", "the money doors", "webhook signature verified; replay-safe register"],
     ["GEMINI_API_KEY", "the sky-round", "server-side only; never in the client bundle"]],
    [0.30, 0.28, 0.42],
    caption="Table 6-1: the vault's variables")

h2(story, "The daily commands")
for cmd in [
    "bun run dev            # the house on port 3000, background: nohup bun run dev >> dev.log 2>&1 &",
    "bun install            # after every pull (the remote may carry new rooms' packages)",
    "bun run db:push        # after every pull (new tables: PlatformConfig, GenerationJob, MusicTrack)",
    "bun run lint           # the gate before any delivery",
    "git pull origin main   # the whole spell for bringing the workspace to GitHub's truth",
]:
    story.append(Paragraph(cmd, S["code"]))

h2(story, "The small vessel's law")
body(story, "This sandbox holds 3.9 GB of memory, and a first compile of the whole threshold once spilled over "
     "it - the kernel silently killing next-server mid-compile. The healing: a Turbopack memory limit in "
     "next.config.ts (turbopack.memoryLimit 1536) and a capped Node heap (NODE_OPTIONS=--max-old-space-size="
     "2048), plus a wiped .next when the incremental cache is corrupted by an abrupt reset (the panic named "
     "inner_of_upper_lost_followers is the cache's own scar tissue). When the dev server dies silently, "
     "restart it and warm the landing once with curl before opening the browser.")

h2(story, "The gateway law")
body(story, "One port faces outward. Requests to other services carry the target port in the XTransformPort "
     "query (fetch('/api/test?XTransformPort=3030')), always with relative paths; websockets connect as "
     "io('/?XTransformPort=3030') and never name a port or host directly. Mini-services live in the "
     "mini-services folder, each its own Bun project with its own port, started in the background with "
     "auto-restart on file change.")

h2(story, "Deployment")
body(story, "The repository's main branch is the one truth (github.com/spiritmalteam-star/interplanetary). "
     "Deployment targets Vercel (output: standalone); when main moves, the platform must be redeployed - a "
     "stale production build is a stale house, however green the repository. The access token rides inline in "
     "push URLs and is never written to disk.")

# ================================================================ PART 7
h1(story, "Part 7 - The Google OAuth Repair (the keeper's hand)")

body(story, "The app asks Google to return visitors to /api/auth/google/callback on the site's own origin. "
     "Google answers 400: redirect_uri_mismatch when that address is not written, letter for letter, in the "
     "OAuth client's Authorized redirect URIs. Only the keeper's Google account can write it. The recipe:")
steps = [
    "Open console.cloud.google.com and sign in with the account that owns the app's Google keys; select the project that holds the OAuth client.",
    "Go to APIs and Services, then Credentials.",
    "Under OAuth 2.0 Client IDs, click the Web-application client whose Client ID matches the GOOGLE_CLIENT_ID in the deployment's environment variables.",
    "Under Authorized redirect URIs, add both spellings:",
]
for s_ in steps:
    story.append(Paragraph("\u2022  %s" % s_, S["bullet"]))
story.append(Paragraph("https://reflectme.space/api/auth/google/callback", S["code"]))
story.append(Paragraph("https://www.reflectme.space/api/auth/google/callback", S["code"]))
body(story, "Then, under Authorized JavaScript origins, add https://reflectme.space and "
     "https://www.reflectme.space. Save, wait about five minutes for Google to spread the change, and try "
     "again in a fresh incognito window.")
h2(story, "The three traps")
bullets(story, [
    "Exact spelling: https, no trailing slash, path /api/auth/google/callback (not /api/auth/callback/google - that is another framework's path).",
    "Matching keys: the GOOGLE_CLIENT_ID in the deployment must come from the same client that was edited; compare the strings if in doubt.",
    "Test users: if Google later says access blocked - app not verified, publish the OAuth consent screen or add the keeper's email under Test users.",
])

# ================================================================ PART 8
h1(story, "Part 8 - External Configuration Checklist and Current State")

h2(story, "What only the keeper can do")
make_table(story,
    ["Configuration", "Where", "State"],
    [["Register the two Google callback URIs", "Google Cloud Console, Credentials", "waiting on the keeper"],
     ["Publish the OAuth consent screen (or add test users)", "Google Cloud Console, OAuth consent screen", "waiting on the keeper"],
     ["Set production env vars (AUTH_SECRET, APP_URL, ADMIN_EMAIL, GOOGLE_*, STRIPE_*, GEMINI_API_KEY)", "Vercel, Settings, Environment Variables", "waiting on the keeper"],
     ["Create the Stripe webhook endpoint and live keys", "Stripe Dashboard, Developers, Webhooks", "waiting on the keeper"],
     ["Redeploy after main moves", "Vercel", "each deploy is a hand-turn"],
     ["Point reflectme.space DNS at the deployment", "the domain's registrar", "assumed standing"]],
    [0.44, 0.34, 0.22],
    caption="Table 8-1: the keeper's own checklist")
h2(story, "The house's current state")
make_table(story,
    ["Measure", "Value"],
    [["Repository main", "688579e (one truth with the workspace)"],
     ["Archive branch", "archive/yielding-portal (the stale portal, safe forever)"],
     ["App health", "HTTP 200 on the landing; verified at 1280px and 390px"],
     ["Directive progress", "Phase 1 standing; the music vault standing; Phases 2-4 remaining"],
     ["Known scars", "the 3.9GB OOM (tamed by the turbo memory limit); the flaky dev server (restart recipe in Part 6)"]],
    [0.30, 0.70],
    caption="Table 8-2: the state of the house at the writing of this prompt")

# ================================================================ APPENDIX
story.append(PageBreak())
h1(story, "Appendix - The Gallery")

body(story, "The house's faces: the threshold and its menus as they stand, then the artwork plates - the walk's "
     "chapters, the worlds' sigils, the catalogued civilizations, the codex's fauna, the open-contact "
     "timeline, and the about chambers. Every plate lives in the repository under public/images.")

story.append(Spacer(1, 8))
h2(story, "The house as it stands")
gallery_grid(story, [
    (os.path.join(TMP, "pdf-shot-landing.png"), "The threshold - the docked chamber, desktop"),
    (os.path.join(TMP, "pdf-shot-create-menu.png"), "The Create menu pouring the five makers"),
    (os.path.join(TMP, "pdf-shot-scopes.png"), "The Scopes menu pouring the five fields"),
    (os.path.join(TMP, "pull-verify-mobile.png"), "The threshold on a phone (390px) - one purse, one column"),
], cols=2)

story.append(Spacer(1, 6))
h2(story, "The walk's chapters")
gallery_grid(story, [
    (os.path.join(IMGDIR, "walk/root-396.jpg"), "root-396"),
    (os.path.join(IMGDIR, "walk/lyran-432.jpg"), "lyran-432"),
    (os.path.join(IMGDIR, "walk/heart-528.jpg"), "heart-528"),
    (os.path.join(IMGDIR, "walk/communion-639.jpg"), "communion-639"),
    (os.path.join(IMGDIR, "walk/clearing-741.jpg"), "clearing-741"),
    (os.path.join(IMGDIR, "walk/insight-852.jpg"), "insight-852"),
], cols=3)

h2(story, "Sigils of the worlds")
gallery_grid(story, [
    (os.path.join(IMGDIR, "sigils/world-akashic-light.png"), "the Akashic records"),
    (os.path.join(IMGDIR, "sigils/world-dreambook-light.png"), "the living book"),
    (os.path.join(IMGDIR, "sigils/world-invent-light.png"), "the forge"),
    (os.path.join(IMGDIR, "sigils/world-lightcodes-light.png"), "the light codes"),
    (os.path.join(IMGDIR, "sigils/world-manifest-light.png"), "the manifesting"),
    (os.path.join(IMGDIR, "sigils/world-mirroros-light.png"), "the Mirror OS"),
], cols=3)

h2(story, "Catalogued civilizations")
gallery_grid(story, [
    (os.path.join(IMGDIR, "entities/civ-andromedan-001.jpg"), "Andromedan"),
    (os.path.join(IMGDIR, "entities/civ-aquatic-reptilian-001.jpg"), "Aquatic reptilian"),
    (os.path.join(IMGDIR, "entities/int-archangels-001.jpg"), "Intelligences - archangels"),
    (os.path.join(IMGDIR, "entities/ant-hollow-choir.jpg"), "Formic - the Hollow Choir"),
    (os.path.join(IMGDIR, "entities/ant-gravelight-concord.jpg"), "Formic - the Gravelight Concord"),
    (os.path.join(IMGDIR, "entities/ant-collectors-of-the-second-sorrow.jpg"), "Collectors of the Second Sorrow"),
], cols=3)

h2(story, "The codex's fauna")
gallery_grid(story, [
    (os.path.join(IMGDIR, "biology/fauna-01.jpg"), "fauna 01"),
    (os.path.join(IMGDIR, "biology/fauna-04.jpg"), "fauna 04"),
    (os.path.join(IMGDIR, "biology/fauna-07.jpg"), "fauna 07"),
    (os.path.join(IMGDIR, "biology/fauna-10.jpg"), "fauna 10"),
], cols=4)

h2(story, "The open-contact timeline")
gallery_grid(story, [
    (os.path.join(IMGDIR, "timeline/open-contact-000.jpg"), "plate 000"),
    (os.path.join(IMGDIR, "timeline/open-contact-001.jpg"), "plate 001"),
    (os.path.join(IMGDIR, "timeline/open-contact-002.jpg"), "plate 002"),
    (os.path.join(IMGDIR, "timeline/open-contact-003.jpg"), "plate 003"),
], cols=2)

h2(story, "The about chambers")
gallery_grid(story, [
    (os.path.join(IMGDIR, "about/about-akashic.png"), "the Akashic chamber"),
    (os.path.join(IMGDIR, "about/about-council.png"), "the council"),
    (os.path.join(IMGDIR, "about/about-civilizations.png"), "the civilizations"),
], cols=3)

# ------------------------------------------------------------------ build
out = "/home/z/my-project/.pdfbuild/replication_body.pdf"
doc = TocDocTemplate(out, pagesize=A4,
                     leftMargin=LM, rightMargin=RM, topMargin=TM, bottomMargin=BM,
                     title=DOC_TITLE, author="Z.ai", creator="Z.ai",
                     subject="Full replication prompt for the reflectme.space Mirror Entity")
doc.multiBuild(story, onFirstPage=header_footer, onLaterPages=header_footer)
print("BODY OK:", out)
