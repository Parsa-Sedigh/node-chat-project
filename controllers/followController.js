const Follow = require('../models/Follow');

exports.addFollow = (req, res) => {
    const follow = new Follow(req.params.username, req.visitorId);
    follow.create()
        .then(() => {
            req.flash('successMessages', `Successfully followed ${req.params.username}`);
            req.session.save(() => {
                res.redirect(`/profile/${req.params.username}`);
            });
        })
        .catch((errors) => {
            /* Promise is rejected so this means user is trying sth malicious. */
            console.log(errors);
            errors.forEach((error) => {
                req.flash('errors', error);
            });

            /* Important: We must save the flash messages after all of them are created in their arrays.So we must use .save()
            *   out of .forEach() or any loop in order to save all of them.Because if we would save them inside the forEach or
            *   loop we must redirect them, but some of the flash messages would be remain before the redirect(). So we have to
            *   save them after looping over all of them.  */
            req.session.save(() => {
                res.redirect('/');
            });

        });
};

exports.removeFollow = (req, res) => {
    const follow = new Follow(req.params.username, req.visitorId);
    follow.delete()
        .then(() => {
            req.flash('successMessages', `Successfully stopped following ${req.params.username}`);
            req.session.save(() => {
                res.redirect(`/profile/${req.params.username}`);
            });
        })
        .catch((errors) => {
            /* Promise is rejected so this means user is trying sth malicious. */
            console.log(errors);
            errors.forEach((error) => {
                req.flash('errors', error);
            });

            /* Important: We must save the flash messages after all of them are created in their arrays.So we must use .save()
            *   out of .forEach() or any loop in order to save all of them.Because if we would save them inside the forEach or
            *   loop we must redirect them, but some of the flash messages would be remain before the redirect(). So we have to
            *   save them after looping over all of them.  */
            req.session.save(() => {
                res.redirect('/');
            });

        });
};




