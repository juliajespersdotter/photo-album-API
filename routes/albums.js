const express = require('express');
const router = express.Router();
const albumController = require('../controllers/album_controller');
// const validBooks = require('../validation/book');

/* Get all resources */
router.get('/', albumController.index);

/* Get a specific resource */
router.get('/:albumId', albumController.show);

/* Store a new resource */
router.post('/', albumController.store);

/* Update a specific resource */
router.put('/:albumId', albumController.update);

/* Add multiple photos to album */
router.post('/:albumId/photos', albumController.addPhoto)

/* Delete an album */
router.delete('/:albumId', albumController.destroy);

/* Delete a photo from an album */
router.delete('/:albumId/photos/:photoId', albumController.destroyPhoto);

module.exports = router;