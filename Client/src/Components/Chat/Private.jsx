import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import "./Private.css";

const PrivateMessageDialog = ({ privateMessages, setPrivateMessages, onSendMessage, onClose, currentUser }) => {
    const [inputMessage, setInputMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const messagesEndRef = useRef(null);

    const users = Array.from(new Set(privateMessages.map(message => message.from).concat(privateMessages.map(message => message.to))));

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [privateMessages]);
    

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (selectedUser) {
            onSendMessage(selectedUser, inputMessage);
            const newMessage = { from: currentUser, to: selectedUser, text: inputMessage, self: true };
            setPrivateMessages(prevPrivateMessages => [...prevPrivateMessages, newMessage]);
            setInputMessage('');
        } else {
            alert('Please select a user to send a message.');
        }
    }

    const handleSelectUser = (user) => {
        setSelectedUser(user);
    }

    const handleInputChange = (e) => {
        setInputMessage(e.target.value);
    }

    const handleClose = () => {
        onClose();
    }

    return (
        <div className='private-chat-container'>
            <header className="private-chat-header">
                <h1><i className="fas fa-smile"></i> PrivatePage</h1>
                <a id="leave-btn" className="btn" onClick={handleClose}>Close It</a>
            </header>
            <main className="private-chat-main">
              <div className="private-chat-sidebar">
                <h3><i className="fas fa-users"></i> Users</h3>
                <ul id="private-users">
                    {users.map(user => (
                        <li key={user} onClick={() => handleSelectUser(user)} className={user === selectedUser ? 'selected' : ''}>{user}</li>
                    ))}
                </ul>
              </div>
              <div className="private-chat-messages">
                  {privateMessages.filter(message => message.from === selectedUser || message.to === selectedUser).map((message, index) => (
                      <div key={index} className={message.from === selectedUser ? 'sent' : 'received'}>
                          {message.from === selectedUser ? 
                              <><strong>{message.self ? 'You' : message.from}:</strong> {message.text}</> :
                              <>{message.text} <strong>: {message.self ? 'You' : message.from}</strong></>
                          }
                      </div>
                  ))}
              </div>
            </main>
            <div className="private-chat-form-container">
              <form id="chat-form" onSubmit={handleSendMessage}>
                <input
                  id="msg"
                  type="text"
                  placeholder="Enter Message"
                  required
                  autoComplete="off"
                  value={inputMessage}
                  onChange={handleInputChange}
                />
                <button className="btn"><i className="fas fa-paper-plane"></i> Send</button>
              </form>
            </div>
        </div>
    );
}

PrivateMessageDialog.propTypes = {
    privateMessages: PropTypes.array.isRequired,
    setPrivateMessages: PropTypes.func.isRequired,
    onSendMessage: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    currentUser: PropTypes.string.isRequired,
};

export default PrivateMessageDialog;
