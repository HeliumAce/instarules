# Rules Markdown Format Guide

Reference guide for converting game rulebooks into the markdown format used by InstaRules. Based on patterns established in the Arcs game files.

## Directory Structure

Each game gets a folder under `src/data/games/` using the game's slug (matching `id` in `games.ts`):

```
src/data/games/{game-slug}/
  {game_slug}_rules.md              # Main rulebook (required for full-context games)
  {game_slug}_rules_{variant}.md    # Expansion/variant rules
  {game_slug}_cards_{variant}.md    # Card reference data
  {game_slug}_faq_{variant}.md      # FAQ & clarifications
  {game_slug}_cards_errata.md       # Card errata
  {game_slug}_cards_faq.md          # Card-specific FAQ
```

**Naming**: Folder uses kebab-case (`brass-lancashire`), files use snake_case (`brass_lancashire_rules.md`). This is because `RulesService.ts` derives the file name via `gameId.replace(/-/g, '_')`.

## Retrieval Strategies

Games are configured in `games.ts` → `gameRetrievalConfig`:

- **`full-context`**: The entire `*_rules.md` file is loaded raw and passed to the LLM. Good for single-rulebook games. Heading structure is important for LLM navigation.
- **`vector-search`**: Content is chunked and stored in a vector DB for semantic search. Used for games with many source files.
- **`hybrid`**: Combination of both approaches.

---

## Rules File Format (`*_rules.md`)

This is the primary format. For `full-context` games, this is the only file the LLM sees.

### Structure

```markdown
# Game Name Rules

## SECTION NAME (Page X)

Section content here. Describe the rules clearly and completely.

### SUBSECTION NAME (Page X)

More detailed rules within the section.

#### SUB-SUBSECTION (Page X)

Finest level of detail.
```

### Conventions

1. **H1** (`#`): Document title — one per file (e.g., `# Base Game Rules`)
2. **H2** (`##`): Major sections — use UPPERCASE for section names, include page reference (e.g., `## SETUP (Page 4)`)
3. **H3** (`###`): Subsections within major sections (e.g., `### 1. SET UP TABLE (Page 4)`)
4. **H4** (`####`): Fine-grained subsections (e.g., `#### SHIPS (15) (Page 2)`)
5. **Page markers**: Use `## Page X` as dividers between rulebook pages when page context is important
6. **Page references**: Include `(Page X)` in headings to enable source tracing
7. **Lists**: Use numbered lists for sequential steps, bullet lists for non-ordered items
8. **Bold**: Use `**bold**` for key game terms, important rule callouts, and emphasis
9. **Italic**: Use `*italic*` for flavor text, ability names, or card names when inline
10. **Content fidelity**: Transcribe rules faithfully from the source. Do not paraphrase or summarize — the LLM does that at query time

### Example

```markdown
# Brass Lancashire Rules

## OVERVIEW (Page 2)

Brass: Lancashire is an economic strategy game set during the Industrial Revolution.
The game is played over two eras: the Canal Era and the Rail Era.

## SETUP (Page 4)

### 1. PREPARE THE BOARD (Page 4)

1. Place the board in the center of the table.
2. Shuffle the location cards and deal them to each player.
3. Each player takes a player mat and places their income marker on the 10 space.

### 2. PLAYER SETUP (Page 5)

#### STARTING MONEY (Page 5)

Each player begins with £30.
```

---

## FAQ File Format (`*_faq_*.md`)

```markdown
# Game Name FAQ

*Last Updated: Month Day, Year*
*Version: Base Game*
*Source: Official Publisher FAQ*

Brief description of what this FAQ covers.

## Errata

**Rulebook, Page X, Section Name:** Corrected text here.
*Explanation of why this was changed.*

## Clarifications

### Topic Name

Clarification text explaining a commonly misunderstood rule.

### Another Topic

**Q:** Question text?
**A:** Answer text.
```

---

## Card File Format (`*_cards_*.md`)

```markdown
# Game Name Cards

## Card Name (ID: GAME-CARDID)

Card ability text and description.

*Version: Base*
*Type: Card Type*
*Suit: Suit Name*
```

### Conventions

- Each card gets an H2 heading with an ID for cross-referencing
- Card metadata in italics below the card text
- Ability text uses **bold** for keywords and *italic* for clarifications

---

## Card Errata Format (`*_cards_errata.md`)

```markdown
# Card Errata

## Card Name
**Errata:**
- Description of the correction or change.
```

---

## Tips for PDF-to-Markdown Conversion

1. **Preserve structure**: Match the rulebook's section hierarchy as closely as possible
2. **Include page numbers**: Always tag headings with `(Page X)` for traceability
3. **Tables**: Convert rulebook tables to markdown tables where possible; fall back to formatted lists if tables are complex
4. **Examples**: Include gameplay examples from the rulebook — these are valuable for LLM rule interpretation
5. **Diagrams/Images**: Describe any diagram content in text (e.g., "The board shows 5 regions connected as follows: ...")
6. **Cross-references**: When the rulebook says "see page X", include the actual text rather than just the reference where practical
7. **Component lists**: Include component/piece lists — users often ask "what comes in the box?"
8. **Index/Glossary**: Include these at the end; they help the LLM map terms to sections
