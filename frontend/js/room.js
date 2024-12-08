const  parems = new URLSearchParams(document.location.search);
localStorage.debug = 'socket.io-client:socket';
// console.log(token);
const token = parems.get('token');

const socket = io();

const room_id = localStorage.getItem('room_id');
if (room_id) {
    socket.emit('rejoinRoom', room_id);
} else {
    socket.emit('joinRoom', token);
   
}


socket.on('message', ({ invoice }) => {
     localStorage.setItem('room_id', token);
    console.log(JSON.parse(invoice));
});
socket.on('rejoined-room', (message) => {
    console.log(message);
});

socket.on('error', (message) => {
    console.error(message);
    localStorage.removeItem('room_id');
})
socket.on("connect_error", (err) => {
  // the reason of the error, for example "xhr poll error"
  console.log(err.message);

  // some additional description, for example the status code of the initial HTTP response
  console.log(err.description);

  // some additional context, for example the XMLHttpRequest object
  console.log(err.context);
});