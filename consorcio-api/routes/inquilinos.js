const express = require('express');
const router = express.Router();
const Inquilino = require('../models/inquilino');
const Consorcio = require('../models/consorcio'); // Necesario para actualizar el consorcio
// Si estás utilizando middleware de autenticación, descoméntalo y asegúrate de que esté configurado
// const auth = require('../middleware/auth'); 

// Obtener todos los inquilinos, con filtrado opcional por consorcioId
router.get('/', async (req, res) => {
    try {
        // Extrae el consorcioId de los parámetros de consulta (query string)
        const { consorcioId } = req.query;

        let query = {}; // Objeto de consulta inicial vacío

        // Si se proporciona un consorcioId, agrégalo a la consulta para filtrar
        if (consorcioId) {
            query.consorcio = consorcioId; // Filtra por el ID del consorcio
        }

        // Busca inquilinos en la base de datos aplicando el filtro, y popula el consorcio si es necesario
        const inquilinos = await Inquilino.find(query).populate('consorcio');
        res.json(inquilinos);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Error del servidor al obtener inquilinos.' });
    }
});

// Obtener un inquilino por ID (para la página de detalles/edición)
// Si usas autenticación, deberías añadirla aquí también: router.get('/:id', auth, async (req, res) => {
router.get('/:id', async (req, res) => {
    try {
        const inquilino = await Inquilino.findById(req.params.id).populate('consorcio');
        if (!inquilino) {
            return res.status(404).json({ msg: 'Inquilino no encontrado' });
        }
        res.json(inquilino);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de inquilino no válido.' });
        }
        res.status(500).send('Error del servidor al obtener el inquilino.');
    }
});

// Crear un nuevo inquilino
// Si usas autenticación, deberías añadirla aquí también: router.post('/', auth, async (req, res) => {
router.post('/', async (req, res) => {
    // Asegurarse de recibir el nuevo campo tipoUnidad
    const { nombre, email, telefono, unidad, tipoUnidad, consorcio } = req.body; 
    try {
        const nuevoInquilino = await Inquilino.create({
            nombre,
            email,
            telefono,
            unidad,
            tipoUnidad, // Incluimos el nuevo campo
            consorcio 
        });

        // Añadir el ID del inquilino al array de inquilinos del consorcio
        if (consorcio) {
            await Consorcio.findByIdAndUpdate(
                consorcio,
                { $push: { inquilinos: nuevoInquilino._id } },
                { new: true, useFindAndModify: false } 
            );
        }

        res.status(201).json(nuevoInquilino);
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) { // Error de email duplicado
            return res.status(400).json({ msg: 'El email ya está registrado para otro inquilino.' });
        }
        res.status(500).send('Error del servidor al crear inquilino.');
    }
});

// Actualizar un inquilino por ID
// Si usas autenticación, deberías añadirla aquí también: router.put('/:id', auth, async (req, res) => {
router.put('/:id', async (req, res) => {
    const { nombre, email, telefono, unidad, tipoUnidad, consorcio } = req.body; 
    try {
        let inquilino = await Inquilino.findById(req.params.id);

        if (!inquilino) {
            return res.status(404).json({ msg: 'Inquilino no encontrado para actualizar' });
        }

        // Si el consorcio del inquilino ha cambiado, necesitamos actualizar ambos consorcios
        if (consorcio && inquilino.consorcio && inquilino.consorcio.toString() !== consorcio) {
            // 1. Eliminar el inquilino del consorcio antiguo
            await Consorcio.findByIdAndUpdate(
                inquilino.consorcio,
                { $pull: { inquilinos: inquilino._id } },
                { new: true, useFindAndModify: false }
            );
            // 2. Añadir el inquilino al nuevo consorcio
            await Consorcio.findByIdAndUpdate(
                consorcio,
                { $push: { inquilinos: inquilino._id } },
                { new: true, useFindAndModify: false }
            );
        } else if (!inquilino.consorcio && consorcio) { // Si antes no tenía consorcio y ahora sí
             await Consorcio.findByIdAndUpdate(
                consorcio,
                { $push: { inquilinos: inquilino._id } },
                { new: true, useFindAndModify: false }
            );
        }

        // Actualizar los datos del inquilino
        inquilino.nombre = nombre;
        inquilino.email = email;
        inquilino.telefono = telefono;
        inquilino.unidad = unidad;
        inquilino.tipoUnidad = tipoUnidad; // Actualizar nuevo campo
        inquilino.consorcio = consorcio; 

        await inquilino.save(); 

        res.json(inquilino);
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) { // Error de email duplicado
            return res.status(400).json({ msg: 'El email ya está registrado para otro inquilino.' });
        }
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de inquilino o consorcio no válido para actualización.' });
        }
        res.status(500).send('Error del servidor al actualizar inquilino.');
    }
});

// Eliminar un inquilino por ID (asegúrate de que esta ruta no esté duplicada)
// Si usas autenticación, deberías añadirla aquí también: router.delete('/:id', auth, async (req, res) => {
router.delete('/:id', async (req, res) => {
    try {
        let inquilino = await Inquilino.findById(req.params.id);

        if (!inquilino) {
            return res.status(404).json({ msg: 'Inquilino no encontrado para eliminar.' });
        }

        const consorcioId = inquilino.consorcio;

        // Eliminar el inquilino de la base de datos
        await Inquilino.findByIdAndDelete(req.params.id);

        // Desasociar el inquilino del consorcio al que pertenecía
        if (consorcioId) {
            await Consorcio.findByIdAndUpdate(
                consorcioId,
                { $pull: { inquilinos: req.params.id } }, // Usa $pull para remover el ID del array
                { new: true, useFindAndModify: false }
            );
        }

        res.json({ msg: 'Inquilino eliminado con éxito.' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de inquilino no válido para eliminación.' });
        }
        res.status(500).send('Error del servidor al eliminar inquilino.');
    }
});

module.exports = router;
