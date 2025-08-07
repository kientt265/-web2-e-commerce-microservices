"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = require("dotenv");
const client_1 = require("@prisma/client");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
(0, dotenv_1.config)();
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const port = process.env.AUTH_PORT || 3001;
app.use(express_1.default.json());
app.use('/api/auth', authRoutes_1.default);
app.get('/', (req, res) => {
    res.send('Auth Service is running');
});
app.listen(port, async () => {
    console.log(`Auth Service is running on port ${port}`);
});
process.on('SIGTERM', async () => {
    console.log('Shutting down Auth Service...');
    await prisma.$disconnect();
    process.exit(0);
});
