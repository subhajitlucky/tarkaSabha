import { Card, Rule } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/EmptyState'

const SECTIONS = [
  {
    heading: 'Why a council, not a chatbot',
    body: 'A single model asked a hard question gives you one pass at it, from one vantage point, with no way to tell a confident guess from a checked claim. Tarka Sabha splits the work: one agent gathers evidence, another attacks the weakest reasoning, a third consolidates. The disagreement is the point — it is what surfaces the parts of an answer that do not hold up.',
  },
  {
    heading: 'The Brahmodya Protocol',
    body: 'The orchestration layer. It decides who speaks next, what context each agent receives, which provider and model answers, and when a run has gone on long enough. Turns execute server-side, so a council keeps working after you close the tab.',
  },
  {
    heading: 'What the agents can actually do',
    body: 'Agents are not limited to what a model remembers. Granted tools let them search the web, read a specific page, and do exact arithmetic in a parser rather than in their head. Fetched content is treated as untrusted: it is passed back as tool output, never promoted into the system prompt.',
  },
  {
    heading: 'How the answer is chosen',
    body: 'A synthesis run drafts several candidate deliverables from deliberately different angles, grades each against a weighted rubric — grounding, coverage, decisiveness, honesty, fit — and keeps the winner. The runners-up are stored alongside it, with their scores, so you can see what was rejected and why.',
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <PageHeader
        eyebrow="About"
        title="Reasoning, held in public"
        lede="Tarka is Sanskrit for reasoned argument; sabhā is an assembly. The name is the specification: a place where positions are stated, tested against each other, and answered."
      />

      <div className="space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl text-text">{section.heading}</h2>
            <p className="mt-3 leading-relaxed text-muted">{section.body}</p>
          </section>
        ))}
      </div>

      <Card className="mt-12">
        <Rule label="On honesty" className="mb-4" />
        <p className="text-sm leading-relaxed text-muted">
          The platform is built to show its working rather than to sound certain. Every
          deliverable carries the score it earned and the reasoning behind that score.
          Where the evidence is thin, the agents are instructed to say so instead of
          inventing specifics — and the rubric penalises invention heavily under
          <span className="text-text"> grounding</span>.
        </p>
      </Card>
    </div>
  )
}
