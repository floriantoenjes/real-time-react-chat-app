<img src="./imgs/florians_chat.jpg" height="300px" width="300px">

## Florian's Chat (Real-Time Chat App - What's App style)

### Demo
Feel free to sign up at <a href="http://whatsapp.floriantoenjes.com/">chat.floriantoenjes.com <a/>with a made-up email and a password of choice for demo purposes.

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
* Fine tune sending of audio files in chat
* Introduce rate limiting
* Check JWTs for expiration
* Implement backend validation
* add error handling to failing (video)-calls
