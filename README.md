# dynamic-data-store
a no-sql data storage solution supporting dynamic primary key designation and hashmap storage as well as partial object based query filters and a value matching lookup system

## Installation
> npm i dynamic-data-store

## Use Cases
1. partial record lookup and hydration between client-server applications
2. on-demand no-sql, in-memory data storage where creating a schema is too much overhead
3. data storage with primary keys where a single property is not sufficient to create a unique primary key

## Examples

### Client Server user management
assuming you have a chat application where users are **NOT** required to log-in, but instead use a machine-generated fingerprint and a user-generated name to uniquely identify themselves and they need to be able to reconnect to a socket if there is a temporary disconnect as well as ensure no other users are using the same username at the same time...
```typescript
// client
type User = {
    fingerprint: number,
    name: string
};
const tmpUser = {fingerprint: getMachineFingerprint(), name: 'foo'};
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
```typescript
// server
type User = {
    fingerprint: number;
    name: string;
    id: string;
    socketId: string;
};
type UserMessage = {
    name: string;
    message: string;
};
const store = new DynamicDataStore<User>({indexPropertyKeys: ['id', 'fingerprint', 'name']});
const messages = new Array<UserMessage>();
io.on('connection', (socket) => {
    socket.on('register', (user: Partial<User>) => {
        if (store.count({name: user.name}) > 0) {
            socket.emit('nameRejected', user.name);
        } else {
            const added = store.add({
                ...user,
                id: generateUserId(), // guid or something unique
                socketId: socket.id
            });
            if (!added) {
                socket.emit('registrationError');
            } else {
                socket.emit('registrationAccepted');
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
        }
    });
});
sendMessagesPeriodically();
sendMessagesPeriodically() {
    if (messages.length > 0) {
        io.broadcast('messages', messages.splice(0, messages.length));
    }
    setTimeout(() => {
        sendMessagesPeriodically();
    }, 1000);
});
```
