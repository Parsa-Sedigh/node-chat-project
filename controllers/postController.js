const Post = require('../models/Post');

exports.viewCreateScreen = (req, res) => {

    /* The object we have in .render() is the data that we want to pass in to the template(first arg).
    * Remember: req.session is available!
    * important: We do not need to import or require anything.(req is available from the request that
    *  /create-post url is sending through get request.).req is available in this file, so req.session is also available. */
    // res.render('create-post', {
    //     username: req.session.user.username,
    //     avatar: req.session.user.avatar
    // });

    res.render('create-post', {
        title: `Create a post - ${req.session.user.username}`
    });
};

exports.create = (req, res) => {

    /* req.body will contain the form data that visitor just submitted. */


    let post = new Post(req.body, req.session);
    /* important: To get the values of fields in the <form> we must pass in or use req.body not req itself. */

    post.create()
        .then((result) => {
            req.flash('successMessages', 'New post successfully created.');
            req.session.save(() => {

                /* important: If the post is successfully created, we want to redirect user to view that new post.However since the post
                *   doesn't exist when this request began how we can know the id of that created post to redirect user to that
                *   URL?Because that id value won't even exist until the database operation has completed.
                *   What we can do is to set up post.create() method that when returns a promise, it will resolves with that is
                *   the new post id.  */

                res.redirect(`/post/${result.insertedRowId}`);
            });
        })
        .catch((errors) => {
            /* When the promise of .create() rejects, it's going to reject back with an array of errors.So we must include a
            * parameter within the parentheses of .catch() to receive that array coming from models.  */

            /* Remember that errors array in our flash, is available in our ejs templates without passing this array to res.render()
            * In the forEach() we are passing the validation errors for creating a post to our flash errors array. */
           errors.forEach((error) => {
                req.flash('errors', error);
                req.session.save(() => {
                    res.redirect('/create-post');
                });
           });
        });
};

exports.apiCreate = (req, res) => {
    let post = new Post(req.body, req.apiUser);

    post.create()
        .then((result) => {
           res.json('The post has been created.');
        })
        .catch((errors) => {
            res.json(errors);
        });
};

exports.viewSingle = async (req, res) => {
    try {

        /* In this case, because we are not creating or updating a post or needing to validate anything.(We don't want to use OOP approach.)
        * Within that function we want to retrieve a single post and we want to find it by it's id and within the parentheses
        * of this function we want to pass in the final segment whatever URL the visitor is trying to visit.  */

        /* We must determine if the current viewer that is viewing a post, is the author of the post or not?So we must pass in
        * a second argument to findSingleById() , and this second arg is the id of the current viewer of post.After this, our
        * model has all of the data that it needs to determine if that user id is the same user id as the author for the given post.
        * Now we want a reusable piece of code that will run at the start of every request and it will check to see if the current
        * visitor has a user object in his or her session data. If the viewer has the user object in his her session data
        * then we can grab their user id if they don't have that we can consider their user id to 0 .So we can set this up in our app.js file.
        * Remember we can set sth that will run for every request with app.use().We must set this after we the line of app.use(flash())
        * Because this task needs session and session's configuration is in app.use(sessionOptins) and app.use(flash()) */

        let post = await Post.findSingleById(req.params.id, req.visitorId);

        res.render('single-post-screen', {
            postData: post.postData,
            relatedUser: post.relatedUser,
            avatar: post.avatar,
            isVisitorOwner: post.isVisitorOwner,
            title: post.postData[0].title
        });

    } catch(error) {
        console.log(error);
        res.render('404');
    }

}

exports.viewEditScreen = async (req, res) => {
    /* First we need to ask from our Post model, the data for this post and then render a an edit screen template. */

    /* We need to pass in the current id in the url so we use req.params.id id is defined in router.js as :id and remember findSingleById()
    * function will return a promise and we wouldn't do any furthure stuff until we have actually have the data that will return from
    * the promise so we must wait for that promise so we use await.Remember: We must use try catch blocks when we are using async await to
    * prepare for rejected promise too! */
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId);

        /* important: Remember: We don't need to pass in our flash messages to our templates, because we wrote a app.use() for flash
        *   messages so these flash messages are available in our req objects anywhere so we can use these flash messages in our
        *   templates without using any objects and just by using the name of that array in flash. */
        // if (post.postData[0].author_id === req.visitorId) {
        //     res.render('edit-post', {
        //         post: post
        //     });
        //}
        if (post.isVisitorOwner) {
            res.render('edit-post', {
                post: post,
                title: `Edit post - ${req.session.user.username}`
            });
        } else {
            req.flash('errors', 'You do not have permission to edit the post that is not belong to you.');

            /* In arrow function if you stand in a single line you do not need {}. */
            req.session.save(() => {
                res.redirect('/');
            });
        }

    } catch(error) {
        console.log(error);
        res.render('404');
    }
};

exports.edit = (req, res) => {

    /* We need to update that specific post so we must interact with our model so let's create a new instance of Post model.
    * req.body is the submitted form data and also need to pass in the id of current visitor and also the id of current post that
    * is requested to edit and this id is the part of this URL.*/
    let post = new Post(req.body, req.session, req.params.id);

    post.update()
        .then((status) => {
            /* In these 2 situations the promise would be resolved. So in order to know which one of these 2 situations is the case
            * we can just set up our update promise to resolves with a status code.So we'de want to receive that status code after
            * the promise resolves, so we can make up a parameter within the parentheses of .then()*/

            /* 1) If the promise was successful or resolves that would mean : The post successfully updated in the database.*/

            /* 2) Or maybe user does indeed have the permission to send a post request to this URL (he is owner of this post) but there are some errors in
            * form ... */

            if (status === 'success') {
                /* This post was updated successfully in the database.(1) */
                req.flash('successMessages', 'Post successfully updated.');
                req.session.save(() => {
                    res.redirect(`/post/${req.params.id}/edit`);
                });
            } else {
                //The second(2) situation.
                post.errors.forEach((error) => {
                    req.flash('errors', error);
                });
                req.session.save(() => {
                    /* req.params.id is the id of post that user is trying to edit. */
                    res.redirect(`/post/${req.params.id}/edit`);
                });
            }

        })
        .catch(() => {
            /* 1) If a post with requested id doesn't exist.(Remember we must check this condition when we have dynamic URL like :id
            so there is a possibility that the user write a fake or nonsense id so we can check if the id is valid.) */

            /* 2) Or if the current visitor of the URL is not the owner of the requested post. */

            req.flash('errors', 'You do not have permission to perform that action.');
            req.session.save(() => {
                res.redirect('/');
            });
        });
};

exports.delete = (req, res) => {
   Post.delete(req.params.id, req.visitorId)
       .then(() => {
            req.flash('successMessages', 'Post successfully deleted.');
            req.session.save(() => {
                res.redirect(`/profile/${req.session.user.username}`);
            });
       })
       .catch(() => {
           /* What if the id of post, it's not a valid post id or it doesn't exist or the person that is trying to do this action
           * is not the owner of that post.So we can handle this situations in model and reject these request that are sent through
           * these conditions and catch these rejects within our .catch() in controller. */

           req.flash('errors', 'You do not have permission to delete a post that isn\'t yours.');
           req.session.save(() => {
               res.redirect('/');
           });
       });
};

exports.apiDelete = (req, res) => {
    /* Now let's adjust this function to not be tightly coupled to the web browser exprience.  */
    Post.delete(req.params.id, req.apiUser.user.userID)
        .then(() => {
            res.json('Successfully deleted that post.');
        })
        .catch(() => {
            res.json('You do not have permission to delete a post.');
        });
};

exports.search = (req, res) => {
    Post.search(req.body.searchTerm)
        .then((results) => {

            res.json(results);
        })
        .catch(() => {
            res.json([]);
        })
    ;
};

