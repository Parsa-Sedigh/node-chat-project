const pool = require('../db');
const User = require('../models/User');

/* In follows table, follower_id is the one who we are following him and the follower_id is the id of us!! */

/* Remember: In follows table, follower_id is the id of user that is doing the follow and followed_id is the id that they
* are following him. */

const Follow = function (followedUsername, visitorId) {
    /* The first parameter of Follow constructor function is the username of the user we are trying to follow right now.But for
    * storing who is following who, we must store their ids.But for searching in db we can use their username.
    * The second arg is the id of user that trigger this follow functionality, or the user that is doing the following.  */

    this.followedUsername = followedUsername;
    this.visitorId = visitorId;
    this.errors = [];
}

Follow.prototype.cleanUp = function () {
    if (typeof this.followedUsername !== 'string') {
        this.followedUsername = '';
    }
};

Follow.prototype.validate = async function (action) {
    /* We don't need to use : return new Promise((resolve, reject) => {}) in this async function, because we will use this function
    * in another async function which that function has return new Promise((resolve, reject) => {}) so that function SOMEHOW (or kind of),
    *  will take care of resolving and rejecting this promise too! */

    /* Let's check to make sure that the username they want to follow, actually matches with an existing account.I know definitley
    * there must be an account on the screen to follow that account so it must be exist, but maybe the user is trying to send
    * the post request via postman, so there would be a little possibility that the username they want to follow does not exist!
     */
    const followedAccount = await pool.query('SELECT * FROM `users` WHERE users.username = ?', [this.followedUsername]);

    if (followedAccount[0].length) {
        /* Instead of storing the username of the followed account, we must store the id of that account in DB, because in many apps
        * users can change their username, so we want to store something that is permanent. */

        this.followedId = followedAccount[0][0].id;
    } else {
        this.errors.push('You can\'t follow a user that does not exist.');
    }

    /* We are going to do some validation with using DB... */
    let doesFollowAlreadyExist = await pool.query('SELECT * FROM `follows` WHERE follower_id = ? AND followed_id = ?', [this.visitorId, this.followedId]);

    if (action === 'create') {
        /* Now we want make sure that a follow row in DB which is matching with these two ids (this.visitorId and this.followedId)
        * does not already exist. */

        if (doesFollowAlreadyExist[0].length) {
            /* So if the follow already exists and the incoming request is trying to create another follow so we must prevent this
            * from happening so we can push an error message into our errors array. */

            this.errors.push('You are following this user!');
        }
    }

    if (action === 'delete') {
        /* Now we want make sure that a follow row in DB which is matching with these two ids (this.visitorId and this.followedId)
        * does not already exist. */

        if (!doesFollowAlreadyExist[0].length) {
            /* So you should not be able to stop following or remove a follow from someone you're not already following. */

            this.errors.push('You can not stop following someone you do not already following!');
        }
    }

    /* You should not be able to follow yourself.For checking this, we can evaluate this situation by checking the ids of
    * user that made a post request or visitor id and the id in database which is the id of current user that made the request.
    * Why we didn't check the usernames? Because the usernames may change.So if the id of current user is equal to someone he is
    * trying to follow means he is trying to follow himself...
    *   */
    if (this.visitorId === this.followedId) {
        this.errors.push('You can not follow yourself!')
    }


};

Follow.prototype.create = function () {
    return new Promise(async (resolve, reject) => {
        this.cleanUp();
        await this.validate('create');

        if (!this.errors.length) {
            await pool.query('INSERT INTO `follows` (follower_id, followed_id) VALUES (?, ?)', [this.visitorId, this.followedId]);

            resolve();
        } else {
            reject(this.errors);
        }
    });
};

Follow.prototype.delete = function () {
    return new Promise(async (resolve, reject) => {
        this.cleanUp();

        /* You can't remove a follow, if you do not already following that user and also you should not add a follow if you're already
        * following that user(yes it would be a POST request and POST request are harder to make for users than GET but let's imagine
        * the user somehow managed to POST this request, so we must prepare for this situation too!).For enforcing these rules in
        * delete functionality, we can pass validate() method, a string of text and let it know which action we're currently performing.
        * So now validate() method will perform a right action based on the parameter that we are passing to it.*/
        await this.validate('delete');

        if (!this.errors.length) {
         await pool.query('DELETE FROM `follows` WHERE follows.follower_id = ? AND follows.followed_id = ?', [this.visitorId, this.followedId]);

            resolve();
        } else {
            reject(this.errors);
        }
    });
};

Follow.isVisitorFollowing = async (followedId, visitorId) => {
    try {

        /* Yes in validate() method we are also again creating this query but we created this function separately for using
        * it in userController and this function shouldn't do anything more, so we can't use .validate() in userController too!
        * So this is why we created this function. */
        const followRow = await pool.query('SELECT * FROM `follows` WHERE follower_id = ? AND followed_id = ?', [visitorId, followedId]);

        if (followRow[0].length) {
            return true;
        } else {
            return false;
        }
    } catch(errors) {
        console.log(errors);
    }

};

Follow.getFollowersById = (id) => {
    /* Parameter id is like follower_id in follows table. */

    return new Promise(async (resolve, reject) => {
        try {
            let followers = await pool.query('SELECT follows.follower_id, follows.followed_id, users.username, users.email ' +
                                                    'FROM `follows` INNER JOIN `users` ON follows.follower_id = users.id ' +
                                                    'WHERE follows.followed_id = ?', [id]);

            /* Now let's manipulate the followers[0] to get the data of followers of this profile that we really want in our
            front end(we need the username of who is doing the following and the avatar of whoever is following this profile).
            important: We couldn't use .forEach in next lines because forEach() doesn't return new array or in fact anything!*/
            followers[0] = followers[0].map((follower) => {
                const user = new User(follower, true);
                return {
                    username: follower.username,
                    avatar: user.avatar
                }
            });

            resolve(followers[0]);
        } catch (error) {
            /* In catch we have an issue definitely, so we can use reject() to reject that promise. */
            console.log(error);
            reject();
        }


        /* const followers = await followsCollection.aggregate([1
              {$match:{followedId: id}},
              {$lookup: {from: "users", localField: "follower_id", foreignField: "_id", as: "userDoc"}},
              ${$project: {
                  username: {$arrayElemAt: ["$userDoc.username", 0]},
                  email: {$arrayElemAt: ["$userDoc.email", 0]}
              }}
         ]).toArray();

          followers = followers.map((follower) => {
            Whatever we return within this function is what will added to the new array.

            Create a user:


          });

         */

        /* Mongo: .aggregate() is going to return data that makes sense for mongo, but maybe wouldn't make sense for our app from
        * raw JS perspective and remember .toArray() is not going to RETURN an array as much as it's going to resolve with value
        * of an array. Because followsCollection.aggregate().toArray(); it's going to return with a promise.So we must wait for it.
        * But remember when using await, you must use it with try catch blocks.
        *
        * In mongo, localField meaning which field in the follow document you want to perform this lookup or match by?
        * In the object that we pass in to $project, we can specify what should be exists in the object that it returns.So
        * if you don't specifically list a property here, it's not going to be included.
        * We give 0 in "$userDoc.username" array, because userDoc is actually going to be an array of any matching looked up
        * document.We know we are interested in the first item in that array so we are setting a username property and on that
        * first item in the array, we are grabbing the username property.
        * So now what .toArray() is going to return is an array, each item in that array will be an object, that has properties
        * username and email of person that is following the profile user.
        *      */
    });
};

Follow.getFollowingById = (id) => {
    /* We want to show a list of the users that this person is following them. So this person is follower of those usernames
    * and those usernames become the followings of this user. So in SQL query, in WHERE clause we must look for the id of the
    * current user profile which is the follower of those usernames, so we can say : WHERE follows.follower_id = id and in
    * INNER JOIN we must look for the persons that this user is following them so we must look for the followed_id of this
    * user, and we knew this user is following them and for getting the information of these persons we must INNER JOIN
    * the ids of these persons in follows table and users table.Which in follows table, the id of these persons is in followed_id.
    * Right? */

    return new Promise(async (resolve, reject) => {
        try {
            let following = await pool.query('SELECT follows.follower_id, follows.followed_id, users.username, users.email ' +
                'FROM `follows` INNER JOIN `users` ON follows.followed_id = users.id ' +
                'WHERE follows.follower_id = ?', [id]);

            following[0] = following[0].map((item) => {
                const user = new User(item, true);
                return {
                    username: item.username,
                    avatar: user.avatar
                }
            });

            resolve(following[0]);
        } catch (error) {

            console.log(error);
            reject();
        }

    });
};

Follow.countFollowersById = (id) => {
    return new Promise(async (resolve, reject) => {
        /* We want to get the number of accounts that are following this profile.So we must look for ids that are followed by
        * other ids. */

        /* Important: When the result of pool.query() returns the 'COUNT(*)' will become the key of object and the access to
        *   this property is difficult so we can use AS  in sql query to convert COUNT(*) to another word that is easier to
        *   access it. In this case it will become counts instead of 'COUNT(*)'. */
        const followerCount = await pool.query('SELECT COUNT(*) AS counts FROM `follows` WHERE follows.followed_id = ?', [id]);

        resolve(followerCount[0][0].counts);
    });
};

Follow.countFollowingsById = (id) => {
    return new Promise(async (resolve, reject) => {
        /* We want to get the number of accounts that this profile is following them.So we must look for ids that are followed by
        * this profile in follows table in DB.In other words this profile is the follower of those persons, so we must look for
        * ids in follower_id column that are equal to this profile id.  */

        /* Important: When the result of pool.query() returns the 'COUNT(*)' will become the key of object and the access to
        *   this property is difficult so we can use AS  in sql query to convert COUNT(*) to another word that is easier to
        *   access it. In this case it will become counts instead of 'COUNT(*)'. */
        const followingCount = await pool.query('SELECT COUNT(*) AS counts FROM `follows` WHERE follows.follower_id = ?', [id]);

        resolve(followingCount[0][0].counts);
    });
};

module.exports = Follow;


