const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const flash = require('connect-flash');
const markdown = require('marked');
const db = require('./db');

/* Remember: When you just installed a new CLI tool, you need to close the terminal and reopen it or restart the PC. */
/* Learn: If this is the first time using git, first you must give it some information. Command:  git config --global user.name "<username>"
    Then : git config --global user.email "<your email>" . Now the git is ready!
    The git tools is how we're actually going to send our files to heroku . But heroku actually has a tool that will make connecting git
    to heroku a lot easier! So we need to install heroku CLI. This tool gives us access to heroku commands.
    After that we need to connect our command line to our heroku account. So type: heroku login
    Now our command line is logged into our heroku account. This means we can now send our application file to heroku.
    */

/* Learn: We shouldn't include .env file for deployment, instead we go to heroku dashboard and manually add the environment variables
*   that we need. Because we don't include .env file for deployment, we must create .gitignore file to ignore the .env file for creating
*   repo for our app.Also we shouldn't push node_modules folder.So git must ignore this file too! Why ? Because we have package.json
*   file is like a recipe file, it keeps a running list of all the packages or ingridients that your app needs!
*   Every time you push to heroku, the heroku service is going to look within our package.json file and automatically download and
*   install all of our packages and dependencies.So we defenitely don't need to include them in repo.
*   After this, we need to create a proc file so that heroku would know how to begin or start or launch our app. In Procfile we specify
*   environment that our app needs to run (in this case is node) and then we give it the file that begins or launches our app.
*   After these 2 steps we turn our app into git repo. Command is: git init
*   Now we just created a new or empty git repo in this folder. Now let's add all of our files to the staging area. So run command:
*   git add -A
*   */

/* csurf is better to require above or before the const app = express(); */
const csrf = require('csurf');
const app = express();
const sanitizeHTML = require('sanitize-html');

/* Note about scripts in package.json: In mac or linux it must be :
* "nodemon db --ignore frontend-js --ignore public/ & webpack --watch"
* but in windows it must be
* "start nodemon db --ignore frontend-js --ignore public/ && start webpack --watch" */

/* If we add an API to our application, the API will allow other applications to communicate to our application or in other words:
* an API will make our data and functionality accessible through programmatic requests instead of being tightly coupled to a
* specific environment (currently the web browser) (or our data and functionality just being available through clicking on buttons
* within our HTML templates).
* So for example: we've been working on a WEB APPLICATION but what if we wanted to create an ios version or an android native version of
* our app or what if we wanted to create a native windows, mac or linux desktop version of our application? The point is : What if we
* wanted to create a version of our application where the user interface is NOT powered by an HTML rendering engine. Well we'd want our
* express server that we've been working on to be able to expose data and functionality of our app in a way that is decoupled from
* HTML and cookies and just the web browser environment in general. We want to expose our data and functionality in a very open ended and
* flexible and just sort of raw data fashion.
* But in this course we are not going to make user registration available through our API. So this is a rule that if you want to register
* to our application you MUST do it through our web app. However let's imagine that WE DO WANT to allow existing users to be able to login
* and authenticate programmatically through our API. So they would be able to perform some actions from anywhere (any application environment
* that can send an HTTP request, so that could be an ios app or an android app a desktop app or ... ). SO WE MUST MAKE THE FUNCTIONALITY
* OF THIS APP AVAILABLE FROM ANYWHERE (we are exposing the data and functionality of this app to be leveraged in a universal way.).
* Now since we are not creating an iphone or android or a desktop app, the question becomes how are we gonna test things? Postman
*/
/* Now we must create a separate router just for /api routs. So we don't use our previous router.js file for including our routes for api,
* because our api would have separate router. So we must specify this separate router in app.js
* Now we know that we don't want any of those sessions or cookies or csrf or anything that is going to add some features to our previous route.
* So we must place our routes code for API in top of those features and codes. Essentially anytime you see app.use(), that's going to
* run those functions that are inside .use() parentheses for EVERY route or we should say every route that is listed below those app.use()
* lines.So just below all of our required packages we can write our new router code.
* Now since we set up the new router towards the top of all of the codes that say app.use() , none of those app.use() will apply to these
* routes.So these routes should be very light weight. However we need 2 features for this new route, so they must be above this line which
* are urlencoded and bodyParser. This way express will still be able to read incoming body request data and json data. */

/* The next 2 app.use() methods are necessary for submitthing a form in node.js */
/* The next app.use() will tell express to add the user submitted data into our req object.So then we can access that
submitted data through req.body */
app.use(express.urlencoded({
    extended : false
}));
app.use(express.json());

app.use('/api', require('./router-api'));

/* Configurations for enable sessions: */
/* By default the session package will store the session data in memory but we can overwrite this default with the store property
in session options.*/

const sessionStore = new MySQLStore({
        clearExpired: true,
        checkExpirationInterval: 900000,
        expiration: 1000 * 60 * 60,
        createDatabaseTable: true,
        endConnectionOnClose: true,
        charset: 'utf8mb4_bin',
        schema: {
            tableName: 'sessions',
            columnNames: {

                session_id: 'session_id',
                expires: 'expires',
                data: 'data'
            }
        }
    }, db);

const sessionOptions = session({
    secret: 'javascript is cool',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60,
        httpOnly: true
    }
});

app.use(sessionOptions);

/* By using app.use(flash()) we have access to flash() in every req object in our application and we can create a errors array or
* any array within that flash. */
app.use(flash());

/* When we are saying app.use() we are telling express to run the function inside .use() for every request and because we are
* including this before router this will first and since we are calling next(), express will move on to actual functions to
* a route.So it is important that this locals object must be before defining our router.
* With this special app.use() we now have access to a user property from within any of our ejs templates and remember: In
* our ejs files for accessing our properties in sessions, we must say <name of object that is within our sessions>.<name of property>
 Before making this middleware, in ejs we could simply just say : <name of property>.*/
/* We want to have a function that when we are passing an object of data to our view templates, we can call this middleware function
* to do this work and therefore we have less duplication.
* important: Remember you Must create the session object you want to be in session, in appropriate place and that place is in
*   controllers : In controllers , when we are calling the models methods, if there is no error , we can set (create) the sessions
*   and we know in routes.js we are calling the controller methods.  */

app.use((req, res, next) => {

    /* How we can prevent malicous code while also allowing innocent things like <p> and bold text and ... in our create post and
    * edit post pages? Because ejs will escape HTML tags for security reasons by default. We can use markdown.*/

    /* Markdown will convert it's unique syntax into HTML.Example: **x** will bold that <strong>x</strong>. But because
    * ejs is protecting us and escaping this HTML it will not work completely.So in ejs template we can change <%= to <%-
    * so ejs will no longer protect that piece of code and we will open to cross site scripting attacks.But for prevent this
    * we can go to Post.js and use sanitize-html package.
    *
    * Also we don't want to users to create links in their markdown, but markdown allows this by default so what we can do
    * is use sanitize to whatever markdown outputs in this file. */

    /* Make our markedown function available from within ejs templates and remember whatever we assign to res.locals.<x>
    * it will available within our templates. For accessing those thing within our templates, we can use that x. */
    res.locals.filterUserHTML = (content) => {
        return sanitizeHTML(markdown(content), {
            allowedTags: ['p', 'br', 'ul', 'ol', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            allowedAttributes: {}
        });
    };

    /* Make all errors and success messages available from all templates.(the 'errors' in () of flash() is the name of that array in
    flash.).We setting this 2 lines up, we don't need to manually pass these 2 flash arrays into our templates.
    important: We STILL MUST CREATE these message with req.flash() and save them ... but when we want to manually pass these to
     our templates, we can automate this passing in task with these lines of codes.*/
    /* and also remember that in res.locals.<x> x is the name of that array in the flash that we can use it in our templates and
    * in req.flash(<y>) y is the name of that array in the place that we are CREATING these arrays in our controller.*/
    res.locals.errors = req.flash('errors');
    res.locals.successMessages = req.flash('successMessages');

    //Make current user id (which is user object in session data.) on the req object available so with each request we can check if he is guest or not?
    /* For making this task works, we are going to add a property to req object named visitorId and ... Remember we are creating
    * userID property in user object in session in our login and register functions in userController.
    * Now no matter which controller function we're in, we know there's going to be visitorId property on the req object , so
    * if the users login , then it will their id and if they're not it will be 0. */
    if (req.session.user) {
        req.visitorId = req.session.user.userID;
    } else {

        req.visitorId = 0;
    }

    //Make user session data available within view templates.

    /* when we say res.locals , we are working with an object that will be available from within our ejs templates,so we can
    * add any objects or properties we want onto this locals object.In other words the next line take the current user session
    * and make that user object available within res.locals meaning we can access it from our ejs files.
    * Now in all of our templates we can access to user object in session with just saying user.   */
    res.locals.user = req.session.user;
    next();
});

const bodyParser = require('body-parser');
const router = require('./router');



/* HTTP request are stateless.This means each request is ran without any knowledge of the requests that ran before it.So how
* we can solve this?Or how we can trust the subsequent requests that came before a valid request?Sessions and tokens. */

/* learn: What is require() ? This method in node.js does 2 things: 1) It executes the given filename in parentheses.
*   2) It returns whatever that filename in parentheses exports.So if we say :
*   module.exports = x; in the file that is in the parentheses of require(), the variable x will be returned from that
*   file in the parentheses and it will be stored in whatever variable we are storing the require();
*   so for example : In const a = require('...'); the value of module.exports , will be stored in a variable.
*  */

/* Remember : When you require in a file, that entire file is going to executed immidately and also whatever you export from
that required file, will be stored in that variable that we assign the require to it(in this case that variable is router.) */

/* The public folder is where we put our public code that anyone can access them.Things like css files or browser-based 
javascript files and ... but we must also tell express server to make that folder accessible for everyone.So we include
that foldername in parentheses of static() method.
important: When you want to include a file from public folder you can say : /<the name of the file or folder>...*/
app.use(express.static('public'));

/* In the next line for the first arg we must specify the 'views' but for second arg we must specify the name of the folder
that our views files are there.So in our project that folder also called 'views'. */
app.set('views', 'views');
app.set('view engine', 'ejs');

/* We must use the csrf package above of when we are using our router (app.use('/', router);)
* Now when we are saying app.use(csrf()); , this will set things up so that any of our post, put, delete or any requests
* that modify state, will need to have a valid and matching CSRF token or else the request will be rejected and we'll throw
* an error.So right after this app.use(); let's set up a piece of middleware to make the CSRF token available from within
* our ejs templates. For doing this you must say res.locals.<the name you want to access that CSRF token with this name> = ... */
app.use(csrf());
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();

    next();
});

app.use('/', router);

/* Let's send a red flash message to frontend instead of invalid csrf token error. */
app.use((err, req, res, next) => {
    if (err) {
        if (err.code === 'EBADCSRFTOKEN') {
            req.flash('errors', 'Cross site request forgery detected.');
            req.session.save(() => {
                res.redirect('/');
            });
        } else {
            /* There is an error, but the error had nothing to do with our CSRF token logic. */
            res.render('404');
        }
    }
});

/* Important: After setting up the csurf package and it's configuration, we must go through our application and anywhere we are performing
*   a POST request, we need to pass along that matching CSRF token.
*   So we must go through our app, and update the app to work with csrf package.
*   We knew from the beginning that when you sumitting a from, that form sends a post request to our server and
*   after setting the csurf package, the server demand a csrf token on any post request and also we need to update our async post
*   requests that are coming from our frontend files, like using axios.post() or fetch() or ...
*
*   Important: When you are sending a post request if you have a <input type="hidden" name="_csrf" value="<%= csrfToken %>"> in your
*    HTML, when you are sending a post request, it doesn't need to also give the sending values, the _csrf manually.
*    But when you haven't this HTML, like in your search.js , you must give the _csrf value into the object or data you are
*    sending to server manually like what we did in search.js class.
*
*   Important: Actually when you want to send a post request to server, you have 2 options, via AJAX or without AJAX,
*    if you want to use AJAX, you must provide the _csrf value for data that you are sending along the post request to
*    server when you are using axios.post() or fetch() , but when you don't use ajax, you have a route that when we send a post
*    request to that route, some certain functions will run. Those functions will get the data from req.<name of the HTML field> object
*    and ... So in this case, you must use that famous csrf hidden input.
* */

/* At the moment our server is just an express application and it's serving our express app, but now we also want the server
* to power socket connections.So we must change things a little bit in order to do both of things.
* http package is a default package in node so it doesn't need to install it. */

/* In the above line we just created a server that is going to use our express app as it's handler. Now instead of exporting
* app in our app.js we must export server constant. */
const server = require('http').createServer(app);

/* Add a socket functionality to the server.
* After this we must go to our db.js file, (the file that actually tells our app to begin listening on port 3000), now instead
* of telling app to listen, it's going to tell our overall server to beginning listening on port 3000. In other words it's now
* going to power both our express app and our socket connections.
* Now we need to make sure that our frontend is loading the socket.io JS, so it can connect to the server. So in footer.ejs
* and if the user is logged in we can write the <script> to load   */
const io = require('socket.io')(server);

/* In parentheses of io.use(); we give it a function that will run, anytime that is a new transfer of data.The name of parameters
* isn't important.
* Actually the code below is just making our express session data available within the context of socket.io        */
io.use((socket, next) => {
    sessionOptions(socket.request, socket.request.res, next);
});

/* The parameter in the callback of .on() method, represents the connection between server and browser.
* Remember the next socket event will run, when a new connection is established (we establish a new connection in openConnection() method
* in chat.js in our frontend) */
io.on('connection', (socket) => {

    /* The second arg is when server detects an event of the first arg type, it would run that second arg callback function for
      response.
      Now remember, browser sent along an object of data (in chat.js) when sending a request to server, so we can receive
      that object of data with including a parameter in second arg and in body of the callback function, we can access that
      object by using the name of parameter we choose for receiving the incoming data (in this case this parameter is dat)
      and say data.<the properties we have in the sent object>. (Remember the properties of this incoming object has set
      in our frontend JS file.) */

    /* Only if the web browser that has opened a socket connection, only if they are actually logged in, do the codes in the block of
    * if statement. */
    if (socket.request.session.user) {

        /* Important: When the server start to work, the 'connection' socket event will also begin to work.So when you visit
        *   the website, the socket connection is ready to work!So we say when the socket connection is ready to work (or in
        *   other words- when the express server is ready to work), if the user has logged in, send a socket connection to browser
        *   through 'welcome' socket event and send the username and avatar of current user to the frontend.
        *   But the other socket 'events' like 'chatMessageFromBrowser' or ... are waiting a specific  */
        const user = socket.request.session.user;

        socket.emit('welcome', {
            username: user.username,
            avatar: user.avatar
        });

        socket.on('chatMessageFromBrowser', (data) => {
            /* Remember: The server doesn't send a socket event named 'chatMessageFromServer' until it receives a socket request
            * from browser named 'chatMessageFromBrowser'. */



            /* Let's send the incoming data out or broadcast it to all of the connected users (users that have logged in and
            have opened the chat box before we send our request (message) to server.) */

            /* Important: If you wanted to emit an event only to the browser that sent you this message, we could say :
            *   socket.io(); but in this case we are saying io.emit() because we want to emit this event to everyone (all connected
            *   users.) */
            /* In the next line we are creating the response that server must send to all(because we are using io.emit() not socket.emit())
             browsers. data.message is exactly the message that browser sent to server and we are sending this message again to
             all browsers. So essentially we are taking the message that one browser sent to the server and then server is sending that
             out to all connected browsers. After this, we need go to the frontend JS and tell it what to do when it receives or
             detects an event of 'chatMessageFromServer'. So when we open the socket connection, we can set an event with the EXACT
              NAME that our server sends it's response to frontend to actually get the response from server (name of events in both
              frontend and backend must be the same!)*/

            /* It's a waste of server resources to send your own message back to you, so your message data would really only need to be
           * send to all other connected browsers.But in the next lines we are sending it to everyone including the person who
           * sent the message.So the author of that message doesn't need that data.So instead of io.socket() which io is our ENTIRE SERVER,
           * so because we are using entire server for sending data, it send data to all of the connected browsers. So we must use
           * socket.broadcast.emit() . This piece of code will emit this event to any and all connected browsers EXCEPT the socket connection
           * that sent the message in the beginning.
           *
           * Now our browser based JS would still need to know the username and avatar of the CURRENT user that logged in and sent the
           * message. */

            /* Let's send to browser the current username and avatar of person who open the socket connection (OR in better explanation,
             the person who send a socket request to server named 'chatMessageFromBrowser') in frontend from session data. */


            socket.broadcast.emit('chatMessageFromServer', {
                message: sanitizeHTML(data.message, {
                    allowedTags: [],
                    allowedAttributes: {}
                }),
                username: user.username,
                avatar: user.avatar
            });
        });
    }
});


// module.exports = app;
module.exports = server;

/* TODO: Store chat messages to database! So when browser get the request in response it sends back that message and also
*   call a request that store that message to DB. */
