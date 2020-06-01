import DOMPurify from 'dompurify';

/* Let's export so it will available from main.js file. */
/* Important: .emit() is for sending a socket with it's data but .on() is for receiving that socket and then running a callback
*   function. */
/* Security tip: Now a user can write malicious code into the chat box and we don't want this!!! So we can begin our server side
* and sanitize any incoming messages before we broadcast those messages out to any and all connected browsers.
* After doing this task, if a malicious user trying to send over a bit of malicious code, YES they can see their own malicious
* message in their chat log but for other people, that malicious code would be sanitized by the server(because when a user submits a
* message in his chat box, the frontend will send this message to backend and backend will sanitize the message and THEN broadcast
* it.). So the other users won't get the malicious message.
*
* Now let's assume the worst case and assume that for some reason, that server side sanitization did not work for. For innocent
* users we still want some kind of last line of defense within the client side.So we must use DOMPurify package in this file too!
* and we use this package in our displayMessageFromServer() method to sanitize incoming messages from server and also we can use
* this package in sendMessageToServer()
*
* After all of this works we know that a malicious user could modify the JS on their client side but anyways we now have security!!!
*  So now even if our server side sanitization for some reason failed, we can rest assured that our other users still have
* client side sanitization to protect them. */

export default class Chat {
    constructor() {
        /* The first time that user opens up the chat box, a special function runs that can opens a connection to the server.
        * But then if user started spamming closing and opening and again closing and opening and ... the chat, we wouldn't
        * want to create a new connection each time the chat was opened, we'de only want to run that open connection function
        * the first time they open the chat.So create a property named openedYet. So we just want open a connection to server
        * at the first time that user opens up the chat box and in the next openings, the connection won't established again!
        * Until user refreshes the page so after that again at the first time the connection would stablished but the next times
        * NO! */
        this.openedYet = false;
        this.chatWrapper = document.querySelector('#chat-wrapper');
        this.openIcon = document.querySelector('.header-chat-icon');

        /* We call injectHTML() method at constructor() because when the page loads, the HTML markup of our chat box must be
        * injected into DOM, so if someone clicks on chat icon in header, the HTML of chat must be visible.  */
        this.injectHTML();

        /* You must declare these property after calling injectHTML(), because it needs the HTML of chat and that HTML is injected
        * or inserted in DOM with calling injectHTML().So we must declare this property after calling that method.
        * learn: So if you want to select or work with elements in HTML that their HTML code still is not inserted or injected
        *  into DOM (for example you create that HTML code but still doesn't injected into document, with using insertAdjacentHTML
        *  or innerHTML or ...), first you have to insert that HTML into document and THEN select it's elements or work with
        *  it's elements.   */
        this.chatField = document.querySelector('#chatField');
        this.chatForm = document.querySelector('#chatForm');

        /* Remember: We must first inject the markup of our chat box THEN use the querySelector() to select the elements that
        * are in the chat box.Because it must exists before we select an element in it, OK?!
        * But selecting chatWrapper before inject the HTML of chat box, causes no problem, because the html of wrapper of chat box
        * is in footer.ejs and we know this file wil rendered with our main.js in beginning of everything, so it won't cause a
        * problem. */
        this.closeIcon = document.querySelector('.chat-title-bar-close');
        this.chatLog = document.querySelector('#chat');

        /* Important: We call our events method at the end of constructor(), because the DOM must be rendered before we add
        *   the events to DOM. */
        this.events();
    }

    //Events:
    events () {

        /* The second arg of .addEventListener() is the function that will run for response of event(in this case 'click' event). */
        this.openIcon.addEventListener('click', () => {
            this.showChat();
        });

        this.closeIcon.addEventListener('click', () => {
            this.hideChat();
        });

        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessageToServer();
        });
    }

    //Methods
    injectHTML () {
        this.chatWrapper.innerHTML = `
            <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
            <div id="chat" class="chat-log"></div>
            <form id="chatForm" class="chat-form border-top">
                <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
            </form>
        `;
    }

    showChat () {
        if (!this.openedYet) {
            this.openConnection();

            /* As soon as the chat opened, openedYet property set to true, but the very first time you opened it, it will be set
            * to false.So this if statement will run, but then it will set to true, so the next time you opens the chat box,
            * the value of openedYet is still true. Because nowhere else it's value is changing. So this if statement will no longer run.
            * So this if statement will run just at the very beginning and not the next times.Until you refresh the page.
            * and when we open a connection to server to allow for two way communication of data.
              */
            this.openedYet = true;
        }

        this.chatWrapper.classList.add('chat--visible');
        this.chatField.focus();
    }

    hideChat () {
        this.chatWrapper.classList.remove('chat--visible');
    }

    openConnection () {
        /* When someone types his message and then submit the message, we would want to handle that event with frontend JS.
        * We want to send their message to the server on the fly or asynchronously, we don't want to reload the page.So we
        * could use axios to send an asyncronous JS request to the server and that would work because our server is always
        * listening for incoming requests.But the server then would need to send this message to any and all users who have
        * the chat feature(the users that signed in and opened the chat box). But how server could do that?
        * Because we know that web browser is not listening for incoming data from the server. Traditionally the browsers ONLY
        * listen for data from the server immediately after the browsers send a request and then expects to hear a response
        * from the server and as soon as that response's lifecycle is over, the browser is not listening any longer.
        * Now to get around this limitation we can get creative and program things so that every 5 or 10, seconds the browser
        * sends an axios request to the server. So this way we can check for any new messages from other users reguraly.
        * But it's not a right tool.
        * So instead of using traditional HTTP request, we're going to open a socket connection between the browser and the
        * server.
        * Once we established a socket connection, both server and browser will be listening for data from one another.   */

         /* io() will open a connection between the browser and server , but we need this connection to access it later on
         * so we must store it somewhere. */
        this.socket = io();

        /* When we logged in and then open a connection, the server is going to send a 'welcome' event and when that happens we
        * want to run the function in second arg in the below code: */
        this.socket.on('welcome', (data) => {

            /* Let's store the data that server is sending to the frontend in our overall chat object. */
            /* After storing data in memory, we can use them again later on. */
            this.username = data.username;
            this.avatar = data.avatar;
        });

        /* Remember: The browser won't run the 'chatMessageFromServer' socket event UNTIL itself has sent a socket event named
        * 'chatMessageFromBrowser'. */
        this.socket.on('chatMessageFromServer', (data) => {
            /* We could write the HTML code and insert it into document in this method, but we can make another method that do this
             * separate task for us. */
            this.displayMessageFromServer(data);
        });
    }

    sendMessageToServer () {

        /* this.socket.emit(); will emit an event with a bit of data to the server.The first arg for .emit() is a custom name
        * that we have to make up, which describes this type of event.The second arg is an object with any data that we want
        * to send to the server.
        *
        * Remember: When you request send a message to server via 'chatMessageFromBrowser' event, the server is no longer is
        * going to send it back to you. (Because we used .broadcast in response to this event in app.js). Instead it's going to
        * send it to any and all connected browsers except for the person who originally sent that message.This means that within
        * this method, we would now want to handle adding the HTML (the message we sent to server) to the chat log.
        * So we are just saying, because the message that user himself sent to server won't show in his chat box (because of
        * .broadcast() in app.js), we want to handle that message ourselves, to show that in the chat box of user who originally
        * sent that message. */
        this.socket.emit('chatMessageFromBrowser', {
            message: this.chatField.value
        });

        /* Now let's insert the HTML of message that HIMSELF, sent this message to server, in his chat box.So we must show our
        * own message in our own chat box with other styles than other messages from people. */
        /* Remember: We don't have access to the users avatars, but when the chat box shows up by clicking the user on it's icon,
        * a socket connection will be stablished to the server and we get the users session and his avatar and then will send it
        * to the frontend to show it. */
        /* Important: We don't have access to users session in the frontend.So we must get those sessions from our server (backend). */
        this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
            <div class="chat-self">
            <div class="chat-message">
              <div class="chat-message-inner">
                ${this.chatField.value}
              </div>
            </div>
            <img class="chat-avatar avatar-tiny" src="${this.avatar}" alt="your profile avatar">
          </div>
        `));

        /* After each new message we would want to automatically tell the chat-log <div> to scroll down to it's bottom, so that the
         * newest message can be seen.Because we can't expect users to continuously and manually scrolling down as new messages come in.
         * So when someone send a message to database, we must scroll a little bit.
         * .scrollTop will let us say how far down the elements should be scrolled. So we would just want it to be scrolled
         * down all the way to the very bottom.
         * In the code, we are saying : Let's scroll to very bottom (in other words: the position of scroll in chatLog must
         * be the value of chatLog height.) - also we must do this exact task when we SHOWED (AFTER SHOWING) a message from server in
         * displayMessageFromServer() method.
         * After doing this task, the user never has to worry about scrolling to the bottom to see the newest messages.  */
        this.chatLog.scrollTop = this.chatLog.scrollHeight;

        /* Clear out the chat field. */
        this.chatField.value = '';
        this.chatField.focus();

        /* Important: Now let's go to app.js file and tell our server what it should do when it detects an event named
            'chatMessageFromBrowser'. */
    }

    displayMessageFromServer (data) {

        this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
        <div class="chat-other">
            <a href="profile/${data.username}"><img class="avatar-tiny" src="${data.avatar}" alt="${data.username}'s profile"></a>
            <div class="chat-message">
                <div class="chat-message-inner">
                      <a href="profile/${data.username}"><strong>${data.username}:</strong></a>
                      ${data.message}
                </div>
            </div>
      </div>`));

        this.chatLog.scrollTop = this.chatLog.scrollHeight;
    }
}




