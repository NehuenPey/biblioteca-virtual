const express = require("express");

const router = express.Router();

const libros = require("../data/libros");

router.get("/", (req, res) => {

    res.json(libros);

});


router.get("/:id", (req, res) => {

    const { id } = req.params;

    const libro = libros.find(
        (libro) => libro.id === id
    );


    if (!libro) {

        return res.status(404).json({
            error: "Libro no encontrado"
        });

    }


    res.json(libro);

});


module.exports = router;