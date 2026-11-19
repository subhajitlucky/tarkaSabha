# Decision extraction eval

A small, directional evaluation of Tarka Sabha's decision extraction contract.

## What it measures

- **Label recall** — of the labeled decisions, how many a candidate matched.
- **Accepted precision** — of the accepted candidates, how many matched a label.
- **Raw citation validity** — of the model's quotes, how many appear in the cited snapshot before enforcement.
- **Accepted citation validity** — the same check after the parser drops paraphrases.
- **Unsupported claims admitted** — accepted candidates with no verified quote.
- **Refusal accuracy** — negative sources that returned no candidates.

## Dataset

Three public repositories, six labeled decisions each, plus one negative source per repository.

| Repo | Commit | Focus |
|---|---|---|
| `honojs/hono` | `75ff8e3` | runtime portability, routing, dependencies, middleware, TypeScript |
| `drizzle-team/drizzle-orm` | `3bcb6a2` | ORM architecture, database support, serverless deployment, schema declaration, migrations |
| `fastapi/fastapi` | `05e6df7` | type-driven schemas, OpenAPI docs, validation, dependency injection |

Labels and source snapshots are in `dataset.json`. Matching is lexical: candidate titles and proposals are compared to the label title and its `matchTerms`. This is not a substitute for human review.

## Run

```bash
EVAL_OPENROUTER_API_KEY=... npm run eval:decisions
```

The runner uses `openai/gpt-4o-mini` through OpenRouter by default. Override with `EVAL_MODEL`.

It writes `results.json`; the `/benchmark` page renders that file at build time. The deployed page does not call a model.

## Limits

- Eighteen labels is a directional signal, not a representative benchmark.
- Lexical matching can miss a correct decision phrased differently.
- Public READMEs are not production repositories.
- The eval measures extraction from bounded snapshots, not runtime behavior or application authorization.
- Raw citation validity is the model's behavior before the parser; accepted validity is the product contract.
