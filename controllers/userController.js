const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const jwt = require('jsonwebtoken');
/*
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InVzZXJJRCI6MTd9LCJpYXQiOjE1OTEwMTgxMTcsImV4cCI6MTU5MTEwNDUxN30.ha3nOZ2n2X9_n6dBxMTjMsaHtsN11S1jQKqya6V2xT4"
* */
exports.mustBeLoggedIn = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        req.flash('errors', 'You must be logged in to perform that action!');

        /* Now let's MANUALLY save our session data so we can be sure that it actually has completed before the .redirect() .
        * So how we do this task? We can use a callback inside .save() so this means if the req.session.save() has completed
        * we now can run this callback. */
        req.session.save(() => {
            res.redirect('/');
        });
    }
};

exports.apiMustBeLoggedIn = (req, res, next) => {
    try {
        console.log(req.body.token);
        /* The first arg is the token that you want to verify.So we want to determine if the incoming token in the request is
        * malicious and made up or fake or it's real that our server generated and the second arg is jwt secret phrase of our application.
        * Remember: Each request for creating a post, must send a key value pair with key named token.
        * Now if the verify method determines that this is a valid token that our sever generated, it's going to return with the
        * payload or data that was stored in the token. So remember that in our token we had an object with just one property named id.
        * So if that's what's going to return with, we don't want that value to just float in outer space. We want to store it.
        * So we store it in our req object with some name.
        * Important: Why store it in req object? Because if we store it in req object instead of a regular variable, we can receive and
        *  use that apiUser in the next function that is going to call after this function in apiRouter.js routes.
        * But if the token is not valid, the .verify() is going to return an error. So we catch that error in catch block.*/
        req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET);
        next();
    } catch(error) {
        console.log(error);
        res.json('Sorry, you must provide a valid token!');
    }
};

exports.login = (req, res) => {
    /* req.body is the form data that the user send it through post request. */

    /* important: For creating the user object to get the avatar, in this file we can't pass in the second arg for getting new '
    *   instance of user.Because the req.body doesn't have the enough data for our requirements.For example it doesn't have
    *   the user's email for creating or updating the user's avatar.So we must create or update the user's avatar in the User.js
    *   not in userController.js  and in User.js we are creating or updating that avatar with the incoming data which has all of our
    *   data.If we pass the second arg when creating instance of user in this file, express will throw an error and say:
    *   illegal argument undefined.Because we don't passed the email for getAvatar() method.So we must create and update the
    *   avatar in User.js and then pass that avatar to our controller to update.
    *   But remember: We must create an instance of user here, to actually call our login() method!!! But for updating the avatar
    *   of user, we must create another instance in User.js
    *   Also in Post.js we must
    *    */
    let user = new User(req.body);

    /* Remember that it's the model and not the controller that should handle the data logic.So in this case we are looking uo
    * a username and password in the database, this task must definitely done in model. So we create a function named login()
    * in model. */

    /* This below callback function is not going to run until the perfect moment.That means, here we are sending a  */
    /* Why we are doing this instead of just send a response ? Because we don't want to send back a response to the browser
    * until our login function has a chance to complete.Because we don't know how long the login() method is going to take. */

    /* user.login((result) => {
         res.send(result);
     });

     remember we can receive whatever value the promise is resolved with, by including a parameter within the parentheses of
     callback function in .then() method and also if the promise rejects , we can receive the value of .reject() (the value here is
     whatever is inside of parentheses of .reject() method) by including a callback function for .catch() method and the value
     of .reject() will be available in the parameter of callback in .catch() method.
     */

    /* For using a promise, within the both .then() and .catch() methods we must provide them a function.We can receive whatever
    * value the promise resolve with,by including a parameter inside the parentheses of .then() and if the promise calls reject()
    * instead of resolve() we can provide a function inside catch and we can access whatever is inside reject() by providing
    * a parameter inside parentheses of .catch().  */

    user.login()
        .then((result) => {

            /* If a promise rejects or (.reject()), so the .catch() will take care of that situation. */

            /* For enabeling sessions, we can say req.session.<some name> . That name doesn't matter, the thing is important now
            * is that our req object has this new session object that is unique per browser visitor and then within the {}
            * we can store any information we want and they would be unique to this one visitor or web browser.So when the session
            * is one two things happen : 1-The server is going to store the session data in memory and 2- The session-express
            * package will send instructions to web browser to create a cookie.So session package will send instructions to
            * browser to create a cookie named connect.sid and it has a unique value.This value is a unique identifier for
            * that particular session data and that's being stored in server's memory.Once a web browser has a cookie, it's
            * going to send all cookies for the current domain back to the server with every single request.So now anytime
            * we visit localhost:3000 , the web browser is going to send that cookie and it's value back to the node server.
            * and server will say AHA!.The only way that you would know this unique session identifier is if I just send it
            * to you in a cookie.So server says: You know this session value so I can trust you.
            *
            * Remember: Currently our server is storing session data in memory.It's not good.Because as soon as the computer
            * shuts down or restarts, it's memory will reset and remember when we run command npm run watch, the server will
            * restarts (when we say any changes in the file.).So we must store session data in our database.
            *
            * Now our server is going to remember this session data.So we can use this session data from any other routes.  */

            /* By enabling this session, when the user successfully logins - because we are in .then() method so it means
             the login attempt was successful and after that we set a session for user(or actually after sending a succussful request to
            /login), a session for that specific user will be created in our DB.
             So in database, user property with that following object will created. */

            /* Remember: How server can remember or trust browser session? Every time a web browser sends an HTTP request,
            * it also is going to send along all cookies for the current domain.This is the default behavior of browsers.
            * So browsers always send along their cookies for current domain with the request.Then session is going to see
            * this unique session identifier and going to say, hey! that's matches this session ID in our database.
            * Remember:None of the session data is stored in the browser's cookie.All the things that are stored in the cookie
            * is the unique session identifier.But all of the actual session data (in this case that user object) lives on
            * the database side. */

            /* Remember: After req.session.user={}; if we want to do another task we need to worry about timing.So in
            * req.session.user={...} the session package is going to recognize that we are changing the session data and in
            * response is going to automatically update that session data in database for use.So because we are working with
            * databsae, it will take some time so we have to wait for it to complete and then do our next task.Because there
            * is no gurantee that database will have been updated before the redirect runs.So What we can do is even though
            * the session package would usually automatically update or save the session data for us we can manullay tell it
            * to save and then within that .save() we pass in a callback to do our rest of the tasks.   */

            req.session.user = {
                username: user.data.username,
                userID: result.userData.id,
                avatar: result.avatar
            };
            req.session.save(() => {
                res.redirect('/');
            });

        })
        .catch((err) => {

            /* If we perform a .redirect(), this is going to be considered as a new separate request and since we are redirecting
            * to homepage, our router will call our home function and since there is not going to be a user object within the
            * session because the login just failed, our else in home function will run and it will render the 'home-guest'
            * template.So we can include red warnings in that template.However we need to remember the stateless nature
            * of HTTP requests.Meaning when this request (request to home) runs, our server has no memory that a login just failed
            * and it's not like we always want to show a message that says 'invalid...', whenever we render the guest home page.
            * So as we learned we need some sort of persistent memory of previous request that we can leverage sessions.So we can
            * create a session in this .catch() to use it in our else {} in home function.So for this,we can use flash object into
            * our request to '/' URl.So why we use sessions for storing errors in them?Because it's persistent for a while even
            * after .redirect().   */


            /* First arg of .flash() is the name of array of messages that we want to start building.The second arg is actual
            * message that we want to add to that array. */

            /* Flash package will help us add or remove data from our sessions.  */

            /* err is the value that our promise is rejects with it. */

            // The next line is equal to req.session.flash.errors = [e];

            /* Remember because the req.flash() will modify our session data and because this task requires work with database,
            * we want to sure to perform .redirect() until that .flash() action has completed.So how we wait for that?
            * We know our session package will automatically save sessions to database anytime we call res.send() or res.redirect(),
            * (actually in this case we are saving the new flash object or data to DB), but there is no guarantee that the saving
            * sessions will finish before the .redirect().So we can do that save task manully and pass it a callback to be sure
            * anything is working right after each other.So after updating new sessions to database we can redirect to homepage.  */

            req.flash('errors', err);
            req.session.save(() => {
                res.redirect('/');
            });

        });
};

exports.apiLogin = (req, res) => {

    let user = new User(req.body);

    /* We don't need to worry about session or flash messages or ... in the api context. */
    user.login()
        .then((result) => {

            /* How we trust a token that a user sends to us ? Because it's not like sessions where the cookie just stored as the
            * session identifier, but then the actual session data was stored on the server and we know that our server is a trusted
            * environment whereas this token based approach, when in apiLogin() (when a user log in) we say jwt.sign(),
            *  we are actually storing data in the token (instead of a trusted environment like server!) and then when
            *  the user sends that token back to us, we are actually using and TRUSTING and believing this data.
            * Remember: Normally you can't implicitely trust what users send you! However this is the beauty of JWT. We only
            * trust the payload data (the data that we store in token), if we have determined that token is valid. This is why
            * we are not just sending data in the token also we are signing it or giving it a signature (with .sign() method.) with
            * our unique or secret phrase. This makes it nearly cryptic graphically impossible for a malicious user to manipulate
            * or try to edit their token to have someone else's userID.Right? Because within our apiMustBeLoggedIn() function,
            * when we call JWT.verify() , this method will have no problems determining fake or manipulated tokens.Right? It's
            * going to check to see if the signature is a match. If it is a match, that means it's a token that we OURSELVES signed and
            * generated which in that case we CAN implicitely trust the data payload from the token.
            * JWT has stateless authentication. Meaning we don't need to keep track of session data on our server an this can
            * greatly simplify and speed up our server.
            * So if we don't need to store session data in memory or database that's just one less thing that our server needs to
            * do.
            * So big picture we don't need to keep track of session data in this context because tokens contain all of the data we need
            * to authenticate and identify requests.
            *   */

            /* The first parameter of .sign() is an object that in there, we include any data that we want to store in this token.
            * For example in cookies and sessions we store things like userID and the users's username and ... . But in this case
            * we don't need their username or gravatar because we are not going to power a visual interface.
            * For second arg we include a secret phrase or a secret string that the package will use when it generates the token.
            * Now you could just include the secret string right here but it's better to do this in .env file.
            * Important: In .env file you shouldn't use spaces and also quotes or double quotes.
            * For third arg, we give it an object of options.By default the token that this method generates will never expires, so we
            * want to set a expiration data.
            *
            * After sending a request, no matter it's ios android windows or ... or even just a web app, it's up to the application which
            * is leveraging our api to save or hold this token in some fashion, so then it can use this token again in the future.
            * Because this token proves to our sever that you are the user that just logged in. So this token identify you. */
            /* Important: Yes I know. THe data that we are storing in token is an object inside an object and that is not
            *   a good practice.But when you check the code in Post.js when we are purifying our data property in authorID, we are
            *   expecting an object which has another object inside it and in that inner object we are expecting to see a property named
            *   userID. So we must provide it these names with these formats in our token!!! */
            res.json(jwt.sign({user: {userID: result.id}}, process.env.JWTSECRET, {expiresIn: '1d'}));
        })
        .catch((err) => {
            res.json('that is wrong login');
        });
};

/* We have the route : /logout in our router and also when we post a request to that URL the logout function will be called.
* So we must include our req and res in logout function too! */
exports.logout = async (req, res) => {

        /* If the incoming req from a browser has a cookie with a valid or matching session id, the next line is going to find it
         * in our database and destroy that session.Also remember that you have to wait for .destroy() to doing it's job.
         * So we can use callback here to wait.But if you just want to show a simple message to the browser after .destroy()
         * it doesn't need to wait and use a callback for showing that message.But for redirecting, we must wait for .destroy()
         * to complete, because the home page is going to be different depending on you have a session or not, in other words
         * it will render a different template in those 2 conditions.So we must wait for that case.  */
         req.session.destroy((error) => {
             if (error) {
                 console.log(error);
             } else {
                 res.redirect('/');
             }
         });
         
};

exports.register = (req, res) => {
    let user = new User(req.body);

    /* If a promise was resolved, .then() will do it's work and if a promise was rejected, .catch() will take care of that.So
    * we must include resolve() and reject to somehow say the promise is completed either successful or not. */

    user.register()
        .then((result) => {
            req.session.user = {
                username: result.username,
                userID: result.userID,
                avatar: result.avatar,
            };
            req.session.save(() => {
                res.redirect('/');
            });
        })
        .catch((regErrors) => {
            /* We passed in regErrors to use it instead of user.errors so our controller doesn't need to work directly with
            * our model. */

            regErrors.forEach((error) => {
                req.flash('regErrors', error);
            });
            req.session.save(() => {
                res.redirect('/');
            });
        });


    // if (user.errors.length) {
    //     user.errors.forEach((error) => {
    //         req.flash('regErrors', error);
    //     });
    //     req.session.save(() => {
    //         res.redirect('/');
    //     });
    // } else {
    //     res.send('Congrats!');
    // }

};

exports.home = async (req, res) => {
    if (req.session.user) {

        /* The second arg of .render() is data that we want to pass in to that template and after this, the data that we passed in
        * will be available in that template. */
        /* In req.session.user. ...  the user is the name of the session's object. */
        /* Remember: In .ejs files if you want to access the property of object that we are sending to that .ejs file when we
        * render that file in express, you can just use the name of that property.But if you want to output it or print it
        * for example outout that property in src attr, you must add a = after the first <%. Like: <%= property %> */

        /* I commented the next .render() because we have a middleware function for sessions that makes user property availabe from
        * all of our .ejs files. */
        // res.render('home-dashboard', {
        //     avatar: req.session.user.avatar,
        //     username: req.session.user.username
        // });

        /* TODO we need to pass in the avatar data into the .render() for our template. But HOW???? */

        /* Fetch feed of posts for current user:  */

        /* Let's get the users that this profile is following them and then pass the results with this profile id to getFeed() function
          to get the posts that wrote by those people(users that this profile is following them.)
         const following = await Follow.getFollowingById(req.session.user.userID);
         const posts = await Post.getFeed(req.session.user.id, following);
         important: Or we can looking DIRECTLY in the follows model from within the posts model.(This is not very good in MVC
          but it's ok!). Because we are not modifying the follows data any way.So it's OK!So we must require() the Follow model
          in Post model
          So remember that in MVC, we better to not require the model files in other models.
         */

        const posts = await Post.getFeed(req.session.user.userID);

        res.render('home-dashboard', {
            posts: posts,
            title: `Welcome, ${req.session.user.username}`
        });
    } else {

        /* Remember: We can access our session data by typing req.session.flash.errors but we also want to delete that errors from
        * session.So we must use flash package for accessing and deleting the data from our sessions.We want to delete this data
        * because we want to show this data to user only once.So with flash package as soon as you access that data it will delete
        * it.errors will be an array, if there is no errors it will be an empty array. */

        /* As soon as we use the flash package to retrieve the data from database instead of updating that data in DB, that
        * package is going to know we are then ready to remove that flash data in flash object from the session. */

        /* I commented out that errors property in .render() because we can set up a function that runs for every request,
        * to automate creating that errors property in .render() for every template.So we have access to this errors property in every template. */

        res.render('home-guest', {
            // errors: req.flash('errors'),
            regErrors: req.flash('regErrors'),
            title: 'Welcome to OurApp'
        });
    }
};

exports.ifUserExists = (req, res, next) => {
    /* We created this function, so if the :username portion of the URL is made up and doesn't exist, we want to redirect
    * them to errors and...  */

    /* username is that last segment of URL in our router.js file (:username).
    * We created this function, so we can pass it the username of the current profile and get many things we want just by
    * his username and then pass this returned information to the next functions that will run after this function, in this route. */
  User.findByUsername(req.params.username)
      .then((userRow) => {

          /* We must store userRow in somewhere, so that next function which is profilePostsScreen() can access (or receive it.)
          * So what we can do is create a property in req object. */
          req.profileUser = userRow;
          next();
      })
      .catch((error) => {
          console.log(error);
          res.render('404');
      });
}

/* The next function is going to run for all of three of our routes : The posts route, the followers route and the following route. */
exports.sharedProfileData = async (req, res, next) => {

    /* isVisitorsProfile variable is for determinig if we are currently in profile of user himself or not?
    * So first we get the user session to get the current id of viewer and then we compare this session id with the id of him
    * in db which was ran when a viewer visit a profile.
    * important: So if you want to implement this feature , you must compare the session id with the id of owner of profile. */
    let isVisitorsProfile = false;
    let isFollowing = false;

    /* If user is logged in, first we check is visitor following the current profile he is visiting or not? We know that before
    * the sharedProfileData() function runs, ifUserExists() had run and that function will pass in the user row in users db
    * to the next function that would run (and that function is sharedProfileData() function.).So now we have access to user row
    * that we are currently visiting him or her by using req.profileUser and now Follow.isVisitorFollowing will return either
    * true or false so we can update isFollowing variable after isVisitorFollowing() function resolves or rejects. */
    if (req.session.user) {
        if (req.profileUser.id === req.session.user.userID) {
            isVisitorsProfile = true;
        }

        isFollowing = await Follow.isVisitorFollowing(req.profileUser.id, req.visitorId);
    }

    req.isVisitorsProfile = isVisitorsProfile;

    /* important: Lest's add isFollowing variable to req object to use it in the function that will run after this function.
    *   Which the next function is profilePostsScreen().So we can set things so that when profilePostsScreen() is rendering
    *   data for profile template, we can pass in this isFollowing variable and then in template we will set the HTML stuff
    *   so it will be shown if we are following this user we are currently visiting or not? */

    /* Remember: For finding out which function is next or which function will run after this function, look at router.js*/
    req.isFollowing = isFollowing;

    /* Retrieve posts, followers and followings counts:
    * However the next 3 lines of code are not the most optimal way of setting things up because from performance or speed perspective
    * we can do much better.
    * Important : This setup would make sense if each one of our promises, relied on the previous promise to be completed before
    *  itself make another request and gets a promise.In this case none of these things rely on another.In other words, all of
    *  these tasks can run independently from one another and none of them depend on a value from another.This means there is no
    *  sense in awaiting or freezing the execution of the further JS actions.
    *  So let's instead let all three of promises begin running at the same time and then wait for all three to complete
    *  before calling next().
    const postCount = await Post.countPostsByAuthor();
    const followerCount = await Follow.countFollowersById();
    const followingCount = await Follow.countFollowingsById();
     */

    /* We don't wait for promise to resolve or reject so we get the promise itself not it's values, so we named the variables with
    * word promise.Because we get the promise itself and because calling a function that returns a promise in future will
    * immidiately return a promise but without it's value. */
    const postCountPromise = Post.countPostsByAuthor(req.profileUser.id);
    const followerCountPromise = Follow.countFollowersById(req.profileUser.id);
    const followingCountPromise = Follow.countFollowingsById(req.profileUser.id);

    /* There is no guarantee which one of these 3 promises in Promise.all() will complete or resolve first, but in this case
    * it doesn't matter.we don't care which one completes first, we are just waiting (await) for all of them to complete before
    * moving on.
    * Promise.all() will return an array and it will an array with the values that each one of these promises resolves with it.
    * Now we want to keep track of those values, so we assign the returning value of Promise.all() to a variable. */
    /* The next 4 line will work but there is a better way...
   const results = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise]);

   const postCount = results[0];
   const followerCount = results[1];
   const followingCount = results[2];

   we can use array destructuring.
   So with this new way, we create 3 different variables with 3 different names and the first item will use the first value from
   the array that we are destructuring and ...
    */

    const [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise]);

    /* Now let's add these 3 counts to the req object therefore we can use these values in the next functions that are going to
    * run. */
    /* Remember we must pass these 3 values to EACH 3 routes.Because when you are in one of these routes, you must see the
    * number counts of other routs also, so because of this , we must pass all of these 3 values to EACH route, NOT the related
    * on for each route.This is false.
    * Also another reason for passing all of these values to EACH route is, all of these 3 routes are including a shared template
    * so we must pass in these 3 values to EACH template, because that shared template required or need these 3 values to render
    * them(show them). */
    req.postCount = postCount;
    req.followerCount = followerCount;
    req.followingCount = followingCount;

    next();
};

exports.profilePostsScreen = (req, res) => {

    //Ask our Post model for posts by a certain author id
    Post.findByAuthorID(req.profileUser.id)
        .then((posts) => {

            /* When we set up this function to return promise, in promise we are going to make it resolves with a value that is
            the array of posts and we can get receive that value by including a parameter in .then(). */
            res.render('profile', {
                currentPage: 'posts',
                postsData: posts,
                profileUsername: req.profileUser.username,
                profileAvatar: req.profileUser.avatar,
                isFollowing: req.isFollowing,
                isVisitorsProfile: req.isVisitorsProfile,
                counts: {
                    postCount: req.postCount,
                    followerCount: req.followerCount,
                    followingCount: req.followingCount
                },
                title: `Profile for ${req.profileUser.username}`
            });

        })
        .catch((error) => {
            console.log(error);
            res.render('404');
        });

}

/* When you want to create a promise, you can say return new Promise((resolve, reject) =>{}); in the function you want to
* create a promise but when you want to use or consume that promise you can use either async await or .then().catch(). */

exports.profileFollowersScreen = async (req, res) => {
   try {
       const followers = await Follow.getFollowersById(req.profileUser.id);
        // console.log(followers);

       res.render('profile-followers', {
           currentPage: 'followers',
           followers: followers,
           profileUsername: req.profileUser.username,
           profileAvatar: req.profileUser.avatar,
           isFollowing: req.isFollowing,
           isVisitorsProfile: req.isVisitorsProfile,
           counts: {
               postCount: req.postCount,
               followerCount: req.followerCount,
               followingCount: req.followingCount
           }
       });
   } catch {
       /* This block will run if there were any errors during executing the codes in try{} block. */
       /* Essentially: In situations that you're using await instead of .then().catch() , we must use try catch blocks and
       * when you add () after the word catch and include a parameter there, it will receive or catch whatever value that one
       * of our promises in try block rejects.
       * So catch blocks with their parameters in await situations will receive the reject values of promises in try blocks.
       * But in this case we don't need this parameter or receiving the reject values, so this way if something unexpected
       * happens and there's an error in our code, our server won't blow up.(Blow up means, if we reject something in promises
       * we must handle it or if we have errors we must handle it.)  */

       res.render('404');
   }

};

exports.profileFollowingScreen = async (req, res) => {
    try {
        const following = await Follow.getFollowingById(req.profileUser.id);
        // console.log(following);

        /* When we are rendering the template, let's give it one additional property that tells the current page we are currently in
        * it.The name of the property is currentPage. */

        res.render('profile-following', {
            currentPage: 'following',
            following: following,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {
                postCount: req.postCount,
                followerCount: req.followerCount,
                followingCount: req.followingCount
            }
        });
    } catch {
        /* This block will run if there were any errors during executing the codes in try{} block. */
        /* Essentially: In situations that you're using await instead of .then().catch() , we must use try catch blocks and
        * when you add () after the word catch and include a parameter there, it will receive or catch whatever value that one
        * of our promises in try block rejects.
        * So catch blocks with their parameters in await situations will receive the reject values of promises in try blocks.
        * But in this case we don't need this parameter or receiving the reject values, so this way if something unexpected
        * happens and there's an error in our code, our server won't blow up.(Blow up means, if we reject something in promises
        * we must handle it or if we have errors we must handle it.)  */

        res.render('404');
    }

};

exports.doesUsernameExist = (req, res) => {

    /* username property was sent from registrationForm.js to '/doesUsernameExist' route and for that route doesUsernameExist()
    * method (the method we are currently in it) would be called so that method will get or receive the username property sent
    * by axios in registrationForm.js*/
    User.findByUsername(req.body.username)
        .then(() => {

            /* Important: When you want to send some data to other places as the response, you must send it via res.json()
            *   So that piece of code means we are sending some data as response in json format and we must pass that data
            *   into .json() parentheses. */
            res.json(true);
        })
        .catch(() => {
            /* If the promise rejects, the value of reject() will go to .catch() when we are consuming that promise. */
            res.json(false);
        });
};

exports.doesEmailExist = async (req, res) => {

  /* Remember: In User.doesEmailExist() we don't use reject(), so when we consume the promise that is returning from User.doesEmailExist()
  * we can't use .catch() in this file and in this method, because in User.doesEmailExist() we don't use reject(). */
  const emailBool = await User.doesEmailExist(req.body.email);
  res.json(emailBool);
};

/* Remember: After setting up this route and it's functionality for returning posts, our job is not done yet!
   Yes! this route is working with using postman but there's something named cors is preventing this route from working in
   web browsers. In other words, in web browsers when you're on a domain other than localhost:3000
   Learn: You can send requests from codepen to your localhost api!!! So if you send a request to the api you will get errors like:
   'has been blocked by CORS policy!!
   CORS (cross origin resource sharing).

   Learn: So web browsers will not send off async requests to other domains unless that other domains explicitly says it's OK to do this!
   So in this case since our API to be available to everyone and we would want users to be able it from code pen or any other domain.
   For fixing this issue we must install package named cors and use this package in router-api.js file.
  */
exports.apiGetPostsByUsername = async (req, res) => {
    try {
        const authorRow = await User.findByUsername(req.params.username);
        const posts = await Post.findByAuthorID(authorRow.id);
        res.json(posts);
    } catch (error) {
        console.log(error);
        res.json('Sorry invalid user requested.');
    }
};
