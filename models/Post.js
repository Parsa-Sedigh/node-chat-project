const pool = require('../db');
const User = require('./User');
const sanitizeHTML = require('sanitize-html');

/* Important: It's better not to require models into other model files!!!!!!!!!! */
const Follow = require('./Follow');

/* Remember that the functions that are in router.js or the functions that are after declaring our routes in router file,
* have access to actual req and res objects not all of the functions! */

let Post = function (data, userSession, requestedPostId) {
    /* We receive the userSession because  */

    /* We must RECEIVE that incoming request from controller within a parameter inside the () of constructor function and
    * then STORE that data inside a property of our constructor function. */
    /* When we create a new instance of this constructor function, these properties will created and initialized. */
    this.data = data;
    this.errors = [];
    this.userSession = userSession;
    this.requestedPostId = requestedPostId;
}

Post.prototype.cleanUp = function () {

    if (typeof this.data.title !== 'string') {
        this.data.title = '';
    }

    if (typeof this.data.body !== 'string') {
        this.data.body = '';
    }

    /*Get rid of any bogus (additional) properties.In other words, if user tried to send along any extra properties that we
    * would not want to save in our database, we can essentially ignoring them or overwriting them (we must updating what that
    * data property should be.).In other words, this is an area that we can add on additional properties that weren't necessirlly
    * by the user.(It's not necessirly for user to add the date he or she is created this post and ...) */

    /* With use sanitize, it will completely removes the <script> tags and it will strip the HTML tags (ex: in <div>Text</div>
    it will delete that <div> and Text will only remain.) */

    this.data = {
        title: sanitizeHTML(this.data.title.trim(), {
            allowedTags: [],
            allowedAttributes: []
        }),
        body: sanitizeHTML(this.data.body.trim(), {
            allowedTags: [],
            allowedAttributes: []
        }),
        createdDate: new Date(),
        authorID: this.userSession.user.userID
    }

}

Post.prototype.validate = function () {
    if (this.data.title === '') {
        this.errors.push('You must provide a title.');
    }

    if (this.data.body === '') {
        this.errors.push('You must provide post content.');
    }
};

Post.prototype.create = function () {
    console.log(this.data);
    return new Promise(async (resolve, reject) => {
        this.cleanUp();
        this.validate();

        if (!this.errors.length) {
            //Save post into database.
            try {

                // await pool.query('INSERT INTO `posts` (`title`, `body`, `author_id`, `created_date`) VALUES (?, ?, ?, ?)', [this.data.title, this.data.body, this.data.authorID, this.data.createdDate]);
                const results = await pool.query('INSERT INTO `posts` (`title`, `body`, `author_id`, `created_date`) VALUES (?, ?, ?, ?)', [this.data.title, this.data.body, this.data.authorID, this.data.createdDate]);

                /* important: When you assign the result of a INSERT mysql query into a variable it doesn't return the data of
                *   inserted stuff, but it will (I used will: because it takes some time to completes) return the id of that
                *   inserted row in the db. so I used it.Because we want it in postController.js file. */

                resolve({
                    results: results,
                    insertedRowId: results[0].insertId
                });
            } catch (error) {

                /* If we have a problem in this situation, the problem is nothing to do with user and problem is from our
                * server. */
                this.errors.push('Please try again later.');
                reject(error);
            }

        } else {
            reject(this.errors);
        }
    });
}

Post.prototype.update = function () {
    return new Promise(async (resolve, reject) => {

        /* First we have to find the relevant post row in DB, because before we worry about updating anything, we want to make sure
        * that the post id that just included in this URL : If that id doesn't exist or is a valid id and also we need to know
        * who the author of it is?  */
        try {

            /* Remember if the findSingleById rejects, the catch block will take care of it. */
            const post = await Post.findSingleById(this.requestedPostId, this.userSession.user.userID);

            if (post.isVisitorOwner) {
                /*It is safe to update the post in db*/
                /* Remember we don't need to use try catch blocks for this.actuallyUpdate() because this method just have resolve()
                * and doesn't have any reject to receive that reject() in catch() block.  */
                const status = await this.actuallyUpdate();
                resolve(status);
            } else {
                /* Whoever is trying to send this request is not a good user and he is malicious.Because definitely the author of post
                * will send a post request to update the post not other users.So now we know he is a malicious user.Therefore we must
                * reject this promise... */
                reject();
            }
        } catch (error) {
            console.log(error);
            reject();
        }
    });
};

Post.prototype.actuallyUpdate = function () {
    return new Promise(async (resolve, reject) => {
        this.cleanUp();
        this.validate();
        if (!this.errors.length) {

            await pool.query('UPDATE `posts` SET `title` = ?, `body` = ? WHERE `id` = ?', [this.data.title, this.data.body, this.requestedPostId]);
            resolve('success');
        } else {
            resolve('failure');
        }
    });

};

/* concat() will return a new array and whatever we pass in to that, it's going to add that onto the original array(in
this case this original array is uniqueOperations array.)     */

/* How we add properties or a function to a function? In JS a function is an object just like any other object. Meaning
* we can use it's namespace or we can store properties within it.So now in our postController we can leverage Post, either as
* a constructor function (OOP) or we can just simply call a really simple function on it. */

/* The purpose of this function is get the post with it's related author.  */
Post.findSingleById = (id, visitorId) => {
    return new Promise(async (resolve, reject) => {

        /* Anytime we are going to use user's input data to build a query, we need to make sure it's just a simple string and not object
        * or anything else.     */
        if (typeof id !== 'string') {
            reject();
            return;
        } else {
            try {

                /* We are using aliases for column names, so for further code like receiving the resolved data in postController and
                * pass those value to ejs template we must use these aliases instead of real column names. */
                const post = await pool.query('SELECT posts.id as post_id, posts.title, posts.body, posts.author_id, posts.created_date, users.id as user_id, users.username, users.email FROM `posts` INNER JOIN `users` ON ' + id + ' = posts.id LIMIT 1');

                /* important: So if the relatedUser[0][0].user_id matches the visitorId he is the author and can see the edit and delete button
                *   in single-post-screen.ejs template.  */
                const relatedUser = await pool.query('SELECT users.id as user_id, users.username, users.email FROM `users` INNER JOIN `posts` ON ' + post[0][0].author_id + ' = users.id LIMIT 1');

                let isVisitorOwner = false;
                if (relatedUser[0][0].user_id === visitorId) {
                    isVisitorOwner = true
                }

                const avatar = new User(relatedUser[0][0], true).avatar;

                if (post[0].length && relatedUser[0].length) {

                    resolve({
                        postData: post[0],
                        relatedUser: relatedUser[0],
                        avatar: avatar,
                        isVisitorOwner: isVisitorOwner
                    });
                } else {
                    reject();
                }
            } catch (e) {
                reject(e);
            }
        }
    });
};

/* The purpose of this function is to get all of the related posts that have been created by that authorID */
Post.findByAuthorID = (authorID) => {

    /* The parameter that is sent through our userController to this file is the id of author of posts which is equal to id of
    * user in the users table.(this parameter is created by findByUsername() function and then passed into profilePostsScreen() function
    * in userController and then userController passed this id into this function) */
    return new Promise(async (resolve, reject) => {
        if (typeof authorID !== 'number') {
            reject('type of id is not a number');
            return;
        } else {
            /* Now we must get all of the posts that are created by this authorID. */

            try {
                const posts = await pool.query('SELECT * FROM `posts` WHERE ? = author_id ORDER BY created_date DESC', [authorID]);

                resolve(posts[0]);
            } catch (error) {
                reject(error);
            }

        }
    });
}

Post.delete = (postIdToDelete, currentUserId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(postIdToDelete, currentUserId);

            if (post.isVisitorOwner) {
                await pool.query('DELETE FROM `posts` WHERE `id` = ?', [post.postData[0].post_id]);
                resolve();
            } else {
                /* Someone that isn't the owner of post is trying to delete a post. */
                reject();
            }

        } catch (error) {
            /* Post id is not valid or post doesn't exist. */
            console.log(error);
            reject();
        }

    });
};

Post.search = (searchTerm) => {
    return new Promise(async (resolve, reject) => {
        /* If there is no searchTerm (empty) we don't want to talk to DB because searchTerm would be undefined
        (yes, we are checking that if the input value is not empty and then use axios and send a request, but again in this file,
        we are checking this condition.) */
        if (typeof searchTerm !== 'string') {
            reject();
        } else {

            /* important: When using wildcards in prepared stmts, you need to insert wildcards in values itself not in the sql query.
            *   such as below:
            *   and also remember when you have two conditions which both have same thing to compare to them, you have to
            *   include that thing in both conditions not one of them so : ... WHERE posts.title OR posts.body LIKE ? , is wrong and
            *    ... WHERE posts.title OR posts.body LIKE ? is right. */

            /* INNER JOINS or JOINS must be before WHERE clause and if we put WHERE before INNER JOIN it will give errors. */

            const posts = await pool.query("SELECT posts.id AS post_id, posts.title AS post_title, posts.body AS post_body," +
                " posts.author_id, posts.created_date, users.id AS user_id, users.username, users.email FROM `posts` INNER JOIN `users` ON " +
                "users.id = posts.author_id WHERE posts.title LIKE ? OR posts.body LIKE ?",
                ['%' + searchTerm + '%', '%' + searchTerm + '%']);

            // console.log(posts[0]);
            posts[0].forEach((post) => {
                const user = new User(post);
                user.getAvatar();
                post['avatar'] = user.avatar;
            });




            resolve({
                data: posts[0]
            });
        }
    });
};

Post.countPostsByAuthor = (id) => {
    return new Promise(async (resolve, reject) => {

        /* Important: When the result of pool.query() returns the 'COUNT(*)' will become the key of object and the access to
        *   this property is difficult so we can use AS  in sql query to convert COUNT(*) to another word that is easier to
        *   access it. In this case it will become counts instead of 'COUNT(*)'. */
        const postCount = await pool.query('SELECT COUNT(*) AS counts FROM `posts` WHERE posts.author_id = ?', [id]);

        resolve(postCount[0][0].counts);
    });
};

Post.getFeed = async (id) => {
    /* 1) Create an array of user ids that the current user follows.So in order to query posts table, we need to know which authors of
    * posts to look for. */

    /* Important: It's not a good practice to use one model inside another model???? */
    const followedPosts = await pool.query('SELECT posts.id AS post_id, posts.title, posts.body, posts.author_id, posts.created_date, users.username, ' +
                                                'users.email FROM `follows` ' +
                                                'INNER JOIN `posts` ON posts.author_id = follows.followed_id ' +
                                                'INNER JOIN `users` ON users.id = follows.followed_id ' +
                                                'WHERE follows.follower_id = ? ORDER BY posts.created_date DESC', [id]);

        /* Get avatar for each followed user by that id in () of getFeed. */
       followedPosts[0].map((followedPost) => {
           const user = new User(followedPost, true);
           const avatar = user.avatar ;
           followedPost['avatar'] = avatar;
        });

    /* Mongo :
    *  Because the id that this function receives is string, we want it to convert it to mongo db ObjectID object type.
    *     const followedUsers = await followsCollection.find({authorId: new ObjectID(id)}).toArray();
    *
    *   However, the only thing that we want is the followed_id not anything else, so let's manipulate the data we want from
    *   followedUsers with .map() method on followedUsers :
    *   let followedUsers = followedUsers.map((followDoc) => {
    *       return followDoc.followed_id;
    *   });
    *
    *   return Post.reusablePostQuery([
    *       {$match: {author: {$in: followedUsers}}},
    *       {$sort: {createdDate: -1}}
    * ])
    *
    *   altogether, the above return say : Find any post document where the author value is a value that is in our array of
    *   followedUsers. createdDate: -1 says the newest ones at top.
    */

    /* 2) Look for posts where the author is in the above array of followed users by this profile and these posts is what we
    * want from this function to returns or resolves with. It's already DONE in our query!!!! (In our query the newest posts
    * must be at top.) */

    /* Remember: Instead of these commented out lines of code which won't work, we can use INNER JOIN on our query in above. */
    // const posts = followedUsers[0].map(async (followedUser) => {
    //    const posts = await pool.query('SELECT * FROM `posts` WHERE posts.author_id = ?', [followedUser]);
    //    return posts[0];
    // });
    // console.log(posts);

    return followedPosts[0];
};

module.exports = Post;

