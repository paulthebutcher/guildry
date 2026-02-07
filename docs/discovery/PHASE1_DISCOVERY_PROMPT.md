# Phase 1 Discovery Session

Use this prompt to start a new Cowork session. Spend 2-3 hours working through it conversationally. Save the output as a markdown file to bring back.

---

## Prompt to paste:

```
I'm building Guildry, a project intelligence platform for agencies/studios/consultancies. Phase 0 (auth, database, AI conversations, basic client management) is complete.

Before building Phase 1 (Blueprint, Bench, Retro), I want to properly define what these should do based on real experience, not assumptions.

My background is in UX. I want you to interview me to extract:
1. How I actually scope, staff, and review projects today
2. The vocabulary and mental models I use
3. Edge cases and things that don't fit neat boxes
4. What information actually matters vs. what seems theoretically useful

The three products we're defining:

**Blueprint** - Project scoping & estimation
- How do projects get defined?
- What makes estimation hard?
- What would help?

**Bench** - Team skills & staffing
- How do you know who can do what?
- How do you match people to projects?
- What constraints exist?

**Retro** - Project retrospectives
- What do you actually learn from finished projects?
- How does (or doesn't) that learning flow back to future estimates?

Please interview me one topic at a time. Ask follow-up questions. Push back if my answers are vague. Help me think through edge cases.

At the end, compile everything into a structured document with:
- Key insights per product
- Proposed data model (what we actually need to track)
- User flows (what the AI conversations should accomplish)
- Open questions to resolve

Let's start with Blueprint - how do I currently scope projects?
```

---

## Tips for the session

- **Be specific.** Instead of "we usually estimate in weeks," say "last month I scoped a rebrand for a fintech startup and guessed 6 weeks because..."

- **Include the messy stuff.** The project that went 3x over budget. The skill you can never find. The retro insight nobody acted on.

- **Think out loud.** If you're not sure about something, say so. "I'm not sure if we need to track X or if that's overkill" is useful signal.

- **Name real examples.** You don't have to share client names, but "the healthcare app project" is more useful than "a typical project."

- **Challenge the structure.** If Blueprint/Bench/Retro doesn't match how you think, say so. Maybe it's really two products, or four.

---

## What to bring back

Save the final compiled document as a file (markdown is fine) and share it in our next session. I'll use it to:

1. Revise the Phase 1 data model
2. Design the AI conversation flows
3. Create a lighter, more flexible build plan

Take your time - this thinking is more valuable than the code.
