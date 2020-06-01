/* If you want to use mysql package you must first promisify it.
const mysql = require('mysql');
const promise = require('bluebird');
promise.promisifyAll(mysql);
promise.promisifyAll(require('mysql/lib/Connection').prototype);
promise.promisifyAll(require('mysql/lib/Pool').prototype);
*/

const mysql = require('mysql2/promise');

/* We must require dotenv package here not in the app.js because we are using this package in db.js before we requiring
* the app.js so we must require it earlier to actually use it!So we require it in the top of db.js not in app.js */
const dotenv = require('dotenv');

/* As soon as we run .config() here, that package will load in all of the values that we defined within our .env file. */
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 100
});

/* Tip: You can use both pool and connection to query to database. */

let connection;

const testConnection = async () => {
    connection = await pool.getConnection();
   try {
       return  await connection.execute('SELECT * FROM `users`');
   }
   finally {
       connection.release();
   }
};

testConnection()
    .then((result) => {
      console.log(result[0][0].id);
    })
    .catch((error)=> {
        console.log(error);
    })


module.exports = pool;

/* Our app must start from db.js not app.js . This means we don't want to launch our application
* until we've had a chance to to establish our connection to database.So we go to our app.js
* file and delete or comment out, app.listen(3000); and instead we write : module.exports = app;
* So this way we are still creating an express application under the app variable, but instead of telling it
* to actually listening, we are just exporting it from that file and after that we must go to package.json
* and update the watch script to watch the db.js file not app.js file. */
/* So with requiring our express app after establishing a connection to database, express app won't begin until we
*  have a chance to export the mysql database. */
/* important And also remember that we must start our app (require('./app')) after the connection to db is established.Because we are using
*   connection object in other files so if we put the require('./app') outside of connection.connect(); we will get
*   errors when we are querying to DB. Why we get an error in this project? Because we are using the connection
*   in router and other places and in these places we are using connection to db so we must FIRST establish our
*   connection to db and then require our express application which in this case is require('./app'). */
const app = require('./app');

/* We might need to listen on a different port number when we push this up to it's production or live or real environment
* that everyone can visit.*/
app.listen(process.env.PORT);








