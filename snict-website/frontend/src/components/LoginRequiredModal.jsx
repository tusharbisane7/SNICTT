import { X, LogIn, UserPlus, CalendarCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./LoginRequiredModal.css";

function LoginRequiredModal({ isOpen, onClose }) {

  const navigate = useNavigate();

  if (!isOpen) {
    return null;
  }


  const handleLogin = () => {

    onClose();

    navigate("/login");

  };


  const handleSignup = () => {

    onClose();

    navigate("/signup");

  };


  return (

    <div
      className="login-required-overlay"
      onClick={onClose}
    >

      <div
        className="login-required-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        {/* CLOSE */}

        <button
          type="button"
          className="login-required-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={19} />
        </button>


        {/* ICON */}

        <div className="login-required-icon">
          <CalendarCheck size={30} />
        </div>


        {/* CONTENT */}

        <span className="login-required-label">
          EVENT BOOKING
        </span>


        <h2>
          Login Required
        </h2>


        <p>
          Please login or create an account
          to book this event.
        </p>


        {/* ACTIONS */}

        <div className="login-required-actions">

          <button
            type="button"
            className="login-required-login"
            onClick={handleLogin}
          >
            <LogIn size={17} />
            Login
          </button>


          <button
            type="button"
            className="login-required-signup"
            onClick={handleSignup}
          >
            <UserPlus size={17} />
            Sign Up
          </button>

        </div>


        {/* CANCEL */}

        <button
          type="button"
          className="login-required-later"
          onClick={onClose}
        >
          Maybe Later
        </button>

      </div>

    </div>

  );

}

export default LoginRequiredModal;