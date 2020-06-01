/* Yes we are using the word class but JS still is using prototypes and it's not using classical inheritance */

/* Good approach for writing browser based classes in JS:
* 1) In constructor() {} we can create properties that select DOM elements.
* 2) Browser events that we want to response to them.
* 3) Methods */

/* Security: Yes, we know that our server will sanitize and purify the input values from users but lets imagine somehow this
evil JS files get into our DB, but even if this will happen if you are in a URL that leverages that bad data into ejs
template, by default ejs will automatically escape values for us but if you include = at <% , ejs will escape those values.
But you can see the bad code but it won't execute this is good!So if the server sanitization fails, our front-end does not
actually executing malicious code.But when you generate your own HTML stuff instead of ejs, that bad code will run! and even
we can see that js code itself, it just get executed.
When you want to sanitize HTML on the browser (front) side we can use a package named dom-purify.So import it at top of this
  file. Now you must pass in your generated or dirty HTML into DOMPurify.sanitize() .DOMPurify will automatically remove
   any malicious code that can create a cross site scripting attack.
   Remember that DOMPurify does not remove all of the HTML like <div>, it just removes any potentially malicious JS places
    where js could be executed.So we could use html-sanitize package to remove that html in malicious code too, instead of
    dompurify but that package is too big!
    But also remember our server will already be removing any HTML from all the contents.
    We had to artificially go to db to create malicious code ourselves!So don't worry!*/

import axios from 'axios';
import DOMPurify from 'dompurify';

export default class Search {
    constructor() {

        this._csrf = document.querySelector('[name="_csrf"]').value;

        this.injectHTML();
        this.headerSearchIcon = document.querySelector('.header-search-icon');
        this.overlay = document.querySelector('.search-overlay');
        this.closeIcon = document.querySelector('.close-live-search');
        this.inputField = document.querySelector('#live-search-field');
        this.resultsArea = document.querySelector('.live-search-results');
        this.loaderIcon = document.querySelector('.circle-loader');
        this.typingWaitTimer;

        /* If user press left or right arrow keys in the search field, there's no sense to show the spinner icon, so we must keep
        * track of the previous value in between each keystroke and only if the value of this field has changed, we will trigger
        * another event. */
        this.previousValue = '';

        /* We will begin listening to the events on the page as soon as the object of this class is created. */
        this.events();
    }

    //======================
    //Events
    //======================
    events() {
        this.headerSearchIcon.addEventListener('click', (e) => {
            e.preventDefault();
            this.openOverlay();
        });

        this.closeIcon.addEventListener('click', () => {
            this.closeOverlay();
        });

        /* keyup event: Once the user press a key on keyboard and then release his finger from that key (the key comes up!)
        * this event will be triggered. */
        this.inputField.addEventListener('keyup', () => {
            this.keyPressHandler();
        })
    }

    //==================
    //Methods
    //==================
    openOverlay() {
        this.overlay.classList.add('search-overlay--visible');

        /* Because the <div> that this inputField lives within it was hidden until this line of code was ran, certain browsers
        * will run into issues and won't focus this element.So we can write code that, after make this search overlay visible,
        * we can wait 50 milie seconds and then focus that inputField. Actually we must give some time to browser to find out
        * now that text field and it's parent <div> is visible. */
        setTimeout(() => {
            this.inputField.focus();
        }, 50);
    }

    closeOverlay() {
        this.overlay.classList.remove('search-overlay--visible');
    }

    injectHTML() {
        document.body.insertAdjacentHTML('beforeend', `<div class="search-overlay">
    <div class="search-overlay-top shadow-sm">
      <div class="container container--narrow">
        <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
        <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
        <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
      </div>
    </div>

    <div class="search-overlay-bottom">
      <div class="container container--narrow py-3">
        <div class="circle-loader"></div>
        <div class="live-search-results">
         
         <!-- We will use JS to add approprate HTML data into this area. -->
         
        </div>
      </div>
    </div>
  </div>`);
    }

    keyPressHandler() {

        /* value variable is the current value of the input field. */
        let value = this.inputField.value;

        /* If someone performs a search and then clear out the text field completely so we want to both hide results and
        * hide the loader icon.*/
        if (value === '') {
            clearTimeout(this.typingWaitTimer);
            this.hideResultsArea();
            this.hideLoaderIcon();
        }

        if (value !== '' && value !== this.previousValue) {
            this.hideResultsArea();
            this.showLoaderIcon();

            /* Send a request to server after some time.Remember: We don't want to just queue up a new request for each keystroke
            * and simply wait some time after they press the key to send off a request.Instead we must clear the previous timer.
            *  */
            clearTimeout(this.typingWaitTimer);
            this.typingWaitTimer = setTimeout(() => {
                this.sendRequest();
            }, 750);
        }

        /* Now update our previous value: */
        this.previousValue = value;
    }

    showLoaderIcon() {
        this.loaderIcon.classList.add('circle-loader--visible');
    }

    hideLoaderIcon() {
        this.loaderIcon.classList.remove('circle-loader--visible');
    }

    showResultsArea() {
        this.resultsArea.classList.add('live-search-results--visible');
    }

    hideResultsArea() {
        this.resultsArea.classList.remove('live-search-results--visible');
    }

    sendRequest() {
        axios.post('/search', {
            searchTerm: this.inputField.value,
            _csrf: this._csrf
        })
            .then((response) => {
                /* Generate the HTML based on response from server: */
                /* Remember our data that comes back from response in axios is in data property which itself has again
                * a data property that our ACTUAL data is there. */
                console.log(response.data.data);

                this.renderResultsHTML(response.data.data);


            })
            .catch(() => {
                alert('failed');
            })
        ;
    }

    renderResultsHTML(posts) {
        if (posts.length) {
            /* important: Remember we are just assigning new HTML stuff to the results area which was empty, so we
            *   don't need to use insertAdjacentHTML() because we have a reference to the part of document that we want
            *   to insert our html, already! */

            this.resultsArea.innerHTML = DOMPurify.sanitize(` 
        <div class="list-group shadow-sm">
            <div class="list-group-item active"><strong>Search Results</strong> (${

                /* Remember we can not use if sttements in template literals so we can use ternary operator. */
                /* We again can use backticks inside of ${} */
                posts.length > 1 ? `${posts.length} items found` : `1 item found`

            })</div>
               ${
                /* Remember that array.map() will return a new array by using return keyword, but we need to extract our
                 data from this array so we use .join('') to convert this array to string, in this situation. 
                 But in default this will separate the items of array by comma so we use ''.*/

                posts.map((post) => {

                    const postDate = new Date(post.created_date);

                    return `  
                        <a href="/post/${post.post_id}" class="list-group-item list-group-item-action">
                            <img class="avatar-tiny" src="${post.avatar}">
                            <strong>${post.post_title}</strong>
                            <span class="text-muted small">by ${post.username} on ${postDate.getMonth()}/${postDate.getDate()}/${postDate.getFullYear()}</span>
                        </a>`;
                }).join('')
            }
          
         
          </div>`);
        } else {
            this.resultsArea.innerHTML = `<p class="alert alert-danger text-center shadow-sm">
                                          Sorry, we could not find any results for that search!</p>`;
        }

        /* Now because we have the HTML results ready to show, now we must hide the loader icon.  */
        this.hideLoaderIcon();
        this.showResultsArea();
    }


}


