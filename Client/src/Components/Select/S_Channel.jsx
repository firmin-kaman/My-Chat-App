import React, { useState,useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from "axios";
import "./Select-chanel.css";

const S_Channel = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const usernameRef = useRef(null);
  const [room, setRoom] = useState('JavaScript'); // valeur par défaut
  const [channels, setChannels] = useState([]);


  // useEffect(() => {
  //   Axios.get('http://localhost:3004/channels' , { withCredentials: true })
  //   .then(response => {
  //       setChannels(response.data.channels);
  //   })
  //   .catch(error => {
  //       console.error("Error fetching channels:", error);
  //   });
  // }, []);


  useEffect(() => {
  Axios.get('http://localhost:3004/channels', { withCredentials: true })
    .then((response) => {
      const sortedChannels = response.data.channels.sort((a, b) =>
        a.name.localeCompare(b.name)
      ); // Trie les canaux par ordre alphabétique décroissant
      setChannels(sortedChannels);
      setRoom(sortedChannels[0].name); // Définit le premier canal comme canal par défaut
    })
    .catch((error) => {
      console.error("Error fetching channels:", error);
    });
}, []);


  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  }

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (username.trim() === '') {
      alert('No No No... Enter a username please! 😅');
      usernameRef.current.focus();
      return;
    }
    navigate(`/chat?username=${username}&room=${room}`);
  }

  const handleRoomChange = (e) => {
    setRoom(e.target.value);
  }

  const handleLogout = () => {
        Axios.get('http://localhost:3002/logout') // Appelez l'endpoint de déconnexion
            .then(() => {
                navigate('/'); // Redirigez après la déconnexion
                location.reload(true); //Recharger la page
            }).catch(error => {
                console.error("Erreur lors de la déconnexion:", error);
            });
  }

  
  return (
    <div>
      <div className="join-container">
        <header className="join-header">
            <h1><i className="fas fa-smile"></i> Select-Channel</h1>
          </header>
          <main className="join-main">
            <form onSubmit={handleFormSubmit}>
              <div className="form-control">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  placeholder="Enter username..."
                  required
                  onChange={handleUsernameChange}
                  ref={usernameRef}
                />
              </div>
              <div className="form-control">
                <label htmlFor="room">Room</label>
                <select name="room" id="room" onChange={handleRoomChange}>
                    {channels.map(channel => (
                        <option key={channel._id} value={channel.name}>{channel.name}</option>
                    ))}
                </select>
              </div>
              <button type="submit" className="btn">Join Chat</button>
            </form>
            <br />
            <br />
            <br />
            <button onClick={handleLogout} className="btn log">
              Log Out
            </button>
          </main>
      </div>

      
    </div>
  )
};

export default S_Channel;
