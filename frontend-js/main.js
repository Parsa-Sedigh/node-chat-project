/* This file is where we import all of our frontend JS files */
/* Remember: We included this main.js file, which itself imported all of our frontend JS files into the footer.ejs file. So
* our JS files will apply to page correctly. */

import Search from './modules/search';
import Chat from './modules/chat';
import RegistrationForm from './modules/registrationForm';

const headerSearch = document.querySelector('.header-search-icon');
const chatWrapper = document.querySelector('#chat-wrapper');

if (headerSearch) {
    new Search();
}

/* If chat-wrapper exists (a <div> in footer.ejs that wraps all of our chat HTML code.), we want to show it to frontend.So if the
* user is logged in. Remember: The main file will bundle into public folder (with help of webpack) and express knows about our static files.
* In this if statement we are saying that we only want our events and our methods and properties and ... in chat.js to be
* rendered and considered IF the user has logged in. Notice that we have another if statement in footer.ejs for chat HTML
* but here we set if statement for our JS code for chat not HTML code. */
if (chatWrapper) {
    new Chat();
}

/* Only runs the registrationForm.js code, if the registration form HTML actually exists on the current page. */
const registrationForm = document.querySelector('#registration-form');

if (registrationForm) {
    new RegistrationForm();
}


