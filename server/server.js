import express from "express";
import cors from "cors";

const app = express();
const port = 5000;

const corsOptions = {
    origin: ["http://localhost:5173"],
};
app.use(cors(corsOptions));

app.get("/api", (req, res) => {
    res.json({ fruits: ["apple", "orange", "banana"] });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});