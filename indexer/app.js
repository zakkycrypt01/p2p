import dotenv from 'dotenv';
import express,{json} from 'express';
import cors from 'cors';

import userRouter from './routes/useRouter.js';

dotenv.config();

const corsOptions = {
    origin: true,
    credentials: true,
    preflightContinue: true,
};
const app = express();
app
    .use(cors(corsOptions))
    .use(json())
    .use("/api", userRouter);
export default app;
