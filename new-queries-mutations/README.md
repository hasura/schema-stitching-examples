To run this example, run these commands from the root directory:

You will need a postgres connection string to try out this example. Something like:

```
postgres://someusername:somepassword@somehost:5432/postgres
```


Pass this postgres connection string as an environment variable `PG_CONNECTION_STRING` while running the server:

```
$ npm install
$ export PG_CONNECTION_STRING='postgres://someusername:somepassword@somehost:5432/postgres'
$ npm start
```
