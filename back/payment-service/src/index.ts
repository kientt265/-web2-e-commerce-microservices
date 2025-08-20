import express from "express";
import cors from "cors";


const app = express();
app.use(cors());
app.use(express.json());

const port = 3006;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});