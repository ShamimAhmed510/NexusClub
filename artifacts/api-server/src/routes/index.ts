import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import clubsRouter from "./clubs";
import eventsRouter from "./events";
import noticesRouter from "./notices";
import dashboardRouter from "./dashboard";
import usersRouter from "./users";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(clubsRouter);
router.use(eventsRouter);
router.use(noticesRouter);
router.use(dashboardRouter);
router.use(usersRouter);
router.use(storageRouter);

export default router;
