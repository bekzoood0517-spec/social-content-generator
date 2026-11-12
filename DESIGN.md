# DESIGN — Social Content Generator

Companion to PRD.md and SPEC.md. Main goal: an interface that feels designed by a person, with none of the usual "made by a neural network" look.

> The 10 design questions were not answered, so every choice below is a deliberate assumption (see section 14). Each one is stored as a token or rule, so changing a decision means changing one value.

## 1. Design concept: "The editor's desk"
The app is a writer's desk, not a chatbot. Think paper, ink, proofs, and rubber stamps.

- Input is a **brief card** on the desk.
- Variants are **proof sheets** laid side by side, like clippings to choose from.
- Copying is **stamping** a proof as approved.
- History is a **ledger**: dated rows you can scan and copy from.

Personality: calm, confident, slightly editorial, quietly witty in microcopy. No hype.

## 2. Anti-"AI look" rules (the core of this document)
**Never use:**
- Purple-to-blue or pink gradients, gradient headlines, glowing borders, aurora/mesh backgrounds
- Glassmorphism, blur panels, neon shadows
- Sparkle, magic wand, robot, or brain icons; "AI-powered" badges; the word "magic"
- A centered hero with a big gradient title and a giant input pill
- Identical rounded cards with soft drop shadows in a three-column grid
- Bouncing three-dot typing indicator; pulsing orbs; shimmer-on-everything
- Emoji used as interface icons
- Default system-UI/Inter look with generic gray text on white
- Generic copy such as "Unlock the power of...", "Supercharge", "Seamlessly", "Let's get started!"

**Do instead:**
- Warm paper and ink colors, one sharp accent
- A serif for headings and generated text, a sans only for controls
- Asymmetric layout with a clear left-aligned grid
- Hairline borders and flat fills; shadows only for the one thing that lifts (a proof being dragged or hovered)
- Slight, deliberate imperfection: tiny rotations on stamps, a ruled-paper texture, an ink-style caret
- Plain, specific microcopy written like a human editor

## 3. Color tokens
One accent only. Everything else is paper and ink.

### Light ("paper")
| Token | Value | Use |
|-------|-------|-----|
| `--paper` | `#F6F1E7` | page background |
| `--paper-raised` | `#FBF8F1` | cards, proofs |
| `--ink` | `#1C1A17` | primary text |
| `--ink-soft` | `#5B5650` | secondary text |
| `--rule` | `#D9D1C0` | hairlines, borders |
| `--accent` | `#D8431F` | primary button, stamp, focus, caret |
| `--accent-ink` | `#FFF7F2` | text on accent |
| `--highlight` | `#F3DD8A` | text selection, "just copied" marker |
| `--error` | `#9B1C1C` | errors (text + icon, never color alone) |

### Dark ("night desk")
| Token | Value |
|-------|-------|
| `--paper` | `#171512` |
| `--paper-raised` | `#201D19` |
| `--ink` | `#EFE9DC` |
| `--ink-soft` | `#A59E91` |
| `--rule` | `#37322B` |
| `--accent` | `#F0643F` |
| `--accent-ink` | `#1A0F0A` |
| `--highlight` | `#5A4C1A` |
| `--error` | `#F08A8A` |

Rules: no pure black or pure white; contrast for body text ≥ 7:1, for secondary text ≥ 4.5:1. Theme follows the system setting and has a manual switch (light, dark, system).

### Network marks (no brand logos)
Each network gets a small neutral typographic tag, not an official logo or brand color. Telegram: `TG`, Instagram: `IG`, YouTube: `YT`, set in the mono font inside a hairline rectangle. The selected one fills with `--ink`. This keeps the interface cohesive and avoids brand-color clutter.

## 4. Typography
All free (Google Fonts), self-hosted in production for speed and privacy.

| Role | Font | Notes |
|------|------|-------|
| Display and generated post text | **Newsreader** (variable, optical size) | Editorial serif; generated posts read like printed copy |
| Interface (labels, buttons, inputs) | **Instrument Sans** | Compact, slightly characterful sans |
| Hashtags, counters, timestamps, network tags | **IBM Plex Mono** | Gives "typesetter's notes" feel |

Scale (rem, base 16px): 0.75 / 0.875 / 1 / 1.125 / 1.5 / 2.25 / 3.5.

- Page title: Newsreader, 3.5rem desktop / 2.25rem mobile, weight 500, tight tracking (-0.02em), left-aligned, no gradients.
- Post title inside a proof: Newsreader 1.5rem, weight 600.
- Post body: Newsreader 1.125rem, line-height 1.6, max width 60ch.
- Labels: Instrument Sans 0.875rem, sentence case (no all-caps, except mono tags).
- Numbers and counters use tabular figures.

## 5. Shape, borders, depth, texture
- Corners: **2px** on inputs and buttons, **0px** on proofs (paper has corners), 999px only for small tags.
- Borders: 1px hairline `--rule`. Active elements get a 2px `--ink` underline or border, not a glow.
- Shadows: none by default. A hovered or dragged proof gets one hard offset shadow: `4px 4px 0 var(--rule)` (flat, not blurred).
- Texture: a very light paper grain (SVG noise at 3–4% opacity) on `--paper`; and faint ruled lines inside the brief input (every 28px), aligned to text baseline.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 40 / 64.

## 6. Layout

### Desktop (≥ 1024px): two columns, asymmetric
- Left column (≈ 38%, sticky): **Brief card**. Page title, textarea, network picker, tone and language, Generate button, angle chips.
- Right column (≈ 62%): **Proofs**. Variants stacked vertically or in horizontal columns (2–3), each one full post.
- History: a slide-over **ledger** from the right (button "Ledger" in the top bar), not a permanent sidebar.

### Tablet (640–1023px)
Single column: brief on top (collapsible after generation to a one-line summary), proofs below, in a horizontally scrollable strip with snap.

### Mobile (< 640px)
- Brief first, then proofs one at a time with swipe/snap between them and a small `1 / 3` mono indicator.
- Copy buttons stay thumb-reachable at the bottom of each proof.
- History opens as a full-screen sheet.

### Top bar
Wordmark in Newsreader (text only, no logo icon), then "Ledger" and the theme switch. 56px tall, bottom hairline.

## 7. Components

### Brief card
- Large textarea with ruled-line background, placeholder written as an example, such as "A small bakery in Tashkent launching a Friday sourdough drop."
- Counter in mono, bottom right: `124 / 1000`.
- No floating labels; a plain label above.

### Network picker
Three rectangular segments side by side: tag (`TG`), name, one short line of what it produces ("Short, direct, link-friendly"). Selected: ink fill, paper text. Radio-group semantics, arrow keys supported.

### Tone and language
- Tone: four text options as a segmented control.
- Language: a quiet select, defaulting to English.

### Angle chips (pre-generation)
Suggestions appear under the input as small rectangular chips with a hairline border, fading in one by one. Selected chip has an `--ink` underline. Section label: "Angles worth trying".

### Generate button
- Solid `--accent`, `--accent-ink` text, 2px radius, 48px tall, label "Write the posts".
- Pressed: moves 1px down; no glow, no gradient.
- While generating it becomes "Stop" (ink outline).

### Proof (variant card)
- Raised paper, hairline border, a small top strip: `Proof 1` (mono) and the angle name.
- Blocks, each separated by a dotted rule and labeled in the margin in mono: `TITLE`, `TEXT`, `CTA`, `TAGS`.
- Each block has its own small "Copy" text button, visible on hover and always visible on touch.
- Footer: primary "Copy post" button, plus "Rewrite this one" and "Edit" as text buttons.
- Editing: the block becomes a plain editable area with a 2px ink underline.

### Hashtags
Mono text, each tag as plain text with the `#` in `--accent`. Click toggles removal (strikethrough), so users can drop tags before copying.

### Ledger (history)
- Rows, not cards: date (mono) · network tag · first line of the title · one-click "Copy" at the right.
- Grouped by day with a small date heading.
- Row click expands the full post inline; delete is a quiet text button with confirmation.
- Search field on top, hairline underline.

### Toasts
Tiny rectangular notes bottom-left, mono text, auto-dismiss after 2.5s. Used only for things not visible elsewhere (for example "Ledger cleared").

## 8. Motion
**Principle:** motion explains what happened, then gets out of the way. Short, calm, mostly opacity and small translation. No bounce, no elastic, no infinite loops except the waiting caret.

### Tokens
| Token | Value |
|-------|-------|
| `--dur-fast` | 120ms |
| `--dur-base` | 220ms |
| `--dur-slow` | 420ms |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |

### Key moments
1. **Pre-generation angles:** chips fade up 6px, staggered by 60ms, `--dur-base`.
2. **Press Generate:** the brief card compresses slightly (summary line on tablet/mobile); proof sheets slide in from the right, 16px, staggered by 90ms.
3. **Waiting (before first token):** each proof shows its ruled lines drawing in one by one (a quiet skeleton made of ruled lines, not a shimmer), and a single ink-style caret (a 2px accent bar) blinking at 1s intervals. Optional line under the brief: "Drafting three angles..." in plain text.
4. **Streaming text:** line-by-line reveal. Each new line fades in over 160ms with a 4px upward settle. Characters are not typed one by one; this reads as set type, not a toy typewriter. The caret sits at the end of the active line. Fields complete in order: title, text, CTA, tags. Rate adapts to arrival speed through the buffer in SPEC.md, max about 60 chars/sec. A small "Show all" text button skips the animation.
5. **Copy (the stamp):** pressing "Copy post" shows a flat accent stamp reading `COPIED`, rotated -4°, that lands on the proof corner (scale 1.15 → 1, 140ms, `--ease-out`), then fades after 1.5s. The button label also changes to "Copied" for the same time. Per-block copy flashes the block with `--highlight` for 400ms.
6. **History row copy:** the row background flashes `--highlight` and the button reads "Copied".
7. **Ledger open/close:** slides from the right 24px with fade, `--dur-slow`.
8. **Theme switch:** colors cross-fade in 200ms, no sweeping animation.
9. **Errors:** the affected proof gets a 2px `--error` left border and a plain-language message with a "Try again" text button; no shake.

### Reduced motion
With `prefers-reduced-motion: reduce`: no slides, no stagger, no stamp rotation; fields appear complete per block with a 100ms fade; caret does not blink; copy confirmation is text only.

## 9. Microcopy (voice: a calm editor)
| Place | Copy |
|-------|------|
| Page title | "What are we posting about?" |
| Placeholder | "A small bakery in Tashkent launching a Friday sourdough drop." |
| Generate | "Write the posts" |
| Waiting | "Drafting three angles..." |
| Empty proofs | "Nothing on the desk yet. Describe your idea and pick a network." |
| Empty ledger | "No posts yet. Anything you write lands here." |
| Copied | "Copied" |
| Error | "That didn't go through. Try again, or shorten the brief." |
| Blocked | "This brief tripped a safety filter. Try rewording it." |
| Rate limit | "Too many requests in a row. Try again in 40 seconds." |

Rules: sentence case, no exclamation marks, no emoji, no "AI" wording in the interface except where truly needed (settings, footer credit).

## 10. Iconography
- Very few icons. Use text buttons wherever possible.
- When needed: 1.5px stroke, square caps, 16/20px, drawn in a single consistent set (copy, trash, edit, close, search). No filled icons, no sparkles.
- Icons never appear alone for primary actions; they carry a text label or an accessible name.

## 11. Accessibility
- Visible focus: 2px `--accent` outline with 2px offset on every interactive element.
- Touch targets ≥ 44×44px.
- Streaming region is `aria-live="polite"` and announces completed fields only.
- Copy confirmation announced via a visually hidden live region.
- Color is never the only signal (errors have text and icon; selected network has fill and checkmark role).
- Fully keyboard operable, including network picker, variants (left/right keys), and ledger.

## 12. Implementation notes
```css
:root {
  --paper: #F6F1E7;
  --paper-raised: #FBF8F1;
  --ink: #1C1A17;
  --ink-soft: #5B5650;
  --rule: #D9D1C0;
  --accent: #D8431F;
  --accent-ink: #FFF7F2;
  --highlight: #F3DD8A;
  --error: #9B1C1C;

  --font-display: 'Newsreader', Georgia, serif;
  --font-ui: 'Instrument Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  --dur-fast: 120ms;
  --dur-base: 220ms;
  --dur-slow: 420ms;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper: #171512; --paper-raised: #201D19; --ink: #EFE9DC;
    --ink-soft: #A59E91; --rule: #37322B; --accent: #F0643F;
    --accent-ink: #1A0F0A; --highlight: #5A4C1A; --error: #F08A8A;
  }
}
:root[data-theme="dark"] { /* same dark values */ }

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```
- Preload Newsreader and Instrument Sans; use `font-display: swap`.
- Stamp is a CSS-only element (border, mono text, rotation), no image assets.
- Paper grain is an inline SVG data URI to avoid extra requests.

## 13. "Does it look like AI?" review checklist
Run this before every release:
- [ ] No gradients anywhere (buttons, text, backgrounds)
- [ ] No sparkle/robot/brain icons or "AI" badges in the main flow
- [ ] Only one accent color is visible on screen
- [ ] Headings and post text are in the serif; controls are in the sans
- [ ] Cards are not all identical rounded boxes with soft shadows
- [ ] No bouncing dots, glowing pulses, or looping decorative animation
- [ ] Copy reads like a person, with no hype words
- [ ] Layout is asymmetric and left-aligned, not a centered hero
- [ ] Screenshots with the logo hidden could not be mistaken for a generic AI template

## 14. Assumptions made in place of the 10 questions
| # | Topic | Assumed default |
|---|-------|-----------------|
| 1 | Mood | Calm and editorial, warm paper feel |
| 2 | Theme | Light and dark with a switch, following system |
| 3 | Color | One vermilion accent on warm paper/ink, no gradients |
| 4 | Typography | Serif for headings and posts, clean sans for controls, mono for notes |
| 5 | Shapes | Near-sharp corners, hairline borders, flat hard shadows only on hover |
| 6 | Layout | Two asymmetric columns on desktop, stacked on mobile, history as slide-over ledger |
| 7 | Network choice | Typographic tags (`TG`, `IG`, `YT`) in a segmented control, no brand logos |
| 8 | Text streaming | Line-by-line fade with an ink caret, skip button |
| 9 | Animation level | Subtle; stamp on copy is the one expressive moment; waiting state is ruled lines plus caret |
| 10 | References and avoid | Reference feel: printed editorial/notebook; avoid: generic AI-tool templates |

To change any of these, edit the matching token or rule above; the rest of the system follows.
