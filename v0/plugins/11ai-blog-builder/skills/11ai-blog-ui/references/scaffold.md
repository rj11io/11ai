# 11ai editorial UI scaffold snippets

Use these class patterns when applying the optional 11ai visual add-on. Do not change data contracts or routes to satisfy these snippets.

## Root and theme

```tsx
<html
  lang="en"
  data-scroll-behavior="smooth"
  suppressHydrationWarning
  className={cn(
    "scroll-smooth antialiased motion-reduce:scroll-auto",
    fontMono.variable,
    "font-sans",
    inter.variable,
  )}
>
  <body>
    <ThemeProvider>{children}</ThemeProvider>
  </body>
</html>
```

Use `data-scroll-behavior="smooth"` only when the app applies smooth scrolling on `<html>` and the framework requires the route-transition marker.

## Library page shell

```tsx
<main className="min-h-svh bg-background">
  <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-16">
    <header className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 size-80 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.24em] text-primary uppercase">
          Editorial library
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">
          Ideas for more attentive work and everyday life.
        </h1>
      </div>
    </header>
  </div>
</main>
```

## Content and layout controls

```tsx
<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
  <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
    Content
  </span>
  <div
    className="inline-flex rounded-full border border-border bg-muted/50 p-1"
    aria-label="Content type"
  >
    {contentTypes.map((type) => (
      <Link
        key={type}
        href={createContentHref(type, searchParams)}
        aria-current={contentType === type ? "page" : undefined}
        className={
          contentType === type
            ? "rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm"
            : "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        }
      >
        {type}
      </Link>
    ))}
  </div>
</div>
```

```tsx
<div
  className="inline-flex h-11 rounded-xl border border-border bg-muted/50 p-1"
  aria-label="Result layout"
>
  <button
    type="button"
    aria-label="List view"
    aria-pressed={viewMode === "list"}
    className="rounded-lg px-3 transition aria-pressed:bg-background aria-pressed:shadow-sm"
  />
  <button
    type="button"
    aria-label="Card view"
    aria-pressed={viewMode === "cards"}
    className="rounded-lg px-3 transition aria-pressed:bg-background aria-pressed:shadow-sm"
  />
</div>
```

## Result card pattern

```tsx
<article className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-lg hover:shadow-foreground/5">
  <Link
    href={href}
    className="block h-full rounded-2xl p-5 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6"
  >
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">
        New
      </span>
      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
        Tag
      </span>
    </div>
    <h2 className="mt-2 text-xl font-semibold tracking-tight text-card-foreground group-hover:text-primary sm:text-2xl">
      Result title
    </h2>
    <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
      Result description.
    </p>
  </Link>
</article>
```

Keep one semantic link surface per result. If filterable tags must be clickable, render them outside the result link.

## Publication and post metadata

Render dates from `created` and optional `updated`:

```tsx
<time dateTime={item.created}>Created {formatDate(item.created)}</time>;
{
  item.updated && item.updated !== item.created ? (
    <time dateTime={item.updated}>Updated {formatDate(item.updated)}</time>
  ) : null;
}
```

Post headers should include publication pill, title, excerpt, linked author byline, dates, read time, and tags.

## Author surfaces

```tsx
function AuthorAvatar({ author }: { author: AuthorListItem }) {
  if (author.avatar) {
    return (
      <Image
        src={author.avatar}
        alt=""
        width={64}
        height={64}
        className="size-12 rounded-full object-cover ring-1 ring-border"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/20"
    >
      {author.displayName}
    </span>
  );
}
```

Author pages use a two-column header on wider screens, tags under the bio, rounded external link pills, and attributed post rows with publication context and created dates.

## TOC surface

- Desktop: `sticky top-8 hidden lg:block`.
- Mobile: `details` / `summary` in `rounded-2xl border border-border bg-muted/30`.
- Links: left border, indentation by heading level, active state with primary border and foreground text.

## Acceptance

- Light and dark mode remain legible.
- Focus rings are visible for links, buttons, inputs, selects, and `summary`.
- No horizontal overflow on narrow screens.
- Reduced-motion users are not forced into custom smooth scrolling.
