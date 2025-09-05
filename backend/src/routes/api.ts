import { Router } from 'express';
import organizationsRouter from './organizations';
import userClientsRouter from './userClients';
import projectsRouter from './projects';
import milestonesRouter from './milestones';
import deliverablesRouter from './deliverables';
import documentsRouter from './documents';
// Nouvelles routes Lots 4-5
import ticketsRouter from './tickets';
import invoicesRouter from './invoices';
import toolsRouter from './tools';

const router = Router();

// Monter les routes des organisations
router.use('/orgs', organizationsRouter);

// Monter les routes des utilisateurs clients (nested routes)
router.use('/orgs/:orgId/users', userClientsRouter);

// Monter les routes des projets (nested routes)
router.use('/orgs/:orgId/projects', projectsRouter);

// Monter les routes des jalons (nested routes)
router.use('/projects/:id/milestones', milestonesRouter);

// Monter les routes des livrables
router.use('/deliverables', deliverablesRouter);

// Monter les routes des documents (nested routes)
router.use('/orgs/:orgId/docs', documentsRouter);

// Monter les nouvelles routes Lots 4-5
router.use('/tickets', ticketsRouter);
router.use('/invoices', invoicesRouter);
router.use('/tools', toolsRouter);

export default router;