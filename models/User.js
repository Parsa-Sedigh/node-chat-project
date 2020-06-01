const bcrypt = require('bcryptjs');
const pool = require('../db');
const validator = require('validator');
const md5 = require('md5');

/* If getAvatar is true, then within constructor function we just automatically call our getAvatar method and if the getAvatar is
* false or or if we call this constructor function without including a second argument at all then we won't call that method automatically. */

let User = function (data, getAvatar) {
    this.data = data;
    this.errors = [];
    if (getAvatar === undefined) {
        getAvatar = false;
    }
    if (getAvatar === true) {
        this.getAvatar();
    }
}

/* Important: There is 2 places for create and also add properties to user's session: 1) When user registers 2)When user logs in */

/* We don't want to receive anything other that string (like objects and array and ...) */
User.prototype.cleanUp = function () {
    if (typeof this.data.username !== 'string') {
        this.data.username = '';
    }

    if (typeof this.data.email !== 'string') {
        this.data.email = '';
    }

    if (typeof this.data.password !== 'string') {
        this.data.password = '';
    }

    /* Get rid of any bogus properties that users may send.So we can declare our required properties
    * to register the user.In other words we are clearing or purifying our data property if user send
    * any bogus property.So this way we are overriding or updating our data property.
    * So when the user included any bogus properties, we are just updating or overriding that sent properties
    * manually spelling out which properties we actually want.   */
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    };

}

User.prototype.validate = function () {
    return new Promise (async (resolve, reject) => {

        if (this.data.username === '') {
            this.errors.push('You must provide a username.');
        }

        /* We don't want users send special characters. */
        if (this.data.username !== '' && !validator.isAlphanumeric(this.data.username)) {
            this.errors.push('Username can only contain letters and numbers.');
        }

        /* isEmail() is a method in validator package. */
        if (!validator.isEmail(this.data.email)) {
            this.errors.push('You must provide a valid email address.');
        }

        if (this.data.password === '') {
            this.errors.push('You must provide a password.');
        }

        if (this.data.password.length > 0 && this.data.password.length < 6) {
            this.errors.push('Password must be at least 6 characters.');
        }

        if (this.data.password.length > 10) {
            this.errors.push('Password can not exceed 10 characters.');

        }

        if (this.data.username.length > 0 && this.data.username.length < 3) {
            this.errors.push('Username must be at least 3 characters.');
        }

        if (this.data.username.length > 10) {
            this.errors.push('Username can not exceed 10 characters.');
        }

        //Only if username is valid, check if it's already taken.
        if (this.data.username.length > 2 && this.data.username.length < 10 && validator.isAlphanumeric(this.data.username)) {

            try {

                const usernameExists = await pool.query('SELECT * FROM `users` WHERE `username` = ?', [this.data.username]);

                if (usernameExists[0].length) {
                    console.log(usernameExists);
                    this.errors.push('That username is already taken.Please try something else.');
                }
            } catch(error) {
                console.log(`Can not query database. The error is ${error}`);
            }

        }

        //Only if username is valid, check if it's already taken.
        if (validator.isEmail(this.data.email)) {

            try {

                const emailExists = await pool.query('SELECT * FROM `users` WHERE `email` = ?', [this.data.email]);


                if (emailExists[0].length) {
                    console.log(emailExists);
                    this.errors.push('This email is already being used.Please use another one.');
                }
            } catch(error) {
                console.log(`Can not query database. The error is ${error}`);
            }

        }

        /* important: We must use resolve() to show this promise has complete and when we are calling our validate function we must use
        *   await for waiting this function to actually complete and also make that wrapper function an async function too!
        *   The wrapper function is function that we are calling our validate function so we must use async keyword for that
        *   function too.So now we run into another issue. Which is : Now that wrapper function (which in this case is register method)
        *   is an async function so we must give it a chance to complete.Because in place that the register method is called,
        *   the next operations are depending on result of this function so this function must be completed before we go
        *   to the next line.So we can give it a chance to complete by making that register method to return a promise and then
        *   when we are calling that async function we must await for it to fully completed.
        *   Now for making that async function to do it's async operations and then can complete it's operations we must wrap
        *   into a promise so it can return a promise and when that promise is complete (resolved or rejected) we can use the
        *   values of that function.
        *   Also remember async functions return promise so whether in the place that we are calling that async function,
        *   those next lines are depending on that function to complete or not we must make that function to return promise
        *   manually (by saying return new Promise() ...) or automatic (the function has some async operations that returns
        *   promises automatically.)*/
        resolve();

    });
};

// User.prototype.login = function (callback) {
//    this.cleanUp();
//
//    /* For the second argument in .query(), we provide an anonymous function that will run, when the query to db is complete. */
//    connection.query('SELECT * FROM `users` WHERE `username` = ? AND `password` = ?',[this.data.username, this.data.password] ,(err, attemptedUser) => {
//
//       /* When .query() calls the third arg of it's args, if you use the function() keyword in the third arg of connection.query()
//       *  because it's not the user object that is directly calling our function so JS will consider that is global object is
//       * calling that third arg function so it will set this to global object instead of user object.So we must use arrow functions.  */
//       if(attemptedUser.length) {
//          /* Now we must send a response to browser but it's not the job of model to send the response.That is the job of
//          * controller.So we must go to userController.js and send a response based on login was successful or not.But how we
//          * gonna know login was successful or not? Well, we can add a property to User model so every user object would have a
//          * property and that property can specify whether the login was successful or not.But with this workaround we still got
//          * an issue and that is we are not exactly know when to send back our response.
//          *
//          * In other words, the problem is we don't know how long this login method is going to take.Because it's working with
//          * database so it could take long any time!So the question becomes: How we can wait until login method has a chance
//          * to do it's job and then send back it's response to the browser?
//          *
//          * Solution: We can use a callback function.So we pass in an anonymous function to user.login(); so that callback function
//          * is an argument for login() method so in User.js we can receive that function as an arg and call it callback.So
//          * it would something like this:
//          *
//          * User.prototype.login = function (callback) {
//          *
//          * }
//              */
//          callback('congrats!!!');
//       }
//
//       else {
//          callback('Invalid username/password');
//       }
//    });
// }
//
// And when you want to use this function:
// user.login((result) =>{
//      res.send(result);
//      });
// result will be the value of that callback we pass in to that function.
//

/* important: You shouldn't use pool.release(); inside of pool.getConnection(()=>{}) callback.So you must use it outside
*   of that callback. */

/* important: You must return the success or fail message within the body of inner callback (when query to database)
       and resolve() or reject() those messages out of body of inner callback.(In the body of callback for new Promise())*/

/* learn: When you have a function or method that you don't know how much is gonna take to return a value or doing it's job(
    even without returning anything), you can pass in a callback function to this function that you don't know how much gonna take
    and when you are defining or declaring that function you can pass in that callback into the parentheses and then inside of
    that function you can call that argument which is the callback and then we can give this callback whatever we want this function
    returns after it's job is done.*/

/* learn: Assume you got : eatBreakfast(() => {
    })
     This is important that you understand that eatBreakfast() function will not call that callback function until it(eatBreakfast())
     finishes it's work! (See what is a promise part-2 of Brad's JS course.)*/

/* This is another solution using callbacks */


User.prototype.login = function () {

    // let result;
    // const connection = await pool.getConnection();
    // connection.execute('SELECT * FROM `users` WHERE username= ? AND password =?', [this.data.username, this.data.password], (error, attemptedUser) => {
    //     if (error) {
    //         throw error;
    //     } else {
    //          result = 'dsa';
    //          return result;
    //     }
    // });

    /* Remember: We can not use result[0][0].id in our conditions because maybe they are undefined(because there isn't any
    id property within the first array of the result array).The best way for using conditions checking result[0].length */

    // return new Promise((resolve, reject) => {
//     this.cleanUp();
//     pool.query("SELECT * FROM `users` WHERE `username` = " + "'" + this.data.username + "'" + " AND `password` = " + "'" + this.data.password + "'" + "", (error, attemptedUser, fields) => {
//
//         if (error) {
//             reject(error);
//         } else if (attemptedUser.length) {
//             resolve(attemptedUser);
//         } else {
//             resolve('You are not allowed');
//         }
//
//     });
//
// });

    return new Promise(async (resolve, reject) => {
        this.cleanUp();

        try{
            const attemptedUser = await pool.query("SELECT * FROM `users` WHERE `username` = ?", [this.data.username]);

            if (attemptedUser[0].length && bcrypt.compareSync(this.data.password, attemptedUser[0][0].password)) {


                const avatar = new User(attemptedUser[0][0], true).avatar;

                resolve({
                    message: 'Ok you are in',
                    userData: attemptedUser[0][0],
                    avatar: avatar,
                    id: attemptedUser[0][0].id
                });
            } else {
                reject('Invalid username/password');
            }
        } catch(error) {
            console.log(error);
            reject('There is some problem in server');
        }

    });


    // question: return new Promise((resolve, reject) => {
    //     pool.query('SELECT * FROM `users` WHERE `username` = ? AND `password` = ?',[this.data.username, this.data.password], (error, attemptedUser, fields) => {
    //
    //         if (error) {
    //             reject(error);
    //         } else if(attemptedUser.length) {
    //             resolve(attemptedUser);
    //         } else {
    //             resolve('You are not allowed');
    //         }
    //
    //     });
    //
    // });

    /* Also remember: When we create a promise we give it an anonymous function as an arg but if we use function keyword
        * in this situation will change the value of this.So we must use arrow functions.  */

    /* Now within the body of this function we can perform our asynchronous operations and whenever those operations complete
    * we just call resolve or reject.That's how we let JS know that this promise has either completed in the case of
    * resolve or has been rejected.*/
}

User.prototype.register = function () {
    return new Promise(async (resolve, reject) => {

        // step #1 : Validate user data
        this.cleanUp();

        /* Remember if a function is an async function, it must defenitly return a promise to use .then() and ... for consume and
        * use that function. */

        await this.validate();


        // step #2 : Only if there are no validation errors, then save the user data into the database
        /* If the errors array is empty : */
        if (!this.errors.length) {

            /*hash the user password: First we must create the salt and then overwrite the user password.
            * The first parameter of .hashSync() is the value you want to hash and the second parameter is salt. */
            let salt = bcrypt.genSaltSync(10);
            this.data.password = bcrypt.hashSync(this.data.password, salt);

            await pool.query('INSERT INTO `users` (`username`, `email`, `password`) VALUES (?, ?, ?)', [this.data.username, this.data.email, this.data.password]);
            const result = await pool.query("SELECT * FROM `users` WHERE `username` = ?", [this.data.username]);

            const avatar = new User(result[0][0], true).avatar;

            /* Why we are calling .getAvatar() method after database action?Because we don't want to store the avatar URL in
            * database permanently.Because maybe in future the gravatar service changes their URL structure? So we can't store
            * the avatar URL in database.So we can generate the avatar url for each user on the fly when we need it.For example
            * in the user's session data.
            * It doesn't affect performance because md5 hashing is a quick operation.So we are storing avatar on user object
            * in memory instead of database. */
            console.log(result[0][0]);

            resolve({
                message: 'You now have an account.Enjoy!',
                userData: result[0][0],
                avatar: avatar
            });
        } else {
            reject(this.errors);
        }

    });
};

User.prototype.getAvatar = function () {
    /* User's avatar coming from gravatar, and the template of url for theses avatars is: `https://gravatar.com/avatar/email?s=128` */
    /* In the line below, we are saying: Now a user object will have a property named avatar and this property is a URL that
    * points towards a photo(avatar).
    * We must call this function at appropriate times.Once the user has logged in and when the users seccussful registers. */

    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
}

/* We are not using OO approach here so we shouldn't use .prototype here. */
User.findByUsername = (username) => {
    return new Promise((resolve, reject) => {
        if (typeof username !== 'string') {
            reject();
            return;
        } else {

            /* If the mysql operation was successful it will resolve with the data it found.So we can receive this data by
            * providing a parameter in parentheses of .then() method. */
            pool.query('SELECT * FROM `users` WHERE `username` = ?', [username])
                .then((userRow) => {
                    if (userRow[0].length) {

                        /* If we successfully found a user, our controller want to save that user data onto the req object, so we
                        * can use it to actually display the user's profile and also their IDs so then we can find the posts
                        * written by that id or user.But we don't want to resolve the all of the incoming data from DB.Because
                        * we don't want password and ....
                        * Remember we must get the user's avatar by calling getAvatar() method from User because the user's avatar
                        * doesn't coming from database so we must create it by calling getAvatar().Also another reason for making
                        * an instance of User is to get rid of unnecessary data by reassigning it to userRow[0][0] */
                        userRow = new User(userRow[0][0], true);

                        userRow = {
                           id: userRow.data.id,
                           username: userRow.data.username,
                           avatar: userRow.avatar
                        };

                        resolve(userRow);
                    } else {
                        reject();
                    }
                })
                .catch(() => {
                    reject();
                });
        }
    });
}

User.doesEmailExist = (email) => {
    return new Promise(async (resolve, reject) => {
        /* Let's check if the email value that frontend sent to us, is an innocent string of text or it is malicious? */

        if (typeof email !== 'string') {
            resolve(false);

            /* Now we want to stop any further execution of the whole function, because we don't want that value which the user
            * sent use and maybe it is malicious, to get near our database in further codes. So we must use return;
            * and remember the else {} is not necessiry, because if the condition of if statement is true it would not  */
            return;
        } else {
            const user = await pool.query('SELECT users.email FROM `users` WHERE users.email = ?', [email]);

            if (user[0].length) {
                resolve(true);
            } else {
                resolve(false);
            }

        }


    });
};

module.exports = User;

