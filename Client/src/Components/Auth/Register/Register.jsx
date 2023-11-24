import React, {useState} from 'react';
import "./Register.css";
import { Link, useNavigate } from 'react-router-dom';
import Axios from "axios";

//Import assets
import video from "../../../LoginAssets/video.mp4";
import logo from "../../../LoginAssets/logo.png";

// Import Icons
import {FaUserShield} from "react-icons/fa";
import {BsFillShieldLockFill} from "react-icons/bs";
import {AiOutlineSwapRight} from "react-icons/ai";
import {MdMarkEmailRead} from "react-icons/md";

const Register = () => {
  // useState to hold our inputs
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigateTo = useNavigate();

  //Onclick action (for get what the user has entered)
  const createUser = (e) => {

    //prevent submitting (for catch error/success credential match)
    e.preventDefault();
    
    // We use Axios to create an API that connects to the server
    Axios.post('http://localhost:3002/register', {
      //variable to send through the route
      Email: email,
      Username: username,
      Password : password,
    }).then(() => {
      console.log('User has been created');
      
      // Redirect user after this on login page
      navigateTo('/');

      // Clear the fields too
      setEmail('');
      setUsername('');
      setPassword('');
    });
  };

  return (
    <div className='registerPage flex'>
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
              <span className="text">Have an account?</span>
              <Link to={'/'}>
                <button className='btn'>Login</button>
              </Link>
            </div>
         </div>

          {/* Form Part */}
          <div className="formDiv flex">
            <div className="headerDiv">
              <img src={logo} alt="Logo Image" />
              <h3> Let Us know You!</h3>
            </div>

            <form action="" className='form grid'>
              
              <div className="inputDiv"> 
                <label htmlFor="email">Email</label>
                <div className="input flex">
                  <MdMarkEmailRead className='icon yolo'/>
                  <input type="email" id='email' placeholder='Enter Email' onChange={(event)=>{
                    setEmail(event.target.value)
                  }}/>
                </div>
              </div>

              <div className="inputDiv"> 
                <label htmlFor="username">Username</label>
                <div className="input flex">
                  <FaUserShield className='icon yolo'/>
                  <input type="text" id='username' placeholder='Enter Username' onChange={(event)=>{
                    setUsername(event.target.value)
                  }}/>
                </div>
              </div>

              <div className="inputDiv">
                <label htmlFor="password">Password</label>
                <div className="input flex">
                  <BsFillShieldLockFill className='icon yolo'/>
                  <input type="password" id='password' placeholder='Enter password' onChange={(event)=>{
                    setPassword(event.target.value)
                  }}/>
                </div>
              </div>

                <button type='submit' className='btn flex' onClick={createUser}>
                  <span>Register</span>
                  <AiOutlineSwapRight className="icon"/>
                </button>

              <span className='forgotPassword'>
                Forgot your password? <a href="">Click here</a>
              </span>

            </form>
          </div>

       </div>
    </div>
  )
}

export default Register;