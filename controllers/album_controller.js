/**
 * Album Controller
 */

 const debug = require('debug')('photo_album:album_controller');
 const models = require('../models');
 const {matchedData, validationResult } = require('express-validator');
 
 /**
  * Get all resources
  *
  * GET /
  */
 const index = async (req, res) => {
     // fetch user with related albums
	const user = await models.User.fetchById(req.user.user_id, { withRelated: ['albums'] });

    res.status(200).send({
        status: 'success',
        data: 
            user.related('albums'),
    });
 }
 
 /**
  * Get a specific resource
  *
  * GET /:albumId
  */
 const show = async (req, res) => {
    const albumId = req.params.albumId;

     // fetch user with related albums
    const user = await models.User.fetchById(req.user.user_id, { withRelated: ['albums'] });

    // find album in user album list
    const album = user.related('albums').find(album => album.id == albumId);

    if(!album){
        return res.status(404).send({
            status: 'fail',
            message: 'Album not found in database.'
        });
    }

    // fetch album with related photos
    const thisAlbum = await models.Album.fetchById(albumId, { withRelated: ['photos'] });

     res.send({
         status: 'success',
         data: 
            thisAlbum,
     });
 }
 
 /**
  * Store a new resource
  *
  * POST /
  */
 const store = async (req, res) => {
    // make sure the data is validated before post
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).send({ status : "fail", data: errors.array() });
    }

    // get valid data
    const validData = matchedData(req); 

    validData.user_id = req.user.user_id;

    try {
        // save new album in album table
        const album = await new models.Album(validData).save();
        debug('Created new album successfully: %O', album);

        debug("Added album successfully: %o", res);
        res.send({
            status: 'success',
            data: 
                album,
            });
    } catch (error) {
        res.status(500).send({
            status: 'error',
            message: 'Exception thrown when attempting to add album.'
        });
        throw error;
    
    }
 }

 
 /**
  * Update a specific resource
  *
  * PUT /:albumId
  */
 const update = async (req, res) => {
     const albumId = req.params.albumId;
    
     // fetch user with related albums
     const user = await models.User.fetchById(req.user.user_id, { withRelated: ['albums'] });

    // find album with /:albumId in user albums
     const userAlbum = user.related('albums').find(album => album.id == albumId);

     // fetch album model
     const album = await models.Album.fetchById(albumId);

     // if album does not belong to user
     if(!userAlbum) {
         debug("Album to update does not belong to you. %o", { id: albumId });
         res.status(403).send({
             status:'fail',
             data: 'Album does not belong to user.'
         });
         return;
     }
 
     // if everything is ok, check validation
     const errors = validationResult(req);
     if(!errors.isEmpty()){
         return res.status(422).send({ status : "fail", data: errors.array() });
     }
 
     // get valid data, set user_id to the req.user id
     const validData = matchedData(req); 
     validData.user_id = req.user.user_id;
 
     try {
         // save valid data from body to album table
         const updatedAlbum = await album.save(validData);
         debug("Updated album successfully: %O", updatedAlbum);
 
         res.send({
             status: 'success',
             data: 
                 updatedAlbum,
         });
 
     } catch (error) {
         res.status(500).send({
             status: 'error',
             message: 'Exception thrown in database when updating a new album.',
         });
         throw error;
     }
 }


/**
 * Add existing photo to album
 *
 * POST /albums/albumId/photos
 */
 const attachPhotos = async (req, res) => {
    const albumId = req.params.albumId;

    // Checking after errors before adding photo
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return res.status(422).send({ status : "fail", data: errors.array() });
	}
	const validData = matchedData(req); 

	// fetch user with related albums
	const user = await models.User.fetchById(req.user.user_id, { withRelated: ['albums', 'photos'] });

	// find the album in user list
	const userAlbum = user.related('albums').find(album => album.id == albumId);

    // make sure album with /:albumId exists
    const album = await models.Album.fetchById(albumId, { withRelated: ['photos'] });

    // check specific album for the photos we want to add
    const existing_photo = validData.photo_id.every(id => {
        const findPhoto = album.related('photos').find(photo => photo.id == id);

        if (findPhoto){
            return true;
        }
    });

    // check if the photos are the users 
    const isUserPhoto = validData.photo_id.every(id => {
        const userPhoto = user.related('photos').find(photo=> photo.id == id);
        
        if (userPhoto){
            return true;
        }
    });
    
    // if the photo is already in the album
    if(existing_photo) {
        return res.status(400).send({
            status: 'fail',
            data: "Photo already exists",
        });
    }
    
    // if the album does not belong to the user
    if(!userAlbum || !isUserPhoto) {
        debug("Album or photo to update does not belong to user. %o", { album_id: albumId, photo_id: validData.photo_id });
        return res.status(403).send({
            status:'fail',
            data: 'Album or photo does not belong to user.'
        });
    }
    
	try {
        // attach new relation between photo and album, insert into albums_photos table
        validData.photo_id.forEach(id => {
            album.photos().attach(id);    
        });

        debug("Attached photo successfully: %O", res);
        res.send({
            status: 'success',
            data:   
                null,
        });

	} catch (error) {
		res.status(500).send({
			status: 'error',
			message: "Exception thrown when attempting to attach photo",
		});
		throw error;
	}
}


/** 
 * Delete photo from album
 * 
 * DELETE /:albumId/photos/:photoId
 */

const detachPhotos = async (req, res) => {
        const albumId = req.params.albumId;
        const photoId = req.params.photoId;
    
        // fetch user with related albums
        const user = await models.User.fetchById(req.user.user_id, { withRelated: ['albums'] });
    
        // find the album in user list
        const userAlbum = user.related('albums').find(album => album.id == albumId)
    
        // make sure album with /:albumId exists
        const album = await models.Album.fetchById(albumId, { withRelated: ['photos'] });
    
        // check specific album for the photo we want to remove
        const existing_photo = album.related('photos').find(photo => photo.id == photoId);
    
        // if the photo is already in the album
        if(!existing_photo) {
            return res.status(404).send({
                status: 'fail',
                data: "Photo does not exist in album",
            });
        }
    
        // if the album does not belong to the user
        if(!userAlbum ) {
            debug("Album does not belong to user. %o", { id: albumId });
            return res.status(403).send({
                status:'fail',
                data: 'Album does not belong to user.'
            });
        }
        
    try {
        // detach relation between photo and album
        await album.photos().detach(photoId);

        debug("Removed photo successfully: %O", res);
        res.send({
            status: 'success',
            data:   
                null,
        });

    } catch (error) {
        res.status(500).send({
            status: 'error',
            message: "Exception thrown when attempting to remove photo from album",
        });
        throw error;
    }
}

 
 /**
  * Destroy a specific resource
  *
  * DELETE /:albumId
  */
 const destroy = async (req, res) => {
    const albumId = req.params.albumId;

    // fetch user with related albums
	const user = await models.User.fetchById(req.user.user_id, { withRelated: ['albums'] });

    // find the album in user list
	const userAlbum = user.related('albums').find(album => album.id == albumId)

    // make sure album with /:albumId exists
    const album = await models.Album.fetchById(albumId, { withRelated: ['photos'] });

    if(!userAlbum) {
        debug("Album to delete does not belong to user. %o", { id: albumId });
        return res.status(403).send({
            status:'fail',
            data: 'Album does not belong to user.'
        });
    }

    try {
        await album.photos().detach();
        await new models.Album({id: albumId}).destroy()

        debug("Deleted album successfully: %O", {id: albumId});
        res.send({
            status: 'success',
            data:   
                null,
        });
    } catch (error) {
        res.status(500).send({
			status: 'error',
			message: "Exception thrown when attempting to delete album",
		});
		throw error;
    }
 }
 
 module.exports = {
     index,
     show,
     store,
     update,
     attachPhotos,
     detachPhotos,
     destroy,
 }
 