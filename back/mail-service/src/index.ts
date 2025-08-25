//TODO: 1 handle mail-service, nhận event từ order gửi mail cho người dùng
//TODO: 2 Viết swagger cho các service
//TODO: 3 Xong 2 TODO này thì viết tiếp E2EE cho chat-app
//TODO: 4 Viết lại summary CV
import express from 'express';
import {config} from 'dotenv';
config();
const app = express();
const port = process.env.MAIL_PORT || 3007;

app.use(express.json());
// app.use('/', )
app.get('/run', (req, res) => {
    res.send('Mail Service is running');
})

app.use('*', (req: express.Request, res: express.Response) => {
    res.status(404).json({ error: 'Route not found' });
});
