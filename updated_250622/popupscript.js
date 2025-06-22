const securos = require('securos');
const express = require('express');
const app = express();
const port = 5000;
app.use(express.json());
securos.connect(async function(core){
    console.log("SECUROS CONNECTED")
    app.get('/getCamName', async (req, res) => {
        const id = req.query.Id;
        //console.log(id);
        if (!id) {
            return res.status(400).json({ error: 'ID de cámara no proporcionado' });
        }
        try {
            let camName = await core.getObject("CAM",id); 
            console.log(camName.name);
            res.send(camName.name);
        } catch (error) {
            console.error('Error consultando cámara:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    });
});
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
