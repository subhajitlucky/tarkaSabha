const DECISIONS = [
  { id: 'DEC-012', title: 'Use PostgreSQL as primary database', area: 'Infrastructure', risk: 'Medium', status: 'Reviewed' },
  { id: 'DEC-014', title: 'Migrate from REST to GraphQL', area: 'Architecture', risk: 'Low', status: 'In review' },
  { id: 'DEC-019', title: 'Adopt Kubernetes for production', area: 'DevOps', risk: 'Medium', status: 'Open' },
  { id: 'DEC-021', title: 'Use Redis for session caching', area: 'Infrastructure', risk: 'Low', status: 'Reviewed' },
]

export function ProductPreview() {
  return (
    <div className="relative border border-[#dce5e0] bg-white text-[#101714] shadow-[0_30px_90px_-44px_rgba(20,35,28,0.38)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#e3eae6] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center bg-[#0f5b43] font-display text-xs text-white">
            त
          </span>
          <span className="text-sm font-semibold">Tarka Sabha</span>
        </div>
        <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-[#7d8983]">
          Demo workspace
        </span>
      </div>

      <div className="grid grid-cols-[7rem_1fr]">
        <div className="border-r border-[#e3eae6] bg-[#f8faf9] p-3">
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-[#7d8983]">Workspace</p>
          <p className="mt-2 text-xs font-semibold">Project Kestrel</p>
          <div className="mt-4 space-y-1">
            {['Overview', 'Decisions', 'Evidence', 'Dossier', 'Team'].map((item, index) => (
              <div
                key={item}
                className={
                  index === 0
                    ? 'border-l-2 border-[#0f5b43] bg-[#e8f2ed] px-2 py-1.5 text-[0.65rem] font-medium text-[#0f5b43]'
                    : 'px-2 py-1.5 text-[0.65rem] text-[#65716b]'
                }
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-[#e3eae6] pt-3">
            <p className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-[#7d8983]">Team</p>
            <div className="mt-2 flex -space-x-1">
              {['AR', 'SP', 'MK'].map((initials) => (
                <span
                  key={initials}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-[#dfece6] font-mono text-[0.45rem] text-[#0f5b43]"
                >
                  {initials}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Project Kestrel</h2>
                <span className="border border-[#b7d4c8] bg-[#e8f2ed] px-1.5 py-0.5 font-mono text-[0.45rem] uppercase tracking-[0.1em] text-[#0f5b43]">
                  In diligence
                </span>
              </div>
              <p className="mt-1 text-[0.62rem] text-[#65716b]">Payments infrastructure · Bengaluru · Series C</p>
            </div>
            <span className="border border-[#dce5e0] px-2 py-1 text-[0.55rem] text-[#65716b]">Share</span>
          </div>

          <div className="mt-3 flex gap-4 border-b border-[#e3eae6] text-[0.58rem]">
            {['Overview', 'Decisions', 'Evidence', 'Dossier'].map((tab, index) => (
              <span
                key={tab}
                className={
                  index === 0
                    ? 'border-b-2 border-[#0f5b43] pb-2 font-medium text-[#0f5b43]'
                    : 'pb-2 text-[#7d8983]'
                }
              >
                {tab}
              </span>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              ['24', 'Decisions'],
              ['186', 'Evidence'],
              ['7', 'Open questions'],
              ['78%', 'Dossier'],
            ].map(([value, label]) => (
              <div key={label} className="border border-[#e3eae6] p-2">
                <p className="text-lg leading-none">{value}</p>
                <p className="mt-1 text-[0.48rem] text-[#7d8983]">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 border border-[#e3eae6]">
            <div className="flex items-center justify-between border-b border-[#e3eae6] px-2 py-1.5">
              <p className="text-[0.58rem] font-medium">Recent decisions</p>
              <span className="text-[0.5rem] text-[#0f5b43]">View all</span>
            </div>
            {DECISIONS.slice(0, 3).map((decision) => (
              <div key={decision.id} className="flex items-center gap-2 border-b border-[#eef3f0] px-2 py-1.5 last:border-b-0">
                <span className="font-mono text-[0.45rem] text-[#7d8983]">{decision.id}</span>
                <span className="min-w-0 flex-1 truncate text-[0.55rem]">{decision.title}</span>
                <span className="text-[0.45rem] text-[#7d8983]">{decision.risk}</span>
                <span className="border border-[#dce5e0] px-1 py-0.5 text-[0.42rem] text-[#65716b]">{decision.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
