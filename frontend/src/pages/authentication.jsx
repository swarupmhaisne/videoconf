import * as React from "react";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";

import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import "./Authentication.css";


export default function Authentication() {

    const navigate = useNavigate();

    // =========================
    // FORM STATES
    // =========================

    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");

    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");

    // 0 = Sign In
    // 1 = Sign Up
    const [formState, setFormState] = React.useState(0);

    const [open, setOpen] = React.useState(false);

    const [showPassword, setShowPassword] = React.useState(false);


    const { handleRegister, handleLogin } =
        React.useContext(AuthContext);


    // =========================
    // LOGIN / REGISTER
    // =========================

    const handleAuth = async () => {

        try {

            setError("");

            // SIGN IN
            if (formState === 0) {

                await handleLogin(
                    username,
                    password
                );

            }

            // SIGN UP
            else {

                const result = await handleRegister(
                    name,
                    username,
                    password
                );

                console.log(result);

                setUsername("");
                setPassword("");
                setName("");

                setMessage(result);
                setOpen(true);

                // After successful registration,
                // switch to Sign In
                setFormState(0);
            }

        } catch (err) {

            console.log(err);

            const errorMessage =
                err?.response?.data?.message ||
                "Something went wrong. Please try again.";

            setError(errorMessage);
        }
    };


    // =========================
    // SWITCH TO SIGN IN
    // =========================

    const handleSignInTab = () => {

        setFormState(0);
        setError("");

    };


    // =========================
    // SWITCH TO SIGN UP
    // =========================

    const handleSignUpTab = () => {

        setFormState(1);
        setError("");

    };


    return (

        <div className="authPage">


            {/* =========================================
                LEFT SIDE
            ========================================= */}

            <section className="authVisual">


                {/* BACK BUTTON */}

                <button
                    type="button"
                    className="backButton"
                    onClick={() => navigate("/")}
                >

                    <ArrowBackIcon />

                    Back

                </button>


                {/* BRAND */}

                <div className="authBrand">

                    <div className="authLogo">

                        <VideocamIcon />

                    </div>


                    <div className="authBrandName">

                        Meet<span>ora</span>

                    </div>

                </div>


                {/* LEFT CONTENT */}

                <div className="authVisualContent">


                    <div className="authBadge">

                        <span></span>

                        SIMPLE. PRIVATE. CONNECTED.

                    </div>


                    <h1>

                        Meetings that
                        <br />

                        <span>feel personal.</span>

                    </h1>


                    <p>

                        Connect with your people through
                        simple, reliable video calls.

                    </p>


                    {/* =================================
                        MINI MEETING CARD
                    ================================= */}

                    <div className="miniMeeting">


                        <div className="miniMeetingHeader">

                            <div>

                                <span className="liveDot"></span>

                                Team Meeting

                            </div>


                            <span>
                                •••
                            </span>

                        </div>


                        <div className="miniVideos">


                            {/* MAIN PERSON */}

                            <div className="miniPerson personOne">

                                <div className="miniHead"></div>

                                <div className="miniBody"></div>

                            </div>


                            {/* SIDE PEOPLE */}

                            <div className="miniSide">


                                <div className="miniPerson personTwo">

                                    <div className="miniHead"></div>

                                    <div className="miniBody"></div>

                                </div>


                                <div className="miniPerson personThree">

                                    <div className="miniHead"></div>

                                    <div className="miniBody"></div>

                                </div>


                            </div>


                        </div>


                        {/* CONTROLS */}

                        <div className="miniControls">

                            <span>●</span>

                            <span>▣</span>

                            <span>□</span>

                            <span>●</span>

                            <span className="miniEnd">
                                ☎
                            </span>

                        </div>


                    </div>


                </div>


                <div className="authFooter">

                    © 2026 Meetora

                </div>


            </section>


            {/* =========================================
                RIGHT SIDE
            ========================================= */}

            <section className="authFormPanel">


                <div className="authFormContainer">


                    {/* MOBILE BRAND */}

                    <div className="mobileAuthBrand">

                        <div className="authLogo">

                            <VideocamIcon />

                        </div>


                        <div className="authBrandName">

                            Meet<span>ora</span>

                        </div>

                    </div>


                    {/* HEADING */}

                    <div className="authHeading">

                        <h2>

                            {formState === 0
                                ? "Welcome back"
                                : "Create your account"}

                        </h2>


                        <p>

                            {formState === 0
                                ? "Sign in to continue to Meetora"
                                : "Create an account and start connecting"}

                        </p>

                    </div>


                    {/* =================================
                        SIGN IN / SIGN UP TABS
                    ================================= */}

                    <div className="authTabs">


                        <button
                            type="button"
                            className={
                                formState === 0
                                    ? "active"
                                    : ""
                            }
                            onClick={handleSignInTab}
                        >

                            Sign In

                        </button>


                        <button
                            type="button"
                            className={
                                formState === 1
                                    ? "active"
                                    : ""
                            }
                            onClick={handleSignUpTab}
                        >

                            Sign Up

                        </button>


                    </div>


                    {/* =================================
                        FORM
                    ================================= */}

                    <div className="authForm">


                        {/* FULL NAME */}

                        {formState === 1 && (

                            <div className="fieldGroup">

                                <label>
                                    Full Name
                                </label>


                                <TextField
                                    fullWidth
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) =>
                                        setName(
                                            e.target.value
                                        )
                                    }
                                />

                            </div>

                        )}


                        {/* USERNAME */}

                        <div className="fieldGroup">

                            <label>
                                Username
                            </label>


                            <TextField
                                fullWidth
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        {/* PASSWORD */}

                        <div className="fieldGroup">

                            <label>
                                Password
                            </label>


                            <TextField
                                fullWidth
                                placeholder="Enter your password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }


                                InputProps={{

                                    endAdornment: (

                                        <InputAdornment position="end">

                                            <IconButton
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword
                                                    )
                                                }
                                                edge="end"
                                            >

                                                {showPassword
                                                    ? <VisibilityOffIcon />
                                                    : <VisibilityIcon />
                                                }

                                            </IconButton>

                                        </InputAdornment>

                                    )

                                }}

                            />

                        </div>


                        {/* ERROR */}

                        {error && (

                            <div className="authError">

                                {error}

                            </div>

                        )}


                        {/* =================================
                            SUBMIT BUTTON
                        ================================= */}

                        <Button
                            type="button"
                            fullWidth
                            className="authSubmit"
                            onClick={handleAuth}
                        >

                            {formState === 0
                                ? "Sign In"
                                : "Create Account"}


                            <span>
                                →
                            </span>

                        </Button>


                        {/* =================================
                            BOTTOM SWITCH
                        ================================= */}

                        <p className="authSwitch">


                            {formState === 0
                                ? "Don't have an account?"
                                : "Already have an account?"}


                            <button
                                type="button"
                                onClick={() => {

                                    setError("");

                                    if (formState === 0) {

                                        setFormState(1);

                                    } else {

                                        setFormState(0);

                                    }

                                }}
                            >

                                {formState === 0
                                    ? " Sign Up"
                                    : " Sign In"}

                            </button>


                        </p>


                    </div>


                </div>


            </section>


            {/* SUCCESS MESSAGE */}

            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                message={message}
            />


        </div>

    );

} 