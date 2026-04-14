import { prisma } from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';

export async function getDashboardStats() {
  const totalAgents = await prisma.agent.count();
  const onlineAgents = await prisma.agent.count({ where: { status: 'ONLINE' } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const inboundCallsToday = await prisma.call.count({
    where: { direction: 'INBOUND', startedAt: { gte: today } },
  });
  const outboundCallsToday = await prisma.call.count({
    where: { direction: 'OUTBOUND', startedAt: { gte: today } },
  });
  const missedCalls = await prisma.call.count({
    where: { status: 'MISSED', startedAt: { gte: today } },
  });
  const activeCalls = await prisma.call.count({
    where: { status: { in: ['DIALING', 'RINGING', 'CONNECTED', 'ON_HOLD'] } },
  });

  return {
    totalAgents,
    onlineAgents,
    inboundCallsToday,
    outboundCallsToday,
    missedCalls,
    activeCalls,
  };
}

export function listAgents() {
  return prisma.agent.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, status: true, isActive: true } },
    },
    orderBy: { user: { createdAt: 'desc' } },
  });
}

export async function createAgent(data: {
  name: string;
  email: string;
  password: string;
  extension?: string;
  assignedNumber?: string;
}) {
  const passwordHash = await hashPassword(data.password);
  // Normalize optional fields: empty strings → undefined (stored as NULL)
  const extension = data.extension?.trim() || undefined;
  const assignedNumber = data.assignedNumber?.trim() || undefined;
  return prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      passwordHash,
      role: 'AGENT',
      isActive: true,       // Explicit — never rely on DB default
      status: 'OFFLINE',    // Explicit — never rely on DB default
      agent: {
        create: {
          extension,
          assignedNumber,
        },
      },
    },
    include: { agent: true },
  });
}

export async function updateAgent(
  agentId: string,
  data: { name?: string; email?: string; extension?: string; assignedNumber?: string },
) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return null;

  return prisma.agent.update({
    where: { id: agentId },
    data: {
      extension: data.extension,
      assignedNumber: data.assignedNumber,
      user: {
        update: {
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(data.email !== undefined && { email: data.email.trim().toLowerCase() }),
        },
      },
    },
    include: { user: true },
  });
}

export async function toggleAgentStatus(agentId: string) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId }, include: { user: true } });
  if (!agent) return null;
  return prisma.user.update({
    where: { id: agent.userId },
    data: { isActive: !agent.user.isActive },
  });
}

export async function getAgentActivity(agentId: string) {
  const calls = await prisma.call.findMany({
    where: { agentId },
    orderBy: { startedAt: 'desc' },
    take: 10,
    include: { client: true, disposition: true },
  });
  const tasks = await prisma.clientTask.findMany({
    where: { agentId },
    orderBy: { dueAt: 'desc' },
    take: 10,
    include: { client: true },
  });
  return { calls, tasks };
}
