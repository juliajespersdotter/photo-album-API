/**
 * Photo Validation Rules
 */

 const { body } = require('express-validator');

 const createRules = [
     body('title').exists().isLength( { min: 3 }).trim(),
     body('url').exists().isURL().trim(),
     body('comment').exists().isLength({ min: 3 }).trim(),
 ];
 
 const updateRules = [
     body('title').optional().isLength({ min: 3 }).trim(),
     body('url').optional().isURL().trim(),
     body('comment').optional().isLength({ min: 3}).trim(),
 ];
 
 module.exports = {
     createRules,
     updateRules
 }