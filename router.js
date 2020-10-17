const express = require('express');
const router = express.Router();
const userController = require('./controllers/userController');
const postController = require('./controllers/postController');
const followController = require('./controllers/followController');

/* important: Our controllers and their methods are responsible for responsing to the routes that user writes
    in the URL. */
/* important: Each route must be started with / (forward slash)

When you are requiring something by saying: require('<x>')  you MUST export that sth(in this case, x) from that file. Otherwise it won't
be required. So in that file where you are using require() for requiring that file, you must say:
module.exports = x; to be able to require('x') in other files.
Important: Also when you are requiring the files you've created, you must require() them with ./ and you can't omit the ./ for requiring them.
 So when you want to require() sth in your file, always start with ./ and then navigate through folders. Otherwise, it won't find that file.*/

//user related routes

/* The second arg of router.get() or router.post() is the response when a get or post request sent to that first arg. */
router.get('/', userController.home);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post('/doesUsernameExist', userController.doesUsernameExist);
router.post('/doesEmailExist', userController.doesEmailExist);

//profile related routes

/* On followers and following pages like the posts page on profile screen, we still want to know if we are following the
* current user that we are in his profile or not? So we can create a function or an area that can run for all three of these
* different routes.
* So when a user visits a profile screen, we want to know if the current visitor is already following this account that is
* visiting or not? So we can write some code in sharedProfileData(). */
/* The sharedProfileData() can be used for followers and following sections in the profile page too. */

router.get('/profile/:username', userController.ifUserExists, userController.sharedProfileData, userController.profilePostsScreen);
router.get('/profile/:username/followers', userController.ifUserExists, userController.sharedProfileData, userController.profileFollowersScreen);
router.get('/profile/:username/following', userController.ifUserExists, userController.sharedProfileData, userController.profileFollowingScreen);


//post related routs:

/* Remember: For store the segment of the URL as a query parameter, we can just say :<x> */

/* The express framework lets us include multiple functions that we want to run in response for the given route(like '/create-post').When
* we say next, we are telling express to run the next function for that route. */
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen);
router.post('/create-post', userController.mustBeLoggedIn, postController.create);

/* In the next route, :id is the id of that post. Remember:We don't need to use mustBeLoggedIn function in this case.Because
if a visitor clicks on edit button, means he or she it the actual author of that post so he is already logged in, so we
determined he is the actual author because he was logged in and had a session.
IMPORTANT: BUTTTTT!!!WAIT!!!!!! The above comment is correct, but what if a user that has not logged in and manually type this
 URL?So we must protect this URL , so just owner of this post or actually author of this post can see this URL or page and also
 the owner of this post can submit that Save Updates button.  */
router.get('/post/:id/edit', userController.mustBeLoggedIn, postController.viewEditScreen);
router.post('/post/:id/edit', userController.mustBeLoggedIn, postController.edit);
router.post('/post/:id/delete', userController.mustBeLoggedIn, postController.delete);

/* :id will represent whatever user write after the /post/... . Last segment of URL is the id of post that should be loaded.
We want random strings of URL that represent that specific post.*/
router.get('/post/:id', postController.viewSingle);
router.post('/search', postController.search);

// Follow related routes

router.post('/addFollow/:username', userController.mustBeLoggedIn, followController.addFollow);
router.post('/removeFollow/:username', userController.mustBeLoggedIn, followController.removeFollow);

module.exports = router;








