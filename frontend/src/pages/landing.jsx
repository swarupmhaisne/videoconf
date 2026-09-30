import React from 'react'
import "../App.css"
import VideocamIcon from "@mui/icons-material/Videocam"
import { Link, useNavigate } from 'react-router-dom'

export default function LandingPage() {

    const router = useNavigate();

    return (
        <div className="landingPageContainer">

            {/* NAVBAR */}
            <nav className="landingNav">

                <div className="brand">
                    <div className="brandIcon">
    <VideocamIcon />
</div> 

                    <h2>Meet<span>ora</span></h2> 
                </div>


                <div className="navlist">

                    <p onClick={() => router("/aljk23")}>
                        Join as Guest
                    </p>

                    <p onClick={() => router("/auth")}>
                        Register
                    </p>

                    <button
                        className="navLogin"
                        onClick={() => router("/auth")}
                    >
                        Login
                    </button>

                </div>

            </nav>


            {/* HERO SECTION */}

            <main className="landingMainContainer">

                {/* LEFT CONTENT */}

                <div className="heroContent">

                    <div className="eyebrow">
                        <span className="liveDot"></span>
                        SIMPLE. PRIVATE. CONNECTED.
                    </div>


                    <h1>
                        Connect with the
                        <span> people that matter.</span>
                    </h1>


                    <p className="heroDescription">
                        High-quality video calls made simple.
                        Create a meeting, share the link and
                        connect with anyone, anywhere.
                    </p>


                    <div className="heroButtons">

                        <Link
                            to="/auth"
                            className="primaryButton"
                        >
                            Start a Meeting
                            <span>→</span>
                        </Link>


                        <button
                            className="guestButton"
                            onClick={() => router("/aljk23")}
                        >
                            Join as Guest
                        </button>

                    </div>


                    {/* TRUST POINTS */}

                    <div className="trustPoints">

                        <div>
                            <span>✓</span>
                            Secure
                        </div>

                        <div>
                            <span>✓</span>
                            HD Video
                        </div>

                        <div>
                            <span>✓</span>
                            Easy to use
                        </div>

                    </div>

                </div>


                {/* RIGHT VISUAL */}

                <div className="heroVisual">

                    <div className="glowCircle"></div>


                    <div className="visualCard">

                        <div className="cardTop">

                            <span className="statusDot"></span>

                            <span>Live meeting</span>

                            <span className="smallDots">•••</span>

                        </div>


                        <img
                            src="/mobile.png"
                            alt="Video calling"
                        />


                        <div className="floatingBadge">

                            <div className="miniAvatar">
                                👤
                            </div>

                            <div>
                                <strong>Ready to connect?</strong>
                                <small>Start your meeting</small>
                            </div>

                            <span className="greenCheck">
                                ✓
                            </span>

                        </div>

                    </div>

                </div>

            </main>


            {/* BOTTOM FEATURE BAR */}

            <div className="featureBar">

                <div className="feature">

                    <div className="featureIcon">
                        ◉
                    </div>

                    <div>
                        <strong>Crystal Clear</strong>
                        <span>HD video & audio</span>
                    </div>

                </div>


                <div className="feature">

                    <div className="featureIcon">
                        🔒
                    </div>

                    <div>
                        <strong>Private & Secure</strong>
                        <span>Your conversations stay yours</span>
                    </div>

                </div>


                <div className="feature">

                    <div className="featureIcon">
                        ⚡
                    </div>

                    <div>
                        <strong>Instant Meetings</strong>
                        <span>Create and share in seconds</span>
                    </div>

                </div>

            </div>

        </div>
    )
} 