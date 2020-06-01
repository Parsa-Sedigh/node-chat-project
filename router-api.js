const apiRouter = require('express').Router();
const userController = require('./controllers/userController');
const postController = require('./controllers/postController');
const followController = require('./controllers/followController');
const cors = require('cors');

/* We want to use the cors package on all of our routes of api. So for enabling a feature on all of our routes we can use :
<name of router>.use() . This code will configure all of our routes that are listed below this code, to set the cross origin resource
sharing policy. So those routes are allowed from any domain. */
apiRouter.use(cors());

/* APIs are about opening up your data and make it universally available. */
/* We don't need to include '/api' in the beginning of our routes, because in the next line we are saying use this router
 ('./router-api') for '/api' routes. So '/api' is sort of assumed or prepended to any of our routes within this file(api-router.js).
  So we don't need to say '/api/...' for any of routes in this file. */
/* If someone sends a valid username and password combo to '/api/login' route, then we should respond with something that would
* allow that person to authenticate or prove to us that they are who that they claimed to be (something that they can use for
* their future requests when they try to create a post that would identify them.)
* Now when we create a web browser version of our app, we used cookies and sessions to handle authentication, but for API it's
* different. Remember: For authentication and identifying request there are 2 main ways: sessions and tokens. So for token based
* authentication we can use json web tokens.So let's install the jsonwebtoken package and after that leverage this package in our
* userController.js*/

/* Yes, within the context of a traditional HTML form, there are only options of GET and POST. But if you are sending requests programmatically
* through frontend JS or through another language, there are ADDITIONAL types of requests. */

apiRouter.post('/login', userController.apiLogin);

/* We don't want strangers or guest be able to create a post.So you must be a logged in and registere user. But our loggedIN function
* only makes sense within the context of the web browser.Because it's gonna look for a cookie or a session data and then it's gonna
* redirect you.So all of that is tightly coupled to web browser.So we must create a new version of this mustLoggedIn function for api. */
apiRouter.post('/create-post', userController.apiMustBeLoggedIn, postController.apiCreate);

/* We could also set a post request to delete a post, but since we are in context of API and we know in api we can programmattically
* send all sorts of requests, for example delete requesst, we can set a route for only delete requests. But if we were in
* web browser context, we only had get and post http methods to send our requests to server.
* But remember: Because of apiMustBeLoggedIn() function, user does still need to send the token of the him. */
apiRouter.delete('/post/:id', userController.apiMustBeLoggedIn, postController.apiDelete);
apiRouter.get('/postsByAuthor/:username', userController.apiGetPostsByUsername);



module.exports = apiRouter;





