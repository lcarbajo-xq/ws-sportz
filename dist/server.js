import cors from "cors";
import express from "express";
const app = express();
const port = 3005;
app.use(cors());
app.use(express.json());
app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Servidor funcionando correctamente"
    });
});
app.listen(port, () => {
    console.log(`Servidor ejecutándose en: http://localhost:${port}`);
});
