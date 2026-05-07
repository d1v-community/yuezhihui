# FlowSense UI (Taro)

This folder contains the app's **foundation components** for Taro (H5 + weapp),
aligned with the root `DESIGN.md`:

- Calm / Scientific / Minimal / Warm neutral
- Motion like **breathing** (soft, continuous, meaningful; never flashy)

## Design Tokens

Source of truth:
- `apps/app/src/styles/ui.less` (colors + spacing + motion tokens + mixins)
- `apps/app/src/app.less` (global typography normalization + global motion helpers)

Notes:
- Inputs keep `font-size: 16px` to avoid iOS Safari zoom-on-focus.
- Press feedback uses `hoverClass="fc-pressed"` so it works consistently in weapp.

## Components

Import from:

```ts
import {
  FCActionBar,
  FCButton,
  FCChip,
  FCCodeInput,
  FCNotice,
  FCOptionCard,
  FCProgress,
  FCPickerField,
  FCTextButton,
  FCTextField,
} from '../../ui'
```

### FCPressable
- Purpose: unify "press" feedback for any clickable surface (cards/chips/rows).
- Uses: `hoverClass` (weapp) + subtle scale/brightness (H5).

### FCButton
- Variants: `primary | secondary | ghost`
- States: `disabled`, `loading`
- Layout: `fullWidth`, `size: sm | md | lg`
- Motion: subtle press; loading shows spinner (non-blocking).

### FCTextButton
- For secondary actions (e.g. "重新发送", "修改邮箱", "复制").
- Looks like a calm pill, not a loud link.

### FCTextField
- Label + helper/error line; focus ring uses warm-neutral accent.
- For numbers, set `type="number"`.

### FCCodeInput
- 6-digit code input with a **large hit area** and reliable focus on mobile.
- `autoFocus` recommended after a successful "send code".

### FCOptionCard
- Single/multi option UI (checkbox-like mark + press feedback).
- Keep padding symmetric and visuals quiet.

### FCChip
- Tag/pill UI for filters and meta options (unknown/no_answer).

### FCPickerField
- Picker trigger that looks like an input, not a raw picker.

### FCProgress
- Progress row + progress bar with smooth width transition.

### FCActionBar
- Sticky bottom bar with safe-area padding and blur.
- Use for primary task completion actions on mobile.

### FCNotice
- Inline recovery messaging (not aggressive red errors).
- Use wording from `DESIGN.md`: "数据暂时无法保存，但你的记录还在".

## Motion Guidelines

- Use `fc-appear` on primary cards/containers for page-enter.
- Keep duration slow-ish (300–400ms) and easing soft (`cubic-bezier(0.2,0.8,0.2,1)`).
- Avoid bounce/overshoot; the product should feel like "flow", not "game UI".
