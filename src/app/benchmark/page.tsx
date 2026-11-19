import type { Metadata } from 'next'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import Link from 'next/link'

type RepoResult = {
  id: string
  repo: string
  ref: string
  focus: string
  gold: number
  rawCandidates: number
  candidates: number
  matchedGold: number
  recall: number
  rawCitationValidity: number
  citationValidity: number
  unmatchedCandidates: number
  droppedCandidates: number
}

type BenchmarkResults = {
  generatedAt: string
  model: string
  provider: string
  dataset: { repos: number; decisions: number; negatives: number; version: number }
  metrics: {
    precision: number
    recall: number
    rawCitationValidity: number
    acceptedCitationValidity: number
    candidateSurvivalRate: number
    unsupportedClaimRate: number
    rawUnsupportedRate: number
    refusalAccuracy: number
    candidates: number
    rawCandidates: number
    droppedCandidates: number
    matchedDecisions: number
    decisions: number
    rawCitations: number
    rawValidCitations: number
    acceptedCitations: number
    acceptedValidCitations: number
    refusalCorrect: number
    refusalTotal: number
  }
  repos: RepoResult[]
}

export const metadata: Metadata = {
  title: 'Decision extraction benchmark — Tarka Sabha',
  description:
    'A small public evaluation of decision extraction: label recall, citation validity, unsupported claims, and refusal on three open-source repositories.',
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function loadResults(): BenchmarkResults {
  const file = path.join(process.cwd(), 'benchmarks/decision-extraction/results.json')
  return JSON.parse(readFileSync(file, 'utf8')) as BenchmarkResults
}

export default function BenchmarkPage() {
  const results = loadResults()
  const metrics = results.metrics

  return (
    <div>
      <section className="border-b border-line bg-bg">
        <div className="mx-auto grid max-w-[88rem] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-end lg:px-10 lg:py-20">
          <div>
            <p className="eyebrow">Evaluation</p>
            <h1 className="mt-4 max-w-2xl text-5xl leading-[0.98] tracking-[-0.04em] text-text sm:text-6xl">
              Decision extraction, measured.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
              A small public eval of the extraction contract. The model proposes candidates. The
              parser verifies every quote against the snapshot and drops anything that does not
              match. Nothing enters the record until a human confirms it.
            </p>
          </div>
          <div className="border border-line bg-surface p-5">
            <p className="eyebrow">Run</p>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Model</dt>
                <dd className="font-mono text-xs text-text">{results.model}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Provider</dt>
                <dd className="font-mono text-xs text-text">{results.provider}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Dataset</dt>
                <dd className="font-mono text-xs text-text">
                  v{results.dataset.version} · {results.dataset.repos} repos ·{' '}
                  {results.dataset.decisions} labels
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Run at</dt>
                <dd className="font-mono text-xs text-text">
                  {results.generatedAt.slice(0, 10)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-[88rem] gap-3 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-5 lg:px-10">
          {[
            ['Label recall', percent(metrics.recall), `${metrics.matchedDecisions} of ${metrics.decisions} labeled decisions`],
            ['Accepted precision', percent(metrics.precision), `${metrics.candidates} accepted candidates`],
            ['Raw citation validity', percent(metrics.rawCitationValidity), 'model quotes before enforcement'],
            ['Accepted citation validity', percent(metrics.acceptedCitationValidity), 'quotes that entered the record'],
            ['Refusal accuracy', `${metrics.refusalCorrect}/${metrics.refusalTotal}`, 'negative sources returned nothing'],
          ].map(([label, value, detail]) => (
            <div key={label} className="border border-line bg-bg p-4">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                {label}
              </p>
              <p className="mt-3 text-3xl leading-none text-text">{value}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto max-w-[88rem] px-5 py-16 sm:px-8 lg:px-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">By repository</p>
              <h2 className="mt-3 text-3xl leading-tight text-text">Where it held, and where it missed.</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              Every accepted candidate passed the quote verifier. The misses are decisions the
              model did not propose, not unsupported claims it admitted.
            </p>
          </div>

          <div className="overflow-x-auto border border-line bg-surface">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line font-mono text-[0.6rem] uppercase tracking-[0.12em] text-subtle">
                  <th className="px-4 py-3 font-normal">Repository</th>
                  <th className="px-4 py-3 font-normal">Gold</th>
                  <th className="px-4 py-3 font-normal">Raw</th>
                  <th className="px-4 py-3 font-normal">Accepted</th>
                  <th className="px-4 py-3 font-normal">Matched</th>
                  <th className="px-4 py-3 font-normal">Recall</th>
                  <th className="px-4 py-3 font-normal">Raw quotes</th>
                  <th className="px-4 py-3 font-normal">Accepted quotes</th>
                </tr>
              </thead>
              <tbody>
                {results.repos.map((repo) => (
                  <tr key={repo.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-text">{repo.repo}</p>
                      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
                        {repo.focus}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted">{repo.gold}</td>
                    <td className="px-4 py-4 text-sm text-muted">{repo.rawCandidates}</td>
                    <td className="px-4 py-4 text-sm text-muted">{repo.candidates}</td>
                    <td className="px-4 py-4 text-sm text-muted">{repo.matchedGold}</td>
                    <td className="px-4 py-4 text-sm text-text">{percent(repo.recall)}</td>
                    <td className="px-4 py-4 text-sm text-muted">
                      {percent(repo.rawCitationValidity)}
                    </td>
                    <td className="px-4 py-4 text-sm text-text">
                      {percent(repo.citationValidity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ['Candidates dropped', `${metrics.droppedCandidates} of ${metrics.rawCandidates}`, 'failed quote verification'],
              ['Unsupported claims admitted', percent(metrics.unsupportedClaimRate), 'zero after enforcement'],
              ['Candidate survival', percent(metrics.candidateSurvivalRate), 'raw candidates that passed'],
            ].map(([label, value, detail]) => (
              <div key={label} className="border border-line p-4">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-subtle">
                  {label}
                </p>
                <p className="mt-2 text-xl text-text">{value}</p>
                <p className="mt-1 text-xs text-muted">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-[88rem] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <div>
            <p className="eyebrow">Method</p>
            <h2 className="mt-3 text-3xl leading-tight text-text">Small sample, explicit limits.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Six calls total: three focused extraction runs and three negative runs. The model
              sees bounded file snapshots. Label matching is lexical, not human review.
            </p>
          </div>
          <div className="grid gap-4 text-sm leading-relaxed text-muted">
            <p>
              <strong className="text-text">Dataset.</strong> Three public repositories, six labeled
              decisions each, plus one negative source per repository. Labels and source commits
              are in the dataset file.
            </p>
            <p>
              <strong className="text-text">What is measured.</strong> Label recall is the share of
              labeled decisions a candidate matched. Accepted precision is the share of accepted
              candidates that matched a label. Raw citation validity checks the model’s quote
              against the snapshot before enforcement; accepted citation validity is after
              enforcement.
            </p>
            <p>
              <strong className="text-text">What this does not prove.</strong> It is not a
              representative sample, not a human-labeled precision study, and not a claim about
              runtime behavior. Eighteen labels is a directional signal. A miss is a missed
              decision, not a correctness failure.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/diligence" className="border border-line-strong px-3 py-2 font-mono text-xs text-text transition-colors hover:border-accent hover:text-accent">
                Read the sample dossier →
              </Link>
              <a
                href="https://github.com/subhajitlucky/tarkaSabha/tree/main/benchmarks/decision-extraction"
                className="border border-line px-3 py-2 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent"
              >
                Dataset and results →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="eyebrow">The contract</p>
            <h2 className="mt-3 max-w-2xl text-3xl leading-tight text-text">
              A candidate without a verified quote does not become evidence.
            </h2>
          </div>
          <Link href="/product" className="font-mono text-xs text-accent hover:text-accent-hover">
            How the model is constrained →
          </Link>
        </div>
      </section>
    </div>
  )
}
