const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/salesController');

const ADMIN = ['super_admin', 'admin'];
const MANAGER = ['super_admin', 'admin', 'sales_manager'];
const FINANCE = ['super_admin', 'admin', 'finance'];
const ANY_SALES = ['super_admin', 'admin', 'sales_manager', 'finance', 'sales_rep'];

// All routes require auth
router.use(authMiddleware);

// --- Rep self-service ---
router.get('/me', authorize(...ANY_SALES), ctrl.getMyProfile);

// --- Rep CRUD ---
router.post('/reps', authorize(...MANAGER), ctrl.createRep);
router.get('/reps', authorize(...ANY_SALES), ctrl.listReps);
router.get('/reps/:id', authorize(...ANY_SALES), ctrl.getRep);
router.patch('/reps/:id', authorize(...MANAGER), ctrl.updateRep);
router.delete('/reps/:id', authorize(...MANAGER), ctrl.deactivateRep);
router.get('/reps/:id/restaurants', authorize(...ANY_SALES), ctrl.listRestaurantsForRep);

// --- Restaurant attribution ---
router.post('/attribution', authorize(...MANAGER), ctrl.assignRestaurant);

// --- Statements ---
// NOTE: list exporter BEFORE :id route to avoid shadowing
router.get('/statements/export.csv', authorize(...FINANCE), ctrl.exportCsv);
router.post('/statements/generate', authorize(...MANAGER), ctrl.generateStatements);
router.get('/statements', authorize(...ANY_SALES), ctrl.listStatements);
router.get('/statements/:id', authorize(...ANY_SALES), ctrl.getStatement);
router.post('/statements/:id/adjustments', authorize(...MANAGER), ctrl.addAdjustment);
router.post('/statements/:id/manager-approve', authorize(...MANAGER), ctrl.managerApprove);
router.post('/statements/:id/finance-lock', authorize(...FINANCE), ctrl.financeLock);
router.post('/statements/:id/mark-paid', authorize(...FINANCE), ctrl.markPaid);
router.post('/statements/:id/reopen', authorize(...FINANCE), ctrl.reopenStatement);

module.exports = router;
