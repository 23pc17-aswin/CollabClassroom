import { Router } from 'express';
import { checkRole } from '../middleware/rbac.js';
import multerUpload from '../utils/fileUpload.js';
import { uploadMaterial, getMaterials, downloadMaterial, deleteMaterial } from '../controllers/materialController.js';

const router = Router({ mergeParams: true });

router.get('/',                                         getMaterials);
router.post('/',  checkRole(['ADMIN','TEACHER']),        multerUpload.single('file'), uploadMaterial);
router.get('/:materialId/download',                     downloadMaterial);
router.delete('/:materialId', checkRole(['ADMIN','TEACHER']), deleteMaterial);

export default router;
