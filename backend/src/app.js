import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { routes } from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

export const app = express();

app.disable('x-powered-by');
if (env.trustProxy) app.set('trust proxy', env.trustProxy);
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);
