import { Router, type IRouter } from "express";
import healthRouter from "./health";
import receiptsRouter from "./receipts";
import extractRouter from "./extract";

const router: IRouter = Router();

router.use(healthRouter);
router.use(receiptsRouter);
router.use(extractRouter);

export default router;
