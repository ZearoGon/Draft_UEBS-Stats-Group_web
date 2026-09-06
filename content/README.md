# Site content

Everything the website shows about people, sessions and posts lives in this
folder as Markdown files with a YAML header ("frontmatter"). The pages are
generated from these files - **edit here, never in `index.html`, `assets/data.js`,
`topics/*.html` or `contributors.html`**, which are all build outputs.

```
content/
  site.json          hero photos, founding year, contact
  topics/*.md        the seven branches of the Research Atlas (+ the topic sub-pages)
  people/*.md        maintainers, contributors, members
  sessions/*.md      one file per session - lecture, workshop or discussion
  posts/*.md         blog posts, opportunities, announcements
```

After editing, run

```
npm run build:check   # validates the content and the build inputs, writes nothing
npm run build         # compiles content -> assets/data.js, topic pages, index.html
```

The build refuses anything that would break the site (unknown speaker, missing
PDF, bad date, a field without a colour) and anything that must never be
published (Teams links, passcodes).

## Adding a session

Create `content/sessions/YYYY-MM-DD-short-slug.md`:

```yaml
---
id: "20261016_Jane Doe_Topic Title"          # same name as the OneDrive folder
type: "session"
kind: "lecture"                              # lecture | workshop | discussion
status: "planned"                            # planned | held | postponed | cancelled
date: "2026-10-16"                           # always quoted, YYYY-MM-DD
start: "17:00"
end: "18:00"
venue: "Boardroom, 4th Floor, UEBS"
format: "hybrid"                             # in-person | online | hybrid
speakers: ["jane-doe"]                       # ids from content/people
title: "Topic Title: a longer subtitle"
short: "Topic"                               # 1-3 words, shown on the atlas leaf
topic: "stat"                                # core | stat | econ | asset | credit | ai | risk
also: ["econ"]                               # optional cross-listing on other topic pages
semester: "Autumn 2026"
materials:
  - {"label": "Slides", "file": "assets/talks/20261016_topic.pdf", "public": true}
summary: "One sentence for cards and the topic page."
---

The abstract, in Markdown. Usually the paragraph from the announcement email.
```

- `status: planned` puts the session in the Schedule filter and marks it
  *upcoming* on the atlas; change it to `held` afterwards.
- Slides go in `assets/talks/`. Set `"public": false` if the speaker has not
  agreed to publication - the file is then kept out of the site entirely.
- A guest brought in by a member: add `introduced_by: "member-id"` here and
  `introduced: "guest-id"` plus `introduced_date` on the member's file.
- `featured: true` (with an optional `cover`) also shows the session as a card
  in Posts.

## Adding a person

Create `content/people/first-last.md` (the file name is the id):

```yaml
---
id: "first-last"
initials: "FL"                 # unique, 2 letters, shown on the network
name: "First Last"
kind: "contributor"            # maintainer | contributor | member
level: "PhD"                   # Faculty | PhD | Visiting PhD - the roster shows "<level> <Maintainer|Contributor>"
order: 14                      # position in the roster
field: "Finance"               # must have a colour in the network - see KNOWN_FIELDS in scripts/content.mjs
topic: "One line of research interests"
email: ""                      # optional
new: true                      # shows the "New" tag in the roster
---

One or two sentences of biography.
```

Members who have joined but not presented yet use `kind: "member"` and a `slot`
(position on the ring, 0-7); their standing shows the level alone.
Their lecture list is derived automatically from the sessions they speak at.

## Adding a post (opportunity, announcement, blog)

Create `content/posts/YYYY-MM-DD-short-slug.md`:

```yaml
---
id: "20261001_short-slug"
type: "opportunity"            # blog | opportunity | announcement
category: "summer-school"      # conference | cfp | summer-school | seminar | workshop | hackathon | job | funding | volunteering | blog | announcement
date: "2026-10-01"             # the day it was shared
event_date: "2027-07-06"       # optional
deadline: "2026-12-01"         # optional - the card shows "Deadline …" and greys out afterwards
title: "Title as it should appear on the card"
source: "zexun-chen"           # who forwarded it (a person id), optional
link: "https://example.org/"   # the original announcement, optional
visual: "distribution"         # placeholder art when there is no cover: distribution | network | regression | breaks
summary: "One or two sentences for the card."
---

Longer text, in Markdown.
```

Never paste Teams links or passcodes anywhere - the build rejects them.

## Dates

Session dates are the day the session took place, not the day the email was
sent. Two sessions in 2024/25 are still unconfirmed; they carry
`date_verified: false` and a `date_note` until checked against the calendar.
