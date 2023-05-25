# dynamic-data-store
a no-sql data storage solution supporting dynamic primary key designation and hashmap storage as well as partial object based query filters and a value matching lookup system

## Installation
> npm i dynamic-data-store

## Use Cases
1. partial record lookup and hydration between client-server applications
2. on-demand no-sql, in-memory data storage where creating a schema is too much overhead
3. data storage with primary keys where a single property is not sufficient to create a unique primary key

## Examples

### 1. Client-Server user management
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
