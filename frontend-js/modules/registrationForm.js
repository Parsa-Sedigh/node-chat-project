/* You always need to validate data on the server side because a malicious user could disable the client side JS, so frontend
    * validation wouldn't work */
/* In this file, first we would want to insert a red validation message above each of three fields and insertValidationElements()
* method will run at the beginning, when a user view the guest home screen. */

/* How long the username should be and when we should show the validation message for username field? If someone begins to '
* typing their name, when they just write 2 characters and a LITTLE wait after typing 2 chars, we don't want to show a error
* message that says the username must be at least 3 chars, so for certain validation checks we would not want to run immidately
* after each keystroke, but if the user started typing in a REALLY long name and they passed our 10 characters limit for the
* username, then we WOULD IMMEDIATELY WANT to show the message that says username can not ... . Also is a user used a character
* that we are not allowing, the miliseconds that they used a special character that is not allowed, we would show the validation
* message. Another example where I want to wait for a delay would be to check to see if the username has already been taken or not?
*
* So again just like I'd probably want to give the user five to eight hundred milisecnods to type something in that is longer than
* 2 chars and we ALSO want to give them a certain number of miliseconds before I waste a network trip to see if that username has
* already taken or not?
* So some checks should run immidately but other checks should run after a delay.
* One of the validation checks that we want it to run immediately if the user types in a special character is for special char
* validation error. */

/* The responsibility of this file is to check for validation errors and if there is no errors, the form will submitted and
* when the form is submitted it will send a post request to our server to actually again check for validation errors on backend
* and if there is no errors the user information will be inserted into db and he will redirected to dashboard-home.ejs page.
* So if the user has turned-on JS in his browser, these validation in this file would work but if he turned off the JS
* on browser, the server will take care of validation.
* If there is some errors in validation, the form won't even go to server to busy our server! and this is the responsibility
* of this file. */

/* CSRF attack : cross site request forgery.
* Remember: If a site is running on HTTPS it wouldn't load HTTP resources.
* CSRF attacks are relying on the innocent user already being logged in to an existing application and then the malicious site
* just sends a request to a targeted URL that they know makes sense and a site that they know the name attributes of fields that the
* server of the targeted website is expecting. So this attack relies on cookies.
* What this type of attack can't do? At no point this type of attack can actually see or access the targeted application itself.
* So thankfully web browsers do protect you from tab to tab basis.So any HTML in JS in one tab can't access the DOM or HTML
* from another tab. So how we can protect ourselves from CSRF attacks? So our actual innocent real users can see for example
* our create-post html page where they can type in a title and body, but there's no way for the malicious pages to read our
* HTML templates. The malicious code is just blindly sending off post requests to different URLs. So for protects ourselves,
* when our server sends this HTML template to the browser, we could just send along a random string of characters and then
* set things up so when this form is submitted in addition to a title and body content values, you must also provide that
* random string of characters and if you don't provide that random string of characters, we will reject this post request
* to create a post.Because we will know that this request was not a normal, safe, valid request.Because if you are actually logged in
* and viewing our application you should have no problem grabbing that random string of characters that the server sent along.
* But if your request is coming from a malicious cross site request forgery attempt, well you have no way of accessing that
* random string of characters. In other words the only thing the cookie with our matching session id proves, is that the request
* is coming from a web browser that has recently been logged in to our application and it does NOT prove that the user of the
* said web browser (the web browser that has logged in to our app) actually WANTS to perform that request.(In other words,
* we don't want to send a request but that malicious page, do that!)
* So as long as we are not allowing malicious JS to actually run on our page itself, then the random the random generated string
* proves that the current request is actually DESIRED by the user.
* So we can install csurf package.*/
import axios from 'axios';

export default class RegistrationForm {
    constructor() {

        /* Let's create a property that grabs the CSRF value from one of the hidden <input>s on the page.
        * In querySelector() we must select an element based on it's name.
        * Because I think all of the elements that are : <input type="hidden" name="_csrf" value="<%=csrfToken%>"> and are on
        * SAME PAGE, has equal values.So we can grab one of them and give it to our property.
        * After storing that matching CSRF token value in this propert, so now when we send off an axios request, let's just
        * pass this property along that axios post request. What are axios post requests in this registrationForm file?
        * Well, when we are checking if there is already a username in database that a new user tries to use it we talk to
        * our db, so we are sending it a post request, right? So we must pass it to send this property to server too! and also for
        * email field.    */
        this._csrf = document.querySelector('[name="_csrf"]').value;

        /* If we try to click on the submit button we prevent the browser to actually submitting the form, unless we are
        * perfectly happy with the values of fields.But before setting a submit event for form submittion, let's set isUnique
        * property for both username and password properties to false by default, so this way it is up to our axios requests
        * to actually run and after get a response from server, update isUnique to be true or false before we ever let our form
        * to actually submit.   */
        this.form = document.querySelector('#registration-form');
        this.allFileds = document.querySelectorAll('#registration-form .form-control');
        this.insertValidationElements();

        this.username = document.querySelector('#username-register');
        this.email = document.querySelector('#email-register');
        this.password = document.querySelector('#password-register');

        this.username.previousValue = '';
        this.email.previousValue = '';
        this.password.previousValue = '';

        this.username.isUnique = false;
        this.email.isUnique = false;

        /* When the page loads, the events alongside the HTML must be rendered at the very beginning. */
        this.events();
    }

    //Events
    events () {

        /* We must listen for each keystroke event on the username field element.
        * Now what if I press a key that does not in any way change the value of the field, like press the arrow keys? Left up ...
        * or the shift key or ... So we wouldn't need to actually do anything unless the key that they JUST PRESSED (the last key)
        * actually somehow just changed the value of the field. So we must check the field to see if the value of field just has
        * changed for all 3 inputs or not? So this way, the shift key or caps lock key or... doesn't trigger the handler() method
        * in the beginning of typing in the field (these keys won't trigger our handler() method at the very beginning of typing
        * because they won't change the value of the field (the value of filed is still empty after pressing shift or arrows or ...),
        * but if after some typing, you use shift key or arrow key they WILL TRIGGER the handler() method, because for example
        * Parsa is different than Pa rsa !! Right?
        * BUT after pressing shift key or ... still the value of the field is empty.So if at the very beginning
        * of typing we press shift key or arrow keys or ... again and again, the handler() method won't trigger.But as I said
        * if you press for example the shift key or ... they will trigger the handler(). Remember the parsa example!!!!
        *  */
        this.username.addEventListener('keyup', () => {

            /* usernameHandler() method is a method that we would want to run, if the value of the field has actually changed. */
            this.isDifferent(this.username, this.usernameHandler);
        });

        this.email.addEventListener('keyup', () => {
            this.isDifferent(this.email, this.emailHandler);
        });

        this.password.addEventListener('keyup', () => {
            this.isDifferent(this.password, this.passwordHandler);
        });

        this.form.addEventListener('submit', (e) => {

            /* We don't want that user actually submit the form without any checking and validation, so we must prevent form
            * from it's default behavior and instead OURSELVES handle the form submittion. */
            e.preventDefault();
            this.formSubmitHandler();
        });

        /* If a user types in a value and then really quick hits tab button, the validation for the previous field won't work and
        * that's an issue.So maybe that value the user types in was a special character and then he quickly hits tab and the validation
        * doesn't notice the special character. So we must listen to blur event for each field.
        * Blur event runs when you exit off of a field or when a the field loses focus */
        this.username.addEventListener('blur', () => {

            /* usernameHandler() method is a method that we would want to run, if the value of the field has actually changed. */
            this.isDifferent(this.username, this.usernameHandler);
        });

        this.email.addEventListener('blur', () => {
            this.isDifferent(this.email, this.emailHandler);
        });

        this.password.addEventListener('blur', () => {
            this.isDifferent(this.password, this.passwordHandler);
        });

    }

    //Methods
    insertValidationElements () {
        this.allFileds.forEach((el) => {
            el.insertAdjacentHTML('afterend', `<div class="alert alert-danger small liveValidateMessage"></div>`);
        });
    };

    isDifferent (el, handler) {
        /* Now let's see if the value of field has changed after this keypress.So we must get the previous value of the field.
        * el.value is the CURRENT value of the field. */
        if (el.previousValue !== el.value) {

            /* When handler() method runs, we do want to make sure that within it, the this keyword is still pointing to our overall object.
               However because we're calling the handler() like this, JS is going to consider the this keyword to just be the global object.
            *  Because there is no object right before the handler() to calling handler() . So this keyword will point to global object
            *  So we must use .call() . Remember: .call() is a method that is available to functions. So now .call() will run
            *  the function that it's used on it - which in this case is handler function - and it will make sure that
            *  the this keyword is whatever we set it to which in this context is still pointing towards the our overall object.
            *  (RegistrationForm object)  */
            handler.call(this);

        }

        /* Now update the previousValue: */
        el.previousValue = el.value;

    };

    usernameHandler () {
        this.username.errors = false;
        this.usernameImmediately();

        clearTimeout(this.username.timer);
        /* We are creating a new property named timer on the username property. But we want to reset this timer after each
        * keystroke.
        * Remember: What is difference between calling a method with () and without () in setTimeout() or any where else?
        *  */
        this.username.timer = setTimeout( () => {
            this.usernameAfterDelay();
        }, 800);
    };

    emailHandler () {
        this.email.errors = false;

        /* We don't want to run any validation checks immediately, because if someone begins typing in an email address,
        * well after their few keystrokes, clearly that's NOT going to look like like a valid email address with @ symbol and
        * a domain, so we would want to give them a chance to type before we evaluate what they've typed in. */

        clearTimeout(this.email.timer);

        this.email.timer = setTimeout( () => {
            this.emailAfterDelay();
        }, 800);
    };

    /* For password field it doesn't need to talk to database, because duplicate passwords are okay. We just need to make sure password
     * has the appropriate length. */
    passwordHandler () {
        this.password.errors = false;
        this.passwordImmediately();

        clearTimeout(this.password.timer);
        /* We are creating a new property named timer on the username property. But we want to reset this timer after each
        * keystroke.
        * Remember: What is difference between calling a method with () and without () in setTimeout() or any where else?
        *  */
        this.password.timer = setTimeout( () => {
            this.passwordAfterDelay();
        }, 800);
    };

    usernameImmediately () {
        /* It's better not to use validator package in the frontend because visitors must download this package. */
        /* When we say regularExpression.test() we want test that regex with whatever we pass in to .test().
        * Remember the second condition of if statement will evaluate to true if they only typed in alphanumeric characters.
        * But we want to know if they typed special character so we need opposite of that.
        * And remember : Checking for errors in username field or any other field must be above or before the checking for
        * if we have errors or not? Because we must check everything and AFTER that check if we had errors in our previous
        * validations or not? */
        if (this.username.value !== '' && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
            this.showValidationError(this.username, 'Username can only contain letters and numbers.');
        }

        if (this.username.value.length > 10) {
            this.showValidationError(this.username, 'Username can not exceed 10 characters.');
        }

        if (!this.username.errors) {
            this.hideValidationError(this.username);
        }

    };
        
    passwordImmediately () {
        if (this.password.value.length > 10) {
            this.showValidationError(this.password, 'Password can not exceed 10 characters.');
        }

        if (!this.password.errors) {
            this.hideValidationError(this.password);
        }
    };

    usernameAfterDelay () {
        /* It doesn't need to use hideValidationError() method here  (in the body of usernameAfterDelay() because in
        usernameImmediately() method we are doing this hide errors stuff and we know that usernameImmediately() will
        always run in each keystroke so if the user write a correct username after his mistakes, the errors will hide
        after correcting them (because for correcting them he need some keystrokes right?) but anyways you can again use hideValidationError()
        here) */

        if (this.username.value.length < 3) {
            this.showValidationError(this.username, 'Username must be at least 3 characters.');
        }

        /* We would only want to to send off a request to our server if there are no other potential errors with this username.
        * The second arg of axios.post() is the data we want to send along our post request to the server.
        * Remember that the name of the key of the data we want to send doesn't matter and we can name it anything.
        * Important: When axios gets back the response, the data that the server sent back to us as response is in the data
        *  property. So we must get the whole response that axios sent back to us inside the parentheses of .then() and then
        *  get the actual value, in whatever we have in parentheses and then use dot .data so in this case it would be response.data
        *  Because response is what we pass in to () to get the whole response and then we use .data to get the actual value. */
        if (!this.username.errors) {
            axios.post('/doesUsernameExist', {
                username: this.username.value,
                _csrf: this._csrf
            })
                .then((response) => {
                    if (response.data) {
                        this.showValidationError(this.username, 'That username has already taken.');

                        /* We won't let the user submit the overall form unless we are happy with all of the values. */
                        /* important: We are storing the isUnique property in our username property because username property is available
                        *   to all of the methods and ... so we can use this property (isUnique) for condition when the user
                        *   is submitting the form to check if the user can register or not? */
                        this.username.isUnique = false;
                    } else {
                        this.username.isUnique = true;
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        }

    };

    emailAfterDelay () {
        if (!/^\S+@\S+$/.test(this.email.value)) {
            this.showValidationError(this.email, 'You must provide a valid email address.');
        }

        /* Now if they had entered a valid email address, we would want to check our server to see if that email address is
        * already taken or not? */
        if (!this.email.errors) {

            /* Important: We haven't any errors so first before any furthur ado you must hide any potential errors,
                that maybe has shown earlier. */
            this.hideValidationError(this.email);

            axios.post('/doesEmailExist', {
                email: this.email.value,
                _csrf: this._csrf
            })
                .then((response) => {
                    if (response.data) {
                        /* If response.data is true, this means a user has already used that email address.So it will throw an error. */
                        this.email.isUnique = false;
                        this.showValidationError(this.email, 'That email is already being used.');

                    } else {
                        this.email.isUnique = true;
                        this.hideValidationError(this.email);
                    }
                })
                .catch((error) => {
                    /* We have unexpected technical difficulty.
                    * Remember: In this case, our controller won't send an */
                    console.log(error);

                });
        }


    };

    passwordAfterDelay () {
        if (this.password.value.length < 4) {
            this.showValidationError(this.password, 'Password must be at least 4 characters.')
        }
    };

    showValidationError (el, message) {

        /* Next element that is sibling of el (or the given input field - like username field or password field) is that
        * danger validation errors and after setting it's html to the message, we want to visible those or that (if there is
        * error for one field) red message fields.
        * After showing this error of special characters message, let's set things up so miliseconds after I get rid of that
        * character that is special, then that red validation box will disappear. So we can create a new property named errors
        * on el (el is the field element in HTML). Why we did create this property? Because if we ever call this method
        * (showValidationError()) means that there is an error with this field (el).
        * Remember: The base HTML of the error messages are set in insertValidationElements() method and we called this method in
        * constructor(). So if the page loads those HTML for those 3 validation boxes are rendered in document. */
        el.nextElementSibling.innerHTML = message;
        el.nextElementSibling.classList.add('liveValidateMessage--visible');
        el.errors = true;
    };

    hideValidationError (el) {
        el.nextElementSibling.classList.remove('liveValidateMessage--visible');
    };

    formSubmitHandler () {
        /* What we want to do in this method? Well let's assume that someone could visit this site and before they even trigger
        * any keyup events on any of the fields, they could click submit right away, (without doing anything on fields!).
        * But before we let the form submits, we would still want all of our validation rules and checks to run,So within this
        * method we must manually run all of our validation checks. */

        this.usernameImmediately();
        this.usernameAfterDelay();
        this.emailAfterDelay();
        this.passwordImmediately();
        this.passwordAfterDelay();

        /* Now let's check EVERYTHING is ok and then if everything is okay, we can let form to be submitted. */
        if (
            this.username.isUnique && !this.username.errors &&
            this.email.isUnique && !this.email.errors &&
            !this.password.errors
        ) {
            this.form.submit();
        } else {
            alert('There is some errors, please fix them!');
        }
    };
}
