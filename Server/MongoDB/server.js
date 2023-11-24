const http = require("http");
const express = require('express');
const colors = require("colors");
const socketio = require("socket.io");
const cors = require('cors');

const mongoose = require('mongoose');
const Channel = require('./Models/Channel');
const Message = require('./Models/Message');


const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "http://localhost:5173", // Autoriser votre frontend
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose.connect('mongodb+srv://kaman:kaman@cluster0.xjji5ml.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("Failed to connect to MongoDB", err);
});

// Liste des utilisateurs par canal
const roomUsers = {};

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
}));

// Run when a client connects
io.on('connection', socket => {
    console.log("New WS Connection...");

    // Écouter l'événement 'joinRoom' pour savoir quand un utilisateur rejoint un canal
    socket.on('joinRoom', async ({ username, room }) => {
        socket.join(room);
        console.log(`${username} has joined the room ${room}`); // Notifier la console

        // Récupérer les messages précédents du canal depuis MongoDB
        try {
            const previousMessages = await Message.find({ channelName: room }).sort({ timestamp: 1 }).limit(50);
            
            if (previousMessages.length > 0) {
                socket.emit('previousMessages', previousMessages);
            } else {
                // Envoyer un message de bienvenue à l'utilisateur qui vient de se connecter
                socket.emit('message', { user: 'ChatBot', text: `Welcome ${username}!` });
            }
        } catch (error) {
            console.error("Error fetching previous messages:", error);
        }

        // Envoyer un message de bienvenue à l'utilisateur qui vient de se connecter
        socket.emit('message', { user: 'ChatBot', text: `Welcome ${username}!` });

        // Ajouter l'utilisateur à la liste des utilisateurs de la room
        if (!roomUsers[room]) {
            roomUsers[room] = [];
        }
        roomUsers[room].push(username);

        // Envoyer la liste mise à jour des utilisateurs à tous les utilisateurs de la room
        io.to(room).emit('roomUsers', roomUsers[room]);

        // Stocker username et room dans socket pour une utilisation ultérieure
        socket.username = username;
        socket.room = room;

        // Envoyer un message à tous les autres utilisateurs du canal pour les informer qu'un nouvel utilisateur s'est joint
        socket.broadcast.to(room).emit('message', { user: 'ChatBot', text: `${username} has joined the chat.` });
    });

    // Écouter l'événement 'leaveRoom' pour savoir quand un utilisateur quitte un canal
    socket.on('leaveRoom', ({ username, room }) => {
        console.log(`${username} has left the room ${room}`);

        // Envoyer un message à tous les autres utilisateurs du même canal
        socket.broadcast.to(room).emit('message', { user: 'ChatBot', text: `${username} has left the chat.` });

        // Retirer l'utilisateur de la room
        socket.leave(room);
    });

    // Run when client disconnects
    socket.on('disconnect',() => {
        // Envoyer un message à tous les autres utilisateurs du même canal
        if (socket.username && socket.room) {

            // Retirer l'utilisateur de la liste des utilisateurs de la room
            roomUsers[socket.room] = roomUsers[socket.room].filter(u => u !== socket.username);

            // Envoyer la liste mise à jour des utilisateurs à tous les utilisateurs de la room
            io.to(socket.room).emit('roomUsers', roomUsers[socket.room]);

            socket.broadcast.to(socket.room).emit('message', { user: 'ChatBot', text: `${socket.username} has left the chat.` });
        }
    });

    // Écouter l'événement 'chatMessage' pour savoir quand un utilisateur envoie un message
    socket.on('chatMessage', async ({ username, room, message }) => {
        // Créer un nouveau message
        const newMessage = new Message({
            channelName: room,
            user: username,
            text: message
        });

        // Enregistrer le message dans la base de données MongoDB
        try {
            await newMessage.save();
            // Retransmettre le message à tous les utilisateurs du même canal
            io.to(room).emit('message', { user: username, text: message });
        } catch (error) {
            console.error("Error saving message:", error);
        }
    });

    socket.on('command', ({ command, value }) => {
        switch (command) {
        case '/nick':

            const oldUsername = socket.username;
            socket.username = value;

            // Mettre à jour le pseudonyme dans la liste des utilisateurs du canal
            const room = socket.room;
            if (roomUsers[room]) {
                const index = roomUsers[room].indexOf(oldUsername);
                if (index !== -1) {
                    roomUsers[room][index] = value;
                }
            }

            // Informer tous les utilisateurs du canal du changement de pseudonyme
            io.to(room).emit('message', { user: 'ChatBot', text: `${oldUsername} is now known as ${value}.` });
            io.to(room).emit('roomUsers', roomUsers[room]);

            socket.emit('feedback', { type: 'success', message: `Nickname set to ${value}` });
            socket.emit('updateUsername', value);
            break;
        case '/list':
            // Renvoyer la liste des canaux depuis MongoDB
            Channel.find().then(channels => {
                const channelNames = channels.map(channel => channel.name);
                const filteredChannels = value ? channelNames.filter(name => name.includes(value)) : channelNames;
                socket.emit('channelsList', filteredChannels);
                socket.emit('message', { user: 'ChatBot', text: `Available channels: ${filteredChannels.join(', ')}` });
            }).catch(err => {
                socket.emit('feedback', { type: 'error', message: `Error fetching channels: ${err.message}` });
            });
            break;
        case '/create':
            // Créer un nouveau canal
            Channel.create({ name: value })
            .then(channel => {
                socket.emit('feedback', { type: 'success', message: `Channel ${value} created` });
            })
            .catch(err => {
                socket.emit('feedback', { type: 'error', message: `Error creating channel: ${err.message}` });
            });
            break;
        case '/delete':
            // Supprimer un canal depuis MongoDB
            Channel.findOneAndDelete({ name: value })
            .then(() => {
                delete roomUsers[value]; // Supprimez également le canal de la liste des utilisateurs en mémoire
                socket.emit('feedback', { type: 'success', message: `Channel ${value} deleted` });
            })
            .catch(err => {
                socket.emit('feedback', { type: 'error', message: `Error deleting channel: ${err.message}` });
            });
            break;
        case '/join':
            // Rejoindre un canal
            Channel.findOne({ name: value })
            .then(channel => {
                if (!channel) {
                    socket.emit('feedback', { type: 'error', message: `Channel ${value} does not exist` });
                } else {
                    const oldRoom = socket.room;
                    socket.leave(oldRoom);
                    socket.join(value);
                    socket.room = value;

                    // Supprimer l'username de l'utilisateur du canal précédent
                    if (roomUsers[oldRoom]) {
                        roomUsers[oldRoom] = roomUsers[oldRoom].filter(u => u !== socket.username);
                    }
                
                    if (!roomUsers[value]) {
                        roomUsers[value] = [];
                    }
                    roomUsers[value].push(socket.username);
                
                    // Informer tous les utilisateurs du canal du changement
                    io.to(oldRoom).emit('message', { user: 'ChatBot', text: `${socket.username} has left the chat.` });
                    io.to(oldRoom).emit('roomUsers', roomUsers[oldRoom]);
                    io.to(value).emit('message', { user: 'ChatBot', text: `${socket.username} has joined the chat.` });
                    io.to(value).emit('roomUsers', roomUsers[value]);
                
                    // Informer l'utilisateur du changement de canal
                    socket.emit('channelChange', { newChannel: value });
                    // socket.emit('feedback', { type: 'success', message: `Joined channel ${value}` });
                }
            })
            .catch(err => {
                socket.emit('feedback', { type: 'error', message: `Error joining channel: ${err.message}` });
            });
            break;
        case '/quit':
            if (value === socket.room) {
                const oldRoom = socket.room;
                socket.leave(oldRoom);
            
                // Supprimer l'username de l'utilisateur du canal
                if (roomUsers[oldRoom]) {
                    roomUsers[oldRoom] = roomUsers[oldRoom].filter(u => u !== socket.username);
                }
            
                // Informer tous les utilisateurs du canal du départ de l'utilisateur
                io.to(oldRoom).emit('message', { user: 'ChatBot', text: `${socket.username} has left the chat.` });
                io.to(oldRoom).emit('roomUsers', roomUsers[oldRoom]);
            
                // Rediriger l'utilisateur vers la page de sélection du canal
                socket.emit('redirectToSelectChannel');
            } else {
                Channel.findOne({ name: value })
                .then(channel => {
                    if (!channel) {
                        socket.emit('feedback', { type: 'error', message: `Channel ${value} does not exist` });
                    } else {
                        socket.emit('feedback', { type: 'error', message: `You are not in channel ${value}` });
                    }
                })
                .catch(err => {
                    socket.emit('feedback', { type: 'error', message: `Error quitting channel: ${err.message}` });
                });
            }
            break;
        case '/users':
            if (roomUsers[socket.room]) {
                socket.emit('message', { user: 'ChatBot', text: `Users in channel: ${roomUsers[socket.room].join(', ')}` });
                socket.emit('feedback', { type: 'info', message: `Users in channel: ${roomUsers[socket.room].join(', ')}` });
            } else {
                socket.emit('feedback', { type: 'error', message: `You are not in any channel.` });
            }
            break;
        case '/msg':
            const [recipient, ...messageParts] = value.split(' ');
            const messageText = messageParts.join(' ');
                
            const recipientSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === recipient);
                
            if (recipientSocket) {
                recipientSocket.emit('privateMessage', { from: socket.username, text: messageText });
                socket.emit('feedback', { type: 'success', message: `Message sent to ${recipient}` });
            } else {
                socket.emit('feedback', { type: 'error', message: `User ${recipient} not found` });
            }
            break;

        
        // ... (autres commandes)
        default:
            socket.emit('feedback', { type: 'error', message: `Unknown command ${command}` });
            break;
    }
    });
});

// Register Channels
app.post('/add-channels', (req, res) => {
    const channels = ["JavaScript", "Python", "Java", "C++", "Ruby"]; // Liste des canaux

    Channel.insertMany(channels.map(name => ({ name })))
    .then(() => {
        res.status(200).send({ message: "Channels added successfully!" });
    })
    .catch(err => {
        res.status(500).send({ message: `Error adding channels: ${err.message}` });
    });
});

// Récupérer la liste des canaux:
app.get('/channels', (req, res) => {
    Channel.find().then(channels => {
        res.status(200).send({ channels });
    })
    .catch(err => {
        res.status(500).send({ message: `Error fetching channels: ${err.message}` });
    });
});

// Récupérer les messages d'un canal spécifique
app.get('/messages/:channelName', (req, res) => {
    const channelName = req.params.channelName;

    // Recherchez les messages pour le canal spécifié dans la base de données
    Message.find({ channelName: channelName })
        .sort({ timestamp: 1 }) // Triez les messages par ordre chronologique
        .then(messages => {
            res.status(200).send({ messages });
        })
        .catch(err => {
            res.status(500).send({ message: `Error fetching messages for channel ${channelName}: ${err.message}` });
        });
});


const PORT = 3004 || process.env.PORT;

server.listen(PORT, () => console.log(`Server Running On Port ${PORT}`.america));
