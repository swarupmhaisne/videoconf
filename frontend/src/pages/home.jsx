import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";

import {
    Button,
    IconButton,
    TextField
} from "@mui/material";

import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";


function HomeComponent() {

    const navigate = useNavigate();

    const [meetingCode, setMeetingCode] = useState("");
    const [createdMeeting, setCreatedMeeting] = useState("");

    const { addToUserHistory } = useContext(AuthContext);


    // =========================
    // JOIN EXISTING MEETING
    // =========================

    const handleJoinVideoCall = async () => {

        if (!meetingCode.trim()) {
            alert("Please enter a meeting code");
            return;
        }

        await addToUserHistory(meetingCode.trim());

        navigate(`/${meetingCode.trim()}`);
    };


    // =========================
    // CREATE NEW MEETING
    // =========================

    const handleCreateMeeting = async () => {

        const newMeetingCode =
            "MEET-" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();

        await addToUserHistory(newMeetingCode);

        setCreatedMeeting(newMeetingCode);
    };


    // =========================
    // COPY MEETING LINK
    // =========================

    const handleCopyMeetingLink = async () => {

        if (!createdMeeting) return;

        const meetingLink =
            `${window.location.origin}/${createdMeeting}`;

        try {

            await navigator.clipboard.writeText(meetingLink);

            alert("Meeting link copied!");

        } catch (error) {

            console.error(error);

            alert(
                "Could not copy the link. Please copy it manually."
            );
        }
    };


    // =========================
    // COPY MEETING CODE
    // =========================

    const handleCopyMeetingCode = async () => {

        if (!createdMeeting) return;

        try {

            await navigator.clipboard.writeText(createdMeeting);

            alert("Meeting code copied!");

        } catch (error) {

            console.error(error);

            alert(
                "Could not copy the meeting code."
            );
        }
    };


    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {

        localStorage.removeItem("token");

        navigate("/auth");
    };


    return (

        <div className="homePage">


            {/* ================= NAVBAR ================= */}

            <div className="navBar">

                <div className="navBrand">

                    <h2>Meetora</h2>

                </div>


                <div className="navActions">

                    <IconButton
                        onClick={() => navigate("/history")}
                    >
                        <RestoreIcon />
                    </IconButton>

                    <span>History</span>


                    <Button
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>

                </div>

            </div>



            {/* ================= MAIN ================= */}

            <div className="meetContainer">


                <div className="leftPanel">

                    <div className="homeContent">


                        <h1>
                            Connect with people
                            <br />
                            that <span>matter.</span>
                        </h1>


                        <p className="homeSubtitle">
                            Create a meeting, share the link,
                            <br />
                            and connect from anywhere.
                        </p>



                        {/* ================= CREATE ================= */}

                        <Button
                            className="createMeetingBtn"
                            variant="contained"
                            onClick={handleCreateMeeting}
                        >
                            CREATE MEETING
                        </Button>



                        {/* ================= CREATED MEETING ================= */}

                        {createdMeeting && (

                            <div className="meetingCreatedCard">

                                <div className="successIcon">
                                    ✓
                                </div>


                                <h2>
                                    Meeting Created
                                </h2>


                                <p>
                                    Share the code or link with
                                    others to join.
                                </p>



                                {/* MEETING CODE */}

                                <div className="meetingInfo">

                                    <label>
                                        Meeting Code
                                    </label>


                                    <div className="meetingCodeRow">

                                        <strong>
                                            {createdMeeting}
                                        </strong>


                                        <Button
                                            size="small"
                                            onClick={
                                                handleCopyMeetingCode
                                            }
                                        >
                                            Copy
                                        </Button>

                                    </div>

                                </div>



                                {/* MEETING LINK */}

                                <div className="meetingInfo">

                                    <label>
                                        Meeting Link
                                    </label>


                                    <div className="meetingLinkBox">

                                        {window.location.origin}
                                        /{createdMeeting}

                                    </div>

                                </div>



                                {/* ACTIONS */}

                                <div className="meetingActions">

                                    <Button
                                        variant="contained"
                                        onClick={
                                            handleCopyMeetingLink
                                        }
                                    >
                                        Copy Meeting Link
                                    </Button>


                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            navigate(
                                                `/${createdMeeting}`
                                            );
                                        }}
                                    >
                                        Enter Meeting
                                    </Button>

                                </div>

                            </div>

                        )}



                        {/* ================= DIVIDER ================= */}

                        <div className="orDivider">

                            <span></span>

                            <p>OR</p>

                            <span></span>

                        </div>



                        {/* ================= JOIN ================= */}

                        <div className="joinMeeting">

                            <TextField
                                label="Meeting Code"
                                variant="outlined"
                                value={meetingCode}
                                onChange={(e) =>
                                    setMeetingCode(
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) => {

                                    if (e.key === "Enter") {
                                        handleJoinVideoCall();
                                    }

                                }}
                            />


                            <Button
                                variant="contained"
                                onClick={handleJoinVideoCall}
                            >
                                JOIN
                            </Button>

                        </div>


                    </div>

                </div>



                {/* ================= RIGHT PANEL ================= */}

                <div className="rightPanel">

                    <div className="homeIllustration">

                        <div className="illustrationGlow"></div>


                        <div className="illustrationCard">

                            <div className="illustrationHeader">

                                <span className="onlineDot"></span>

                                <span>
                                    Team Meeting
                                </span>

                            </div>


                            <div className="fakeVideoArea">

                                <div className="fakePerson mainPerson">
                                    👩🏻
                                </div>

                                <div className="sideVideos">

                                    <div className="fakePerson">
                                        👨🏻
                                    </div>

                                    <div className="fakePerson">
                                        👩🏽
                                    </div>

                                </div>

                            </div>


                            <div className="fakeControls">

                                <span>🎤</span>
                                <span>📹</span>
                                <span>🖥</span>
                                <span>💬</span>
                                <span className="endCall">
                                    ☎
                                </span>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}


export default withAuth(HomeComponent); 