<img src="./imgs/florians_chat.jpg" height="300px" width="300px">

## Florian's Chat (Real-Time Chat App - What's App style)

### Demo
The demo is currently down to save costs.

<img src="./imgs/dashboard.png" style="width: 80%; ">

### Functionality

Right now users can...
* register, log in, log out, passwords being hashed with Bcrypt.
* add other users as contacts and write them messages.
* create chat groups with multiple users and exchange messages.
* clean up or delete chats.
* receive messages and see if they have been read in real time.
* edit their profiles, look at other user's profiles
* send images
* send audio messages
* make video and voice calls
* see the online status of their contacts in real time

### Technical Details

The backend...
* is written in TypeScript making use of NestJS as a framework.
* talks via mongoose to a MongoDb cluster for data persistence.
* serves the frontend as well
* makes its WebSocket connections scalable by using a Redis instance
* uses an S3 store to persist files
* uses a PeerJS server which I forked and extended with pub/sub-functionality

The frontend...
* is also written in TypeScript making use of React v18 as a framework.
* uses the MUI material library components.
* uses Tailwind CSS as a style library.
* offers responsiveness to run on phone and web
* is compiled with Vite for a fast development speed.

Backend and frontend...
* are secured via JWTs
* communicate via REST with typesafe communication via ts-rest, a tRPC like communications contract between frontend and backend.
* are processing real time updates with WebSocket connections via socket.io server and client.

### Next TODOs
* Introduce rate limiting
* Improve backend validation