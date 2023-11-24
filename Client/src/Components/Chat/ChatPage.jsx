import React, { useEffect, useState, useRef } from 'react';
import socketIOClient from "socket.io-client";
import { useNavigate } from 'react-router-dom';
import PrivateMessageDialog from './Private';
import Axios from "axios";
import "./ChatPage.css";


const ChatPage = () => {

  const [messages, setMessages] = useState([]);
  const socketRef = useRef(); // Utilisez useRef pour stocker la référence de la socket
  const navigate = useNavigate();
  const ENDPOINT = "http://localhost:3004"; // URL de mon serveur mongoDB
  const [inputMessage, setInputMessage] = useState(''); // Pour stocker le message saisi par l'utilisateur
  const [roomUsers, setRoomUsers] = useState([]);

  const [privateMessages, setPrivateMessages] = useState([]);
  const [unreadPrivateMessages, setUnreadPrivateMessages] = useState(0);
  const [showPrivateDialog, setShowPrivateDialog] = useState(false);

  
  // Récupérer les paramètres de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get('username');
  const room = urlParams.get('room');

  useEffect(() => {
    socketRef.current = socketIOClient(ENDPOINT);

    Axios.get(`http://localhost:3004/messages/${room}`, { withCredentials: true })
    .then(response => {
        setMessages(response.data.messages);
    })
    .catch(error => {
        console.error("Error fetching messages:", error);
    });

    // Informer le serveur qu'un utilisateur a rejoint un canal
    socketRef.current.emit('joinRoom', { username, room });

    // Écouter les messages précédents
    socketRef.current.on('previousMessages', (previousMessages) => {
        setMessages(previousMessages);
    });

    // Écouter les messages entrants
    socketRef.current.on('message', (message) => {
        setMessages(prevMessages => [...prevMessages, message]);
    });

    // Écouter les messages privé entrants
    socketRef.current.on('privateMessage', (message) => {
        setPrivateMessages(prevPrivateMessages => [...prevPrivateMessages, message]);
        setUnreadPrivateMessages(prevUnreadPrivateMessages => prevUnreadPrivateMessages + 1);
        // Afficher le message privé
        console.log('Private message from', message.from, ':', message.text);
    });


    // Écouter la liste des utilisateurs du canal
    socketRef.current.on('roomUsers', (users) => {
        setRoomUsers(users);
    });

    socketRef.current.on('channelsList', (channels) => {
        // Afficher la liste des canaux
        console.log('Available channels:', channels);
    });

    socketRef.current.on('feedback', (feedback) => {
        if (feedback.type === 'error') {
            alert(`Error: ${feedback.message}`);
        } else {
            console.log(feedback.message);
        }
    });

    socketRef.current.on('updateUsername', (newUsername) => {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('username', newUsername);
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    });

    // Écouter les changements de canal
    socketRef.current.on('channelChange', ({ newChannel }) => {
        // Mettre à jour l'URL et recharger la page
        window.location.href = `/chat?username=${username}&room=${newChannel}`;
    });

    // Écouter les changements de canal: Redirection après "/quit"
    socketRef.current.on('redirectToSelectChannel', () => {
        navigate('/select-channel');
    });


    // S'assure de déconnecter le socket lorsque le composant est démonté
    return () => {
        socketRef.current.disconnect();
    };
  }, [ENDPOINT, username, room, navigate]); // Mes dépendances


  const handleMessageChange = (e) => {
        setInputMessage(e.target.value);
  }


  const handleSendMessage = (e) => {
      e.preventDefault();

      // Récupérer les paramètres de l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const username = urlParams.get('username');
      const room = urlParams.get('room');

      if (inputMessage.startsWith('/msg')) {
          const [command, recipient, ...messageParts] = inputMessage.split(' ');
          const messageText = messageParts.join(' ');

          socketRef.current.emit('command', { command, value: `${recipient} ${messageText}` });
          setShowPrivateDialog(true);
      } else if (inputMessage.startsWith('/')) {
          const command = inputMessage.split(' ')[0];
          const value = inputMessage.replace(command, '').trim();
          socketRef.current.emit('command', { command, value });
      } else {
          // Envoyer le message comme un message normal
          socketRef.current.emit('chatMessage', { username, room, message: inputMessage });
      }
      
      // Réinitialiser le champ de saisie
      setInputMessage('');
  }

  const handleShowPrivateDialog = () => {
      setShowPrivateDialog(true);
      setUnreadPrivateMessages(0);
  }

  const handleClosePrivateDialog = () => {
      setShowPrivateDialog(false);
  }
  const handleSendPrivateMessage = (recipient, message) => {
      socketRef.current.emit('command', { command: '/msg', value: `${recipient} ${message}` });
  }


  const handleLeaveRoom = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('username');
        const room = urlParams.get('room');

        // Informer le serveur que l'utilisateur quitte le canal
        socketRef.current.emit('leaveRoom', { username, room });

        // Rediriger l'utilisateur vers la page de sélection du canal
        navigate('/select-channel');
  }

  return (
    <div className="chat-container">
      <header className="chat-header">
          <h1><i className="fas fa-smile"></i> ChatPage</h1>
          <button id="private-messages-btn" className="btn" onClick={handleShowPrivateDialog}>
              Private Messages ({unreadPrivateMessages})
          </button>
          <a id="leave-btn" className="btn" onClick={handleLeaveRoom}>Leave Room</a>
      </header>
      <main className="chat-main">
        <div className="chat-sidebar">
          <h3><i className="fas fa-comments"></i> Room Name:</h3>
          <h2 id="room-name">{room}</h2>
          <h3><i className="fas fa-users"></i> Users</h3>
          <ul id="users">
              {roomUsers.map(user => (
                  <li key={user}>{user}</li>
              ))}
          </ul>
        </div>
        <div className="chat-messages">
          {messages.map((message, index) => (
                <div key={index} className={message.user === username ? 'sent' : 'received'}>
                    {message.user === username ? 
                        <><strong>{message.user}:</strong> {message.text}</> :
                        <>{message.text} <strong>: {message.user}</strong></>
                    }
                </div>
            ))}
        </div>
      </main>
      <div className="chat-form-container">
        <form id="chat-form" onSubmit={handleSendMessage}>
          <input
            id="msg"
            type="text"
            placeholder="Enter Message"
            required
            autoComplete="off"
            value={inputMessage}
            onChange={handleMessageChange}
          />
          <button className="btn"><i className="fas fa-paper-plane"></i> Send</button>
        </form>
      </div>

      {showPrivateDialog && (
          <PrivateMessageDialog
              privateMessages={privateMessages}
              setPrivateMessages={setPrivateMessages}
              onSendMessage={handleSendPrivateMessage}
              onClose={handleClosePrivateDialog}
          />
      )}

    </div>
  )
}

export default ChatPage;
