import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import Axios from 'axios';

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    Axios.get('http://localhost:3002/isUserAuth', {
      withCredentials: true
    }).then(response => {
      console.log("Response from /isUserAuth:", response.data);
      if (response.data === "You are authenticated") {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }).catch(error => {
      console.log("Response from /isUserAuth:", error);
      setIsAuthenticated(false);
    });
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Affiche un spinner ou un autre composant de chargement
  }

  return isAuthenticated ? children : <Navigate to="/" />;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired
};

export default PrivateRoute;
