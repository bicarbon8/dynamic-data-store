# dynamic-data-store
a no-sql data storage solution supporting dynamic primary key designation and hashmap storage as well as partial object based query filters and a value matching lookup system

## Installation
> npm i dynamic-data-store

## Use Cases
1. partial record lookup and hydration between client-server applications
2. on-demand no-sql, in-memory data storage where creating a schema is too much overhead
3. data storage with primary keys where a single property is not sufficient to create a unique primary key

## Examples

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
Reading records from the `DynamicDataStore` is done using the `select` or `selectFirst` function when you want records matching certain constraints:
```typescript
const allActiveRecords = store.select({
    active: true
}); // an array of 0 to many records
const firstActiveRecordCreatedBeforeTimestamp = store.selectFirst({
    active: true,
    created: lessThan(timestampMilliseconds)
}); // a single record or undefined if no matching records
```
or using the `get` function if you know the values for the record's indicies:
```typescript
const record = store.get({
    username: 'secretagent1',
    active: true
}); // returns {username: 'secretagent1', firstname: 'John', created: 1234567890, lastUpdated: 1234567890, active: true}
const undef = store.get({
    firstname: 'Jonh'
}); // returns undefined
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
            if (store.count({name: user.name}) > 0) {
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
            if (existing?.length) {
                existing[0].socketId = socket.id;
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
