# photo_album_API
REST-API made with node.js, express.js using Bookshelf and a MySQL database. The API is deployed with heroku and tested using postman, the postman collection can be found in the repo for testing as well as a dump of the database. The API also uses JWT tokens as authentication before the user can view, update, post and delete photos and albums in the database belonging to them. Any passwords are encrypted with a hash and salt using bcrypt.