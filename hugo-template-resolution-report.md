# Hugo template resolution: what changed in 0.146.0 and how it broke this site

**Incident:** CI build failure on 2026-10-20 ([run 39351474416](https://github.com/cmahnke/briefsteller/actions/runs/39351474416/job/118396388478)), Hugo `0.168.0` (pinned in `.github/workflows/gh-pages.yml`).

```
WARN  Template /term.iiif-collection.json is unused, source "…/themes/projektemacher-base/layouts/_default/term.iiif-collection.json"
ERROR error building site: render: [de v1.0.0 guest] failed to render pages: render of
"…/themes/projektemacher-base/content/meta/_index.en.md" failed:
"…/themes/projektemacher-base/layouts/_default/single.codemeta.json:2:28":
execute of template failed: … at <merge (dict "@id" (.OutputFormats.Get "codemeta").Permalink)>:
error calling merge: destination must be a map, got <nil>
```

## TL;DR

1. Hugo v0.146.0 replaced the entire template lookup machinery (PR [gohugoio/hugo#13541](https://github.com/gohugoio/hugo/pull/13541), "Reimplement and simplify Hugo's template system"). The rewrite is **documented**, but one of its consequences is not: templates are now also matched to pages by **media type**, not only by output format *name*. That made `_default/single.codemeta.json` (media type `application/json`) silently take over every page render in the built-in `json` output format.
2. This site configured `[outputs] page = ["HTML", "JSON"]`, so every regular page had a JSON render.
3. The theme's codemeta pipeline produces no output for pages without software metadata — but its "not found" branch used `errorf`, which **logs an error and continues execution** with an empty result. The empty result became `nil`, and Hugo's `merge` treats the piped value as the **destination** map → `destination must be a map, got <nil>`.
4. The `WARN … is unused` line is unrelated and benign: the optional `term.iiif-collection.json` template is simply never selected because no term page enables the `iiif-collection` output format. The warning is printed because CI passes `--printUnusedTemplates`.

## What changed in Hugo v0.146.0 (documented)

Sources: ["New template system in Hugo v0.146.0"](https://gohugo.io/templates/new-templatesystem-overview/), [PR #13541](https://github.com/gohugoio/hugo/pull/13541) (merged 2025-04-06), [Discourse announcement](https://discourse.gohugo.io/t/documentation-of-the-new-template-system-in-hugo-v0-146-0/54686).

| Change | Note |
| --- | --- |
| `layouts/_default/` removed | Mapped for backwards compatibility — this is why the theme's `layouts/_default/…` files still resolve |
| `partials/` → `_partials/`, `shortcodes/` → `_shortcodes/` | Also back-compat mapped |
| Unified, weighted template lookup for pages, shortcodes, render hooks, base templates | Identifiers: custom `layout` > page kind (`home`, `page`, `section`, `taxonomy`, `term`) > standard layouts (`list`, `single`) > output format > `all` > language > **media type** > page path > `type` |
| New `all` catch-all layout | |
| `_internal/` embedded templates removed | |
| Kind → template fallback chains | `page` → `page.html` → `single.html` → `all.html`; `section` → `section.html` → `list.html` → `all.html` |

The docs list **media type** as a weighted lookup identifier, but do not spell out the consequence below.

## The undocumented part: media-type-tolerant matching

In Hugo's source (checked at `87bf585`, 2026-10-19, `tpl/tplimpl/templatedescriptor.go:135-152`):

- A template whose output-format **name** differs from the page's output format is still considered a match when the **media types are equal**. The only comment is an inline example ("home page in amp output format … finds a template for the html output format").
- Template kind and layout from `_default/` templates act as wildcards (`templatedescriptor.go:114-124`).
- Output-format/media-type synthesis from template filenames: a template named `single.codemeta.json` registers the output format name `codemeta` with the media type derived from the suffix `json` — even if no `[outputFormats.codemeta]` is configured (`tpl/tplimpl/templatestore.go:1776-1806`, `resolveOutputFormatAndOrMediaType`).

**Consequence for this repo:** with `page = ["HTML", "JSON"]`, every regular page rendered a JSON output. The lookup chain for `json` renders found no `page.json`/`single.json`, but — thanks to media-type equality (`application/json` == `application/json`) — it selected the theme's `single.codemeta.json`, a template that was intended to be enabled explicitly via `[outputFormats.codemeta]` + `outputs` front matter. The template then executed for *all* of those pages, including the theme's own `content/meta/` pages (`about`, `privacy`, `meta/_index.en`, …), where no `CITATION.cff` or `codemeta` URL exists.

## The crash chain in `single.codemeta.json`

```go-html-template
{{- $codeMeta := (partial "metadata/codemeta/codemeta.json" .)  | transform.Unmarshal (dict "format" "json")  -}}
{{- $codeMeta = $codeMeta | merge (dict "@id" (.OutputFormats.Get "codemeta").Permalink) -}}
{{- $codeMeta | jsonify -}}
```

1. `metadata/codemeta/codemeta.json` finds no `codemeta` URL param and no `CITATION.cff` page resource → hits `errorf "[metadata/codemeta.json] CITATION.cff not found …"`. `errorf` **logs an ERROR and returns `""` — execution continues** (`tpl/fmt/fmt.go:61-66`). The partial outputs an empty string.
2. `transform.Unmarshal` of `""` yields `nil` → `$codeMeta` is nil.
3. Hugo's `merge` docs say "merges two or more maps from left to right", but the implementation (`tpl/collections/merge.go:30-46`) builds the result from the **last** parameter — which for a pipe is the **piped value** — and merges the preceding parameters into it. `nil | merge (dict …)` therefore means *destination* = `nil` → `error calling merge: destination must be a map, got <nil>`.
4. Because the pipe also reverses the intended direction, and because no site in this project defines `[outputFormats.codemeta]`, the `@id` key would never have been set even on a successful run.

Side quirk found while fixing: `{{with …}}…{{else if …}}` is **not** supported by Go's template parser (Hugo fork: `tpl/internal/go_templates/texttemplate/parse/parse.go:576-583` — `{{else if}}` is special-cased only after `{{if}}`, `{{else with}}` only after `{{with}}`) and fails with `unexpected <if> in input`.

## The unused-template WARN

`hugo --printUnusedTemplates` (flag present since ~v0.111, used by CI) prints templates that were never executed. After the 0.146 rewrite, "used" is determined by the new template store's execution tracking. The theme ships optional templates for output formats a site may enable — e.g. `term.iiif-collection.json` for IIIF collections on term pages. This site enables `iiif-collection` only on the home page (`content/_index.md` front matter), so the term template is legitimately unused here and the warning is informational only.

## Fixes

**This repo** (`hugo.toml`): `page = ["HTML"]` — the JSON page outputs produced nothing of value (no page has software metadata, nothing links to the files), while the site's real JSON endpoints (`/meta/tags/index.json`, `/meta/wikidata/index.json`, `/meta/posts/index.json`, …) are driven by per-page `outputs: [json]` front matter and are unaffected.

**Theme** (`themes/projektemacher-base`, submodule):

- `layouts/_default/single.codemeta.json`: nil-safe (skip empty results), guard `.OutputFormats.Get "codemeta"`, and fix the merge direction (`merge $codeMeta (dict "@id" …)`).
- `layouts/partials/metadata/codemeta/codemeta.json`: a page without software metadata is normal — return empty instead of `errorf` (keep `errorf` when an explicit `cfffile` param points at a missing file); fix the accidental 3-argument `merge` in the keywords branch; replace `{{with $cff}}…{{else if}}` with `{{if $cff}}…{{else if}}` (parser restriction above).

## Lessons for theme templates under the new lookup system

- A template whose media type matches a *common* output format (`json`, `html`, `rss`, `xml`) will silently take over renders of that format when no more specific template exists — templates for opt-in output formats must be nil-safe by design.
- `merge`'s destination is the piped value; write `merge $dst (dict …)` without a pipe.
- `errorf` does not abort template execution — always follow it with a controlled return path.
- `{{else if}}` only works directly after `{{if}}` (and `{{else with}}` after `{{with}}`).

## References

- Hugo docs: [New template system in Hugo v0.146.0](https://gohugo.io/templates/new-templatesystem-overview/)
- PR: [gohugoio/hugo#13541](https://github.com/gohugoio/hugo/pull/13541)
- `collections.Merge` docs: [gohugo.io/functions/collections/merge](https://gohugo.io/functions/collections/merge/)
- Source (master @ `87bf585`, 2026-10-19): `tpl/tplimpl/templatedescriptor.go`, `tpl/tplimpl/templatestore.go`, `tpl/collections/merge.go`, `tpl/fmt/fmt.go`, `tpl/internal/go_templates/texttemplate/parse/parse.go`
- Local verification: Hugo `0.168.0+extended` reproduced the exact CI error on this repo in a sandbox build before the fix.
