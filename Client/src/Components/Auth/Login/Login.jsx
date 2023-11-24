import React, {useEffect,useState}from 'react';
import "./Login.css";
import { Link, useNavigate } from 'react-router-dom';
import Axios from "axios";

//Import assets
import video from "../../../LoginAssets/video.mp4";
import logo from "../../../LoginAssets/logo.png";

// Import Icons
import {FaUserShield} from "react-icons/fa";
import {BsFillShieldLockFill} from "react-icons/bs";
import {AiOutlineSwapRight} from "react-icons/ai";

const Login = () => {
  // Usestate hook to store inputs
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const navigate = useNavigate();

  // Show the message to the user
  const [loginStatus, setLoginStatus] = useState('');
  const [statusHolder, setStatusHolder] = useState('message');

  //Onclick action (for get what the user has entered)
  const loginUser = (e) => {

    //prevent submitting (for catch error/success credential match)
    e.preventDefault();

    // Reset login status befor each connection attempt 
    setLoginStatus('');

    Axios.defaults.withCredentials = true;

    // We use Axios to create an API that connects to the server
    Axios.post('http://localhost:3002/login', {
    LoginUsername: loginUsername,
    LoginPassword: loginPassword,
    }).then((response) => {
        if (response.data.auth) {
            console.log(`Login Successfully`);
            navigate('/select-channel');
        } else {
            navigate('/');
            setLoginStatus(`Credentials don't Exist`);
            console.log(`Credentials don't Exist`);
        }
    }).catch(error => {
        console.error("Erreur lors de la connexion:", error);
        setLoginStatus('Erreur lors de la connexion. Veuillez réessayer.');
    });
  };

  useEffect(() => {
    if (loginStatus !== '') {
      setStatusHolder('showMessage'); // Show message
      setTimeout(() => {
        setStatusHolder('message'); // Hide it after 4secondes
      }, 4000);
    } 
  }, [loginStatus]);


  // Clear the form on submit
  const onSubmit = () => {
    setLoginUsername('');
    setLoginPassword('');
  }

  return (
    <div className='loginPage flex'>
       <div className="container flex noGrey">
         
          {/* Video Part */}
         <div className="videoDiv">
            <video src={video} autoPlay muted loop></video>
            <div className="textDiv">
              <h2 className="title">Create And Sell Extraordinary Products</h2>
              <p>Adopt the peace of nature !</p>
            </div>

            <div className="footerDiv flex">
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              <span className="text">Don't have an account?</span>
              <Link to={'/register'}>
                <button className='btn'>Sign Up</button>
              </Link>
            </div>
         </div>

          {/* Form Part */}
          <div className="formDiv flex">
            <div className="headerDiv">
              <img src={logo} alt="Logo Image" />
              <h3> Welcome Back!</h3>
            </div>

            <form action="" className='form grid' onSubmit={onSubmit}>
              <span className={statusHolder}>{loginStatus}</span>

              <div className="inputDiv"> 
                <label htmlFor="username">Username</label>
                <div className="input flex">
                  <FaUserShield className='icon'/>
                  <input type="text" id='username' placeholder='Enter Username' onChange={(event)=>{
                    setLoginUsername(event.target.value)
                  }}/>
                </div>
              </div>

              <div className="inputDiv">
                <label htmlFor="password">Password</label>
                <div className="input flex">
                  <BsFillShieldLockFill className='icon'/>
                  <input type="password" id='password' placeholder='Enter password' onChange={(event)=>{
                    setLoginPassword(event.target.value)
                  }}/>
                </div>
              </div>

                <button type='submit' className='btn flex' onClick={loginUser}>
                  <span>Login</span>
                  <AiOutlineSwapRight className="icon"/>
                </button>
             
              <span className='forgotPassword'>
                Forgot your password? <a href="#">Click Here</a>
              </span>

            </form>
          </div>

       </div>
    </div>
  )
}

export default Login;