# dynamic-data-store
a no-sql data storage solution supporting dynamic primary key designation and hashmap storage as well as partial object based query filters and a value matching lookup system

## Installation
> npm i dynamic-data-store

## Use Cases
1. partial record lookup and hydration between client-server applications
2. on-demand no-sql, in-memory data storage where creating a schema is too much overhead
3. data storage with primary keys where a single property is not sufficient to create a unique primary key
4. flexible object filtering and ordering without risk of accidental modification to base records

## Query
a module providing a `filterBy<T extends {}>(query: Query<T>, ...records: Array<T>): Array<T>` function used to filter the supplied records by the supplied query where the query is a JSON object where each property key exists in type `T` and each property value is either the expected value in all returned records or a `ValueMatcher` used to conditionally match the records based on some conditions

## ValueMatcher
a class accepting some expected value(s) which is then compared to the actual value to determine if a data record matches the query. this base class can either be extended from to create your own value matchers or you can use one of the pre-made value matchers below:
- `between` - a `ValueMatcher` expecting a `min` and `max` number which is used to compare to the actual value
- `greaterThan` - a `ValueMatcher` expecting a `min` number which is used to compare to the actual value
- `lessThan` - a `ValueMatcher` expecting a `max` number which is used to compare to the actual value
- `containing` - a `ValueMatcher` expecting the actual value to contain the expected either as a substring or array / map / set entry
- `matching` - a `ValueMatcher` expecting a `RegExp` which is used to compare to the actual value
- `startingWith` - a `ValueMatcher` expecting the actual value to start with the expected either as a substring or array / map / set entry
- `endingWith` - a `ValueMatcher` expecting the actual value to end with the expected either as a substring or array / map / set entry
- `havingValue` - a `ValueMatcher` expecting the actual value to not be null or undefined
- `not` - a `ValueMatcher` that will negate the result of any other `ValueMatcher` passed to it

## DynamicDataStore Usage
> NOTE: when using a `DynamicDataStore` it is assumed that the data being stored is **NOT** a class or any object containing functions and instead you are only storing a JSON object (the `DynamicDataStore` serialiser also supports Map and Set properties on your data objects). if you require filtering of more complex data records like classes then it is recommended you use the `Query.filterBy<T extends {}>(query: Query<T>, ...records: Array<T>): Array<T>` function which performs the same filtering capabilities as the `DynamicDataStore.select(query?: Query<T>): DynamicDataStoreRecords<T>` function, but without acting as the storage mechanism and returning the actual records instead of clones. if you insist on using a `DynamicDataStore` instance to store class objects, you can use the `DynamicDataStore._get(query?: Query<T>): DynamicDataStoreRecords<T>` function, but the records returned are actual references and **NOT** clones so **USE AT YOUR OWN RISK**

### 1. CRUD operations
the following examples assume a `DynamicDataStore` named `store` already exists with the following configuration:
```typescript
type Data = {username: string; firstname?: string; lastname?: string; address?: string; created: number; lastUpdated: number; active: boolean;}
const store = new DynamicDataStore<Data>({indicies: ['username','active']});
```
Creating new records is done using the `add` function that accepts a single object:
```typescript
const successful = store.add({
    username: 'secretagent1',
    firstname: 'John',
    created: Date.now(),
    lastUpdated: Date.now(),
    active: true
}); // record added
const unsuccessful = store.add({
    username: 'secretagent1',
    created: Date.now(),
    lastUpdated: Date.now(),
    active: true
}); // record not added due to unique index violation
```
Reading records from the `DynamicDataStore` is done using the `select` function when you want records matching certain constraints:
> NOTE: records returned by `select` are clones and not the actual data so modifications to any properties will not affect the data records stored in your `DynamicDataStore`
```typescript
const allActiveRecords = store.select({
    active: true
}); // an array of 0 to many records
const record = store.select({
    active: true,
    created: lessThan(timestampMilliseconds)
}).first; // a single record or undefined if no matching records
```
Updating records is done using the `update` function which can be used to update a single record if your `updates` object contains values for the properties used as indicies:
```typescript
const updatedCount = store.update({
    username: 'secretagent1',
    active: true,
    lastname: 'Smith',
    lastUpdated: Date.now()
}); // updatedCount equals 1
```
or multiple records if your `updates` object does NOT contain values for the properties used as indices:
```typescript
const count = store.update({
    lastname: null
}); // sets lastname to null for all records
```
and you can optionally pass in a `query` parameter after the `updates` object to filter the records that will be udpated:
```typescript
const count = store.update({
    address: '234 New Address, City, A4445556'
}, {
    firstname: 'John',
    lastname: 'Smith'
}); // all users named 'John Smith' will have their address updated
```
> NOTE: it **IS** possible to update values of one or more properties used as indicies as long as not all properties are specified in the `updates` object, but this may have unexpected results such as overwriting other records because now index keys overlap. in such cases the updated record(s) will take precedence in overwriting the pre-existing record(s)

Deleting records is done using the `delete` function and passing in a `query` record that filters the number of records to be deleted:
```typescript
const deletedRecords = store.delete({
    lastActive: lessThan(timestampMilliseconds)
}); // deletedRecords contains an array of all deleted records
```
or by using the `clear` function to remove all records
> NOTE: records returned by calling `delete` or `clear` are the actual data record instances and **NOT** clones

### 2. Client-Server user management
assuming you have a chat application where users are **NOT** required to log-in, but instead use a machine-generated fingerprint and a user-generated name to uniquely identify themselves and they need to be able to reconnect to a socket if there is a temporary disconnect as well as ensure no other users are using the same username at the same time...
```typescript
// client
type User = {
    fingerprint: number,
    name: string
};
const tmpUser = {
    fingerprint: getMachineFingerprint(), 
    name: 'foo'
};
let user: User;
socket.emit('register', tmpUser);
socket.on('registrationError', () => {
    // attempt to re-register (i.e. generate new tmpUser and send 'register' event)
}).on('nameRejected', (name: string) => {
    alert(`name ${name} cannot be used; please choose another.`);
}).on('registrationAccepted', () => {
    user = tmpUser;
}).on('disconnected', () => {
    socket.connect();
    if (user) {
        socket.emit('reconnect', user);
    }
}).on('messages', (messages: Array<UserMessage>) => {
    displayMessagesFromServer(messages); // display username and message
});
socket.emit('sendMessage', 'hello world!'); // broadcasts message from this user to other users via server
```
server code receives registrations from clients and broadcasts client messages to all users every second without needing to require logins to ensure uniqueness of usernames and while allowing reconnection behaviour if client temporarily disconnects and while preventing impersonation of users by other users.
```typescript
// server
type User = {
    fingerprint: number;
    name: string;
    id: string;
    socketId: string;
    lastActive: number;
};
type UserMessage = {
    name: string;
    message: string;
};
const store = new DynamicDataStore<User>({
    indicies: [
        'id', 
        'fingerprint', 
        'name'
    ]
});
const messages = new Array<UserMessage>();
io.on('connection', (socket) => {
    socket.on('register', (user: Partial<User>) => {
        if (isValid(user)) { // user.name follows guidelines
            if (store.size({name: user.name}) > 0) {
                socket.emit('nameRejected', user.name);
            } else {
                const added = store.add({
                    ...user,
                    id: generateUserId(), // guid-like
                    socketId: socket.id,
                    lastActive: Date.now()
                });
                if (!added) {
                    socket.emit('registrationError');
                } else {
                    socket.emit('registrationAccepted');
                }
            }
        }
    }).on('reconnect', (user: Partial<User>) => {
        if (user.fingerprint && user.name) {
            const existing = store.select(user);
            if (existing.first()) {
                existing.first().socketId = socket.id;
            }
        }
    }).on('sendMessage', (message: string) => {
        const user = store.selectFirst({socketId: socket.id});
        if (user) {
            messages.push({name: user.name, message});
            user.lastActive = Date.now();
            store.update(user);
        }
    });
});
sendMessagesPeriodically() {
    if (messages.length > 0) {
        io.broadcast('messages', messages.splice(0, messages.length));
    }
    setTimeout(() => {
        sendMessagesPeriodically();
    }, 1000); // run every second
});
cleanupOldUsers() {
    // delete all users who haven't been active in last hour
    const deleted = store.delete({lastActive: lessThan(Date.now() - 3600000)});
    messages.push({
        user: 'ADMIN', 
        message: `recycling names: [${deleted.map(d => d.name).join(', ')}]`
    });
    setTimeout(() => {
        cleanupOldUsers();
    }, 60000); // run every minute
}
sendMessagesPeriodically();
cleanupOldUsers();
```
