import { prisma } from './prisma'
import { isWorkspaceRole } from './workspace-roles'

export * from './workspace-roles'

export async function getWorkspaceMembership(workspaceId: string, userId: string) {
  const membership = await prisma.membership.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true, workspaceId: true },
  })

  if (!membership || !isWorkspaceRole(membership.role)) return null

  return { role: membership.role, workspaceId: membership.workspaceId }
}

export async function getDecisionMembership(decisionId: string, userId: string) {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    select: {
      id: true,
      workspaceId: true,
      workspace: {
        select: {
          memberships: {
            where: { userId },
            select: { role: true },
          },
        },
      },
    },
  })

  if (!decision) return null

  const role = decision.workspace.memberships[0]?.role
  if (!role || !isWorkspaceRole(role)) return null

  return { decisionId: decision.id, workspaceId: decision.workspaceId, role }
}
