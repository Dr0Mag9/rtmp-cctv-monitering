import type { Request, Response } from 'express';
import { z } from 'zod';
import * as adminService from '../services/admin.service.js';
import { sendError } from '../utils/responses.js';
import { logger } from '../utils/logger.js';

const createAgentSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(256),
  extension: z.string().max(32).optional(),
  assignedNumber: z.string().max(64).optional(),
});

const updateAgentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  extension: z.string().max(32).optional(),
  assignedNumber: z.string().max(64).optional(),
});

export async function dashboard(_req: Request, res: Response) {
  const stats = await adminService.getDashboardStats();
  return res.json(stats);
}

export async function listAgents(_req: Request, res: Response) {
  const agents = await adminService.listAgents();
  return res.json(agents);
}

export async function createAgent(req: Request, res: Response) {
  const parsed = createAgentSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'Invalid agent data: ' + parsed.error.issues.map(i => i.message).join(', '));
  }
  try {
    const user = await adminService.createAgent(parsed.data);
    return res.status(201).json(user);
  } catch (e: any) {
    logger.error('createAgent', { message: e instanceof Error ? e.message : String(e) });
    // Prisma unique constraint violation (duplicate email)
    if (e?.code === 'P2002') {
      return sendError(res, 409, 'An agent with this email already exists.');
    }
    return sendError(res, 400, 'Failed to create agent');
  }
}

export async function updateAgent(req: Request, res: Response) {
  const parsed = updateAgentSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'Invalid agent data');
  }
  try {
    const agent = await adminService.updateAgent(req.params.id, parsed.data);
    if (!agent) return sendError(res, 404, 'Agent not found');
    return res.json(agent);
  } catch (e) {
    logger.error('updateAgent', { message: e instanceof Error ? e.message : String(e) });
    return sendError(res, 400, 'Failed to update agent');
  }
}

export async function toggleAgentStatus(req: Request, res: Response) {
  try {
    const updated = await adminService.toggleAgentStatus(req.params.id);
    if (!updated) return sendError(res, 404, 'Agent not found');
    return res.json(updated);
  } catch (e) {
    logger.error('toggleAgentStatus', { message: e instanceof Error ? e.message : String(e) });
    return sendError(res, 400, 'Failed to toggle agent status');
  }
}

export async function agentActivity(req: Request, res: Response) {
  try {
    const data = await adminService.getAgentActivity(req.params.id);
    return res.json(data);
  } catch (e) {
    logger.error('agentActivity', { message: e instanceof Error ? e.message : String(e) });
    return sendError(res, 400, 'Failed to fetch agent activity');
  }
}
