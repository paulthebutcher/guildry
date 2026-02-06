# Guildry UI Standards

Quick reference for UI patterns and Tailwind usage.

## Styling Approach

- **Tailwind only** - no custom CSS files except `globals.css`
- **No inline styles** - use Tailwind classes
- **Start simple** - HTML + Tailwind first, extract components when reused 3+ times

## Color System

### Accent Colors (Product-Specific)

Use for features, brands, or sections:

- `accent-scout` - #b45309 (amber/orange)
- `accent-compass` - #4f46e5 (indigo)
- `accent-blueprint` - #0d9488 (teal) - **Primary brand color**
- `accent-bench` - #dc2626 (red)
- `accent-relay` - #7c3aed (purple)
- `accent-retro` - #db2777 (pink)
- `accent-proof` - #059669 (green)

### Neutrals

Use Tailwind's `slate` scale for everything else:
- Text: `text-slate-900` (dark), `text-slate-600` (medium), `text-slate-500` (subtle)
- Backgrounds: `bg-white`, `bg-slate-50`, `bg-slate-100`
- Borders: `border-slate-200`, `border-slate-300`

## Spacing Scale

Use Tailwind's spacing consistently:
- **4** (1rem): Tight spacing, icon gaps
- **6** (1.5rem): Default gaps between elements
- **8** (2rem): Section padding (small)
- **12** (3rem): Section padding (medium)
- **16** (4rem): Section padding (large)
- **24** (6rem): Major section dividers

## Typography

- **Body text**: Default (font-sans), `text-base` or `text-sm`
- **Headings**: `text-2xl font-bold`, `text-xl font-semibold`, etc.
- **Code/Data**: `font-mono text-sm`
- **Labels**: `text-sm font-medium text-slate-700`

```tsx
<h1 className="text-3xl font-bold text-slate-900">Page Title</h1>
<p className="text-base text-slate-600">Body text</p>
<code className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">code</code>
```

## Components

### Buttons

```tsx
// Primary (use accent-blueprint)
<button className="bg-accent-blueprint text-white px-4 py-2 rounded-lg hover:opacity-90">
  Primary Action
</button>

// Secondary
<button className="bg-slate-200 text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-300">
  Secondary
</button>

// Ghost
<button className="text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-100">
  Ghost
</button>
```

### Cards

```tsx
<div className="bg-white border border-slate-200 rounded-lg p-6">
  <h3 className="text-lg font-semibold mb-4">Card Title</h3>
  <p className="text-slate-600">Card content</p>
</div>
```

### Forms

**Labels above inputs, errors below:**

```tsx
<div className="space-y-2">
  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
    Email
  </label>
  <input
    id="email"
    type="email"
    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blueprint"
  />
  {error && (
    <p className="text-sm text-red-600">{error}</p>
  )}
</div>
```

## States

### Loading (Skeleton)

```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
</div>
```

### Empty States

```tsx
<div className="flex flex-col items-center justify-center py-12">
  <p className="text-slate-500 text-center mb-4">
    No items found
  </p>
  <button className="text-accent-blueprint hover:underline">
    Create your first item
  </button>
</div>
```

### Error States

```tsx
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
  <p className="text-red-800">Something went wrong</p>
</div>
```

### Success States

```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-4">
  <p className="text-green-800">Success!</p>
</div>
```

## Layout Patterns

### Container

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Items */}
</div>
```

### Stack (Vertical Spacing)

```tsx
<div className="space-y-6">
  {/* Vertically stacked items */}
</div>
```

## Responsive Design

- **Mobile first**: Start with mobile, use `md:` and `lg:` for larger screens
- **Breakpoints**: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`

```tsx
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>
```

## Accessibility

- **Always include** proper labels for inputs
- **Use semantic HTML**: `<button>` not `<div onClick>`
- **Focus states**: Default Tailwind focus rings are good
- **Alt text** for images
- **ARIA labels** when visual labels aren't present
