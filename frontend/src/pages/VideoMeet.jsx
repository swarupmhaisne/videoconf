import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

import { Badge, IconButton, TextField, Button } from "@mui/material";

import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import GroupIcon from "@mui/icons-material/Group";

import server from "../environment";
import "./VideoMeet.css";

const server_url = server;

var connections = {};

const peerConfigConnections = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

export default function VideoMeetComponent() {

    const socketRef = useRef();
    const socketIdRef = useRef();

    const localVideoref = useRef();
    const videoRef = useRef([]);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);

    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);

    const [screen, setScreen] = useState();
    const [screenAvailable, setScreenAvailable] = useState(false);

    const [showModal, setModal] = useState(false);

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);

    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");

    const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [joinRequests, setJoinRequests] = useState([]);

    const [videos, setVideos] = useState([]);

    // --------------------------------------------------
    // GET PERMISSIONS
    // --------------------------------------------------

    useEffect(() => {
        getPermissions();
    }, []);

    const getPermissions = async () => {

        let videoTrack = null;
        let audioTrack = null;

        // Get the camera permission AND keep the camera track alive.
        // The previous version stopped the permission stream immediately,
        // so the lobby <video> element had nothing to display.
        try {
            const videoPermission =
                await navigator.mediaDevices.getUserMedia({
                    video: true
                });

            videoTrack = videoPermission.getVideoTracks()[0] || null;
            setVideoAvailable(Boolean(videoTrack));
            if (!videoTrack) setVideo(false);

        } catch (error) {
            setVideoAvailable(false);
            console.log("Camera permission denied/unavailable:", error);
        }

        // Get microphone permission separately so that the camera preview
        // still works even if microphone permission is unavailable.
        try {
            const audioPermission =
                await navigator.mediaDevices.getUserMedia({
                    audio: true
                });

            audioTrack = audioPermission.getAudioTracks()[0] || null;
            setAudioAvailable(Boolean(audioTrack));
            if (!audioTrack) setAudio(false);

        } catch (error) {
            setAudioAvailable(false);
            console.log("Microphone permission denied/unavailable:", error);
        }

        // Create the stream used by the lobby preview.
        const previewTracks = [];

        if (videoTrack) {
            previewTracks.push(videoTrack);
        }

        if (audioTrack) {
            previewTracks.push(audioTrack);
        }

        if (previewTracks.length > 0) {
            const previewStream = new MediaStream(previewTracks);

            // Clean up an older stream before replacing it.
            if (window.localStream) {
                window.localStream
                    .getTracks()
                    .forEach(track => track.stop());
            }

            window.localStream = previewStream;

            if (localVideoref.current) {
                localVideoref.current.srcObject = previewStream;

                // Make sure the preview starts playing.
                localVideoref.current
                    .play()
                    .catch(() => {});
            }
        }

        setScreenAvailable(
            Boolean(navigator.mediaDevices.getDisplayMedia)
        );
    };

    // --------------------------------------------------
    // DISPLAY MEDIA
    // --------------------------------------------------

    const getDislayMedia = () => {

        if (!screen) return;

        if (navigator.mediaDevices.getDisplayMedia) {

            navigator.mediaDevices
                .getDisplayMedia({
                    video: true,
                    audio: true
                })
                .then(getDislayMediaSuccess)
                .catch((e) => console.log(e));
        }
    };

    // --------------------------------------------------
    // GET USER MEDIA
    // --------------------------------------------------

    useEffect(() => {

        // The lobby preview stream is reused for the meeting.
        // Do not reacquire the camera/mic every time a toggle changes.
        if (!askForUsername && window.localStream) {

            window.localStream
                .getVideoTracks()
                .forEach(track => {
                    track.enabled =
                        video &&
                        videoAvailable;
                });

            window.localStream
                .getAudioTracks()
                .forEach(track => {
                    track.enabled =
                        audio &&
                        audioAvailable;
                });
        }

    }, [video, audio, askForUsername, videoAvailable, audioAvailable]);

    const getMedia = async () => {

        // The lobby already has a preview stream. Reuse it.
        // If it is unavailable, acquire media first.
        if (!window.localStream) {
            await new Promise(resolve => {

                navigator.mediaDevices
                    .getUserMedia({
                        video:
                            video &&
                            videoAvailable,
                        audio:
                            audio &&
                            audioAvailable
                    })
                    .then(stream => {
                        window.localStream = stream;

                        if (localVideoref.current) {
                            localVideoref.current.srcObject =
                                stream;

                            localVideoref.current
                                .play()
                                .catch(() => {});
                        }

                        resolve();
                    })
                    .catch(error => {
                        console.log(
                            "Unable to get meeting media:",
                            error
                        );
                        resolve();
                    });

            });
        }

        // IMPORTANT:
        // Connect to Socket.IO only after local media exists.
        connectToSocketServer();
    };

    const replaceOutgoingTracks = (stream) => {

        Object.values(connections).forEach(
            peerConnection => {

                const senders =
                    peerConnection.getSenders();

                stream.getTracks().forEach(
                    newTrack => {

                        const sender =
                            senders.find(
                                existingSender =>
                                    existingSender.track &&
                                    existingSender.track.kind ===
                                        newTrack.kind
                            );

                        if (sender) {

                            sender.replaceTrack(
                                newTrack
                            ).catch(e =>
                                console.log(
                                    "replaceTrack error:",
                                    e
                                )
                            );

                        } else {

                            peerConnection.addTrack(
                                newTrack,
                                stream
                            );
                        }

                    }
                );
            }
        );
    };


    const getUserMediaSuccess = (stream) => {

        try {

            if (window.localStream) {
                window.localStream
                    .getTracks()
                    .forEach(track => track.stop());
            }

        } catch (e) {
            console.log(e);
        }

        window.localStream = stream;

        // Keep existing WebRTC connections using the new tracks.
        replaceOutgoingTracks(stream);

        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
            localVideoref.current
                .play()
                .catch(() => {});
        }

        // Local media is already attached to peer connections.
        // Do not create offers here; only the newly joined user
        // creates offers. This prevents duplicate/glare offers.

        stream.getTracks().forEach(track => {

            track.onended = () => {

                setVideo(false);
                setAudio(false);

                try {

                    const tracks =
                        localVideoref.current.srcObject.getTracks();

                    tracks.forEach(track => track.stop());

                } catch (e) {
                    console.log(e);
                }

                const blackSilence = () =>
                    new MediaStream([
                        black(),
                        silence()
                    ]);

                window.localStream = blackSilence();

                localVideoref.current.srcObject =
                    window.localStream;
            };

        });

    };

    const getUserMedia = () => {

        if (
            (video && videoAvailable) ||
            (audio && audioAvailable)
        ) {

            navigator.mediaDevices
                .getUserMedia({
                    video: video,
                    audio: audio
                })
                .then(getUserMediaSuccess)
                .catch(e => console.log(e));

        } else {

            try {
                if (localVideoref.current?.srcObject) {
                    const tracks =
                        localVideoref.current.srcObject.getTracks();

                    tracks.forEach(track => track.stop());
                    localVideoref.current.srcObject = null;
                }
            } catch (e) {
                console.log(e);
            }
        }
    };

    // --------------------------------------------------
    // SCREEN SHARE
    // --------------------------------------------------

    const getDislayMediaSuccess = (stream) => {

        try {

            if (window.localStream) {
                window.localStream
                    .getTracks()
                    .forEach(track => track.stop());
            }

        } catch (e) {
            console.log(e);
        }

        window.localStream = stream;

        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
            localVideoref.current
                .play()
                .catch(() => {});
        }

        // Replace the outgoing video/audio tracks instead of adding
        // duplicate tracks and renegotiating every connection.
        Object.values(connections).forEach(peerConnection => {
            const senders = peerConnection.getSenders();

            stream.getTracks().forEach(newTrack => {
                const sender = senders.find(
                    existingSender =>
                        existingSender.track &&
                        existingSender.track.kind === newTrack.kind
                );

                if (sender) {
                    sender.replaceTrack(newTrack).catch(e =>
                        console.log("replaceTrack error:", e)
                    );
                }
            });
        });

        stream.getTracks().forEach(track => {

            track.onended = () => {

                setScreen(false);

                try {

                    const tracks =
                        localVideoref.current.srcObject.getTracks();

                    tracks.forEach(track => track.stop());

                } catch (e) {
                    console.log(e);
                }

                const blackSilence = () =>
                    new MediaStream([
                        black(),
                        silence()
                    ]);

                window.localStream = blackSilence();

                localVideoref.current.srcObject =
                    window.localStream;

                getUserMedia();
            };

        });

    };

    useEffect(() => {

        if (screen !== undefined) {
            getDislayMedia();
        }

    }, [screen]);

    // --------------------------------------------------
    // WEBRTC HELPERS + SIGNALING
    // --------------------------------------------------

    const pendingIceCandidates = useRef({});

    const addLocalTracks = (peerConnection) => {
        if (!window.localStream) return;

        const existingSenders = peerConnection.getSenders();

        window.localStream.getTracks().forEach(track => {
            const alreadyAdded = existingSenders.some(
                sender => sender.track && sender.track.id === track.id
            );

            if (!alreadyAdded) {
                peerConnection.addTrack(
                    track,
                    window.localStream
                );
            }
        });
    };

    const createPeerConnection = (remoteId, users = {}) => {

        if (connections[remoteId]) {
            return connections[remoteId];
        }

        console.log(
            "CREATING PEER CONNECTION:",
            socketIdRef.current,
            "->",
            remoteId
        );

        const peerConnection =
            new RTCPeerConnection(peerConfigConnections);

        connections[remoteId] = peerConnection;

        pendingIceCandidates.current[remoteId] = [];

        peerConnection.onicecandidate = event => {

            if (event.candidate) {

                socketRef.current?.emit(
                    "signal",
                    remoteId,
                    JSON.stringify({
                        ice: event.candidate
                    })
                );
            }
        };

        peerConnection.ontrack = event => {

            const stream =
                event.streams && event.streams[0]
                    ? event.streams[0]
                    : null;

            if (!stream) {
                console.log(
                    "Remote track received without stream:",
                    remoteId
                );
                return;
            }

            console.log(
                "REMOTE STREAM RECEIVED:",
                remoteId
            );

            setVideos(prevVideos => {

                const existing =
                    prevVideos.find(
                        video =>
                            video.socketId === remoteId
                    );

                let updatedVideos;

                if (existing) {

                    updatedVideos =
                        prevVideos.map(video =>
                            video.socketId === remoteId
                                ? {
                                    ...video,
                                    stream: stream,
                                    username:
                                        users?.[remoteId] ||
                                        video.username ||
                                        "Participant"
                                }
                                : video
                        );

                } else {

                    updatedVideos = [
                        ...prevVideos,
                        {
                            socketId: remoteId,
                            username:
                                users?.[remoteId] ||
                                "Participant",
                            stream: stream,
                            autoplay: true,
                            playsinline: true
                        }
                    ];
                }

                videoRef.current =
                    updatedVideos;

                return updatedVideos;
            });
        };

        peerConnection.onconnectionstatechange = () => {

            console.log(
                "PEER CONNECTION STATE:",
                remoteId,
                peerConnection.connectionState
            );

            if (
                peerConnection.connectionState ===
                    "failed" ||
                peerConnection.connectionState ===
                    "closed"
            ) {

                try {
                    peerConnection.close();
                } catch (e) {}

                delete connections[remoteId];

                delete pendingIceCandidates
                    .current[remoteId];

                setVideos(prev =>
                    prev.filter(
                        video =>
                            video.socketId !== remoteId
                    )
                );

                videoRef.current =
                    videoRef.current.filter(
                        video =>
                            video.socketId !== remoteId
                    );
            }
        };

        addLocalTracks(peerConnection);

        return peerConnection;
    };


    const createOfferForPeer = async (remoteId) => {

        const peerConnection =
            connections[remoteId];

        if (!peerConnection) {
            console.log(
                "Cannot create offer. Peer not found:",
                remoteId
            );
            return;
        }

        try {

            const offer =
                await peerConnection.createOffer();

            await peerConnection.setLocalDescription(
                offer
            );

            socketRef.current?.emit(
                "signal",
                remoteId,
                JSON.stringify({
                    sdp:
                        peerConnection.localDescription
                })
            );

            console.log(
                "OFFER SENT:",
                socketIdRef.current,
                "->",
                remoteId
            );

        } catch (error) {

            console.log(
                "CREATE OFFER ERROR:",
                error
            );
        }
    };


    const gotMessageFromServer = async (
        fromId,
        message
    ) => {

        if (
            fromId === socketIdRef.current
        ) {
            return;
        }

        let signal;

        try {
            signal = JSON.parse(message);
        } catch (error) {
            console.log(
                "Invalid signal:",
                error
            );
            return;
        }

        const peerConnection =
            connections[fromId] ||
            createPeerConnection(
                fromId
            );

        if (!peerConnection) {
            return;
        }

        // --------------------------------------------------
        // SDP OFFER / ANSWER
        // --------------------------------------------------

        if (signal.sdp) {

            try {

                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(
                        signal.sdp
                    )
                );

                console.log(
                    "REMOTE DESCRIPTION SET:",
                    fromId,
                    signal.sdp.type
                );

                // ICE candidates that arrived before SDP
                // are now safe to add.
                const queuedCandidates =
                    pendingIceCandidates.current[
                        fromId
                    ] || [];

                for (
                    const candidate of
                    queuedCandidates
                ) {

                    try {

                        await peerConnection.addIceCandidate(
                            candidate
                        );

                    } catch (error) {

                        console.log(
                            "QUEUED ICE ERROR:",
                            error
                        );
                    }
                }

                pendingIceCandidates.current[
                    fromId
                ] = [];

                if (
                    signal.sdp.type === "offer"
                ) {

                    const answer =
                        await peerConnection
                            .createAnswer();

                    await peerConnection
                        .setLocalDescription(
                            answer
                        );

                    socketRef.current?.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                            sdp:
                                peerConnection
                                    .localDescription
                        })
                    );

                    console.log(
                        "ANSWER SENT:",
                        socketIdRef.current,
                        "->",
                        fromId
                    );
                }

            } catch (error) {

                console.log(
                    "SDP SIGNALING ERROR:",
                    error
                );
            }
        }


        // --------------------------------------------------
        // ICE CANDIDATE
        // --------------------------------------------------

        if (signal.ice) {

            const candidate =
                new RTCIceCandidate(
                    signal.ice
                );

            if (
                peerConnection.remoteDescription &&
                peerConnection.remoteDescription.type
            ) {

                try {

                    await peerConnection
                        .addIceCandidate(
                            candidate
                        );

                } catch (error) {

                    console.log(
                        "ICE ERROR:",
                        error
                    );
                }

            } else {

                console.log(
                    "QUEUEING ICE CANDIDATE:",
                    fromId
                );

                if (
                    !pendingIceCandidates.current[
                        fromId
                    ]
                ) {

                    pendingIceCandidates.current[
                        fromId
                    ] = [];
                }

                pendingIceCandidates.current[
                    fromId
                ].push(candidate);
            }
        }
    };


    // --------------------------------------------------
    // SOCKET CONNECTION
    // --------------------------------------------------

    const connectToSocketServer = () => {

        if (
            socketRef.current?.connected
        ) {
            return;
        }

        socketRef.current =
            io.connect(
                server_url,
                {
                    secure: false
                }
            );


        socketRef.current.on(
            "signal",
            gotMessageFromServer
        );


        socketRef.current.on(
            "connect",
            () => {

                socketIdRef.current =
                    socketRef.current.id;

                console.log(
                    "SOCKET CONNECTED:",
                    socketIdRef.current
                );


                // --------------------------------------------------
                // MEETING STATUS
                // --------------------------------------------------

                socketRef.current.on(
                    "meeting-status",
                    status => {

                        console.log(
                            "MEETING STATUS:",
                            status
                        );

                        setIsAdmin(
                            Boolean(
                                status.isAdmin
                            )
                        );


                        if (
                            status.isAdmin
                        ) {

                            setIsWaitingForApproval(
                                false
                            );

                            // IMPORTANT:
                            // Local media is ready before socket
                            // connection because connect() waits for it.
                            socketRef.current.emit(
                                "join-call",
                                window.location.href,
                                username
                            );

                        } else {

                            setIsWaitingForApproval(
                                true
                            );

                            socketRef.current.emit(
                                "request-join",
                                window.location.href,
                                username
                            );
                        }
                    }
                );


                // --------------------------------------------------
                // ADMIN RECEIVES JOIN REQUEST
                // --------------------------------------------------

                socketRef.current.on(
                    "join-request",
                    (
                        userSocketId,
                        requestedUsername
                    ) => {

                        console.log(
                            "JOIN REQUEST:",
                            requestedUsername,
                            userSocketId
                        );

                        setJoinRequests(
                            prev => {

                                if (
                                    prev.some(
                                        request =>
                                            request.socketId ===
                                            userSocketId
                                    )
                                ) {
                                    return prev;
                                }

                                return [
                                    ...prev,
                                    {
                                        socketId:
                                            userSocketId,
                                        username:
                                            requestedUsername
                                    }
                                ];
                            }
                        );
                    }
                );


                // --------------------------------------------------
                // PARTICIPANT APPROVED
                // --------------------------------------------------

                socketRef.current.on(
                    "join-approved",
                    () => {

                        console.log(
                            "JOIN APPROVED"
                        );

                        setIsWaitingForApproval(
                            false
                        );

                        socketRef.current.emit(
                            "join-call",
                            window.location.href,
                            username
                        );
                    }
                );


                // --------------------------------------------------
                // PARTICIPANT REJECTED
                // --------------------------------------------------

                socketRef.current.on(
                    "join-rejected",
                    reason => {

                        console.log(
                            "JOIN REJECTED:",
                            reason
                        );

                        alert(
                            reason ||
                            "The admin rejected your request."
                        );

                        setIsWaitingForApproval(
                            false
                        );

                        setIsAdmin(false);

                        setJoinRequests([]);

                        if (
                            socketRef.current
                        ) {
                            socketRef.current.disconnect();
                        }

                        setAskForUsername(
                            true
                        );
                    }
                );


                // --------------------------------------------------
                // HOST ENDED MEETING
                // --------------------------------------------------

                socketRef.current.on(
                    "meeting-ended",
                    reason => {

                        alert(
                            reason ||
                            "The host ended the meeting."
                        );

                        Object.keys(
                            connections
                        ).forEach(id => {

                            try {
                                connections[id]
                                    .close();
                            } catch (e) {}

                            delete connections[id];
                        });

                        setVideos([]);

                        videoRef.current = [];

                        setAskForUsername(
                            true
                        );

                        setIsWaitingForApproval(
                            false
                        );

                    }
                );


                // --------------------------------------------------
                // CHAT
                // --------------------------------------------------

                socketRef.current.on(
                    "chat-message",
                    addMessage
                );


                // --------------------------------------------------
                // USER LEFT
                // --------------------------------------------------

                socketRef.current.on(
                    "user-left",
                    id => {

                        console.log(
                            "USER LEFT:",
                            id
                        );

                        if (
                            connections[id]
                        ) {

                            try {
                                connections[id]
                                    .close();
                            } catch (e) {}

                            delete connections[id];
                        }

                        delete pendingIceCandidates
                            .current[id];

                        setVideos(
                            prev =>
                                prev.filter(
                                    video =>
                                        video.socketId !==
                                        id
                                )
                        );

                        videoRef.current =
                            videoRef.current.filter(
                                video =>
                                    video.socketId !==
                                    id
                            );
                    }
                );


                // --------------------------------------------------
                // USER JOINED
                // --------------------------------------------------

                socketRef.current.on(
                    "user-joined",
                    (
                        id,
                        clients,
                        users
                    ) => {

                        console.log(
                            "USER JOINED:",
                            id,
                            clients
                        );


                        clients.forEach(
                            remoteId => {

                                if (
                                    remoteId ===
                                    socketIdRef.current
                                ) {
                                    return;
                                }


                                const peerConnection =
                                    createPeerConnection(
                                        remoteId,
                                        users
                                    );


                                /*
                                 * ONLY THE NEWLY JOINED USER
                                 * CREATES THE OFFER.
                                 *
                                 * This prevents both sides from
                                 * creating offers simultaneously.
                                 */

                                if (
                                    id ===
                                    socketIdRef.current
                                ) {

                                    createOfferForPeer(
                                        remoteId
                                    );
                                }

                            }
                        );
                    }
                );


                // --------------------------------------------------
                // NOW CHECK THE MEETING
                // --------------------------------------------------

                socketRef.current.emit(
                    "check-meeting",
                    window.location.href
                );

            }
        );
    };


    // --------------------------------------------------
    // BLACK / SILENCE STREAM
    // --------------------------------------------------

    const silence = () => {

        const ctx = new AudioContext();

        const oscillator =
            ctx.createOscillator();

        const dst =
            oscillator.connect(
                ctx.createMediaStreamDestination()
            );

        oscillator.start();

        ctx.resume();

        return Object.assign(
            dst.stream.getAudioTracks()[0],
            {
                enabled: false
            }
        );
    };

    const black = ({
        width = 640,
        height = 480
    } = {}) => {

        const canvas =
            Object.assign(
                document.createElement("canvas"),
                {
                    width,
                    height
                }
            );

        canvas
            .getContext("2d")
            .fillRect(
                0,
                0,
                width,
                height
            );

        const stream =
            canvas.captureStream();

        return Object.assign(
            stream.getVideoTracks()[0],
            {
                enabled: false
            }
        );
    };

    // --------------------------------------------------
    // CONTROLS
    // --------------------------------------------------

    const handleVideo = () => {
        setVideo(!video);
    };

    const handleAudio = () => {
        setAudio(!audio);
    };

    const handleScreen = () => {
        setScreen(!screen);
    };

    const handleEndCall = () => {

        try {

            const tracks =
                localVideoref.current
                    .srcObject
                    .getTracks();

            tracks.forEach(track =>
                track.stop()
            );

        } catch (e) { }

        try {
            if (window.localStream) {
                window.localStream
                    .getTracks()
                    .forEach(track => track.stop());

                window.localStream = null;
            }

            if (socketRef.current) {
                socketRef.current.disconnect();
            }

            Object.keys(connections).forEach(id => {
                try {
                    connections[id].close();
                } catch (e) {}
                delete connections[id];
            });

            videoRef.current = [];
            pendingIceCandidates.current = {};
        } catch (e) {
            console.log(e);
        }

        window.location.href = "/";
    };

    // --------------------------------------------------
    // CHAT
    // --------------------------------------------------

    const addMessage = (
        data,
        sender,
        socketIdSender
    ) => {

        setMessages(prevMessages => [
            ...prevMessages,
            {
                sender: sender,
                data: data
            }
        ]);

        if (
            socketIdSender !==
            socketIdRef.current
        ) {

            setNewMessages(
                prevNewMessages =>
                    prevNewMessages + 1
            );
        }
    };

    const sendMessage = () => {

        if (!message.trim()) return;

        socketRef.current.emit(
            "chat-message",
            message,
            username
        );

        setMessage("");
    };

    // --------------------------------------------------
    // LOBBY MEDIA CONTROLS
    // --------------------------------------------------

    const toggleLobbyVideo = () => {
        if (!videoAvailable) return;

        const nextVideo = !video;
        setVideo(nextVideo);

        if (window.localStream) {
            window.localStream
                .getVideoTracks()
                .forEach(track => {
                    track.enabled = nextVideo;
                });
        }
    };

    const toggleLobbyAudio = () => {
        if (!audioAvailable) return;

        const nextAudio = !audio;
        setAudio(nextAudio);

        if (window.localStream) {
            window.localStream
                .getAudioTracks()
                .forEach(track => {
                    track.enabled = nextAudio;
                });
        }
    };

    // --------------------------------------------------
    // CONNECT
    // --------------------------------------------------

    const connect = async () => {

        if (!username.trim()) {
            return;
        }

        setAskForUsername(false);

        await getMedia();
    };

    // --------------------------------------------------
    // MEETING AUTHORIZATION
    // --------------------------------------------------

    const approveJoinRequest = (userSocketId) => {

        socketRef.current?.emit(
            "approve-join",
            window.location.href,
            userSocketId,
            true
        );

        setJoinRequests(prev =>
            prev.filter(
                request =>
                    request.socketId !== userSocketId
            )
        );
    };

    const rejectJoinRequest = (userSocketId) => {

        socketRef.current?.emit(
            "approve-join",
            window.location.href,
            userSocketId,
            false
        );

        setJoinRequests(prev =>
            prev.filter(
                request =>
                    request.socketId !== userSocketId
            )
        );
    };

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (

        <div className="videoMeetPage">

            {askForUsername ? (

                /* =========================
                   LOBBY
                ========================= */

                <div className="lobbyPage">

                    <header className="lobbyHeader">

                        <div
                            className="meetoraBrand"
                        >
                            <div className="brandCamera">
                                <VideocamIcon />
                            </div>

                            <span>
                                Meet<span>ora</span>
                            </span>
                        </div>

                        <div className="lobbySecure">
                            <span className="statusDot"></span>
                            Secure meeting
                        </div>

                    </header>


                    <main className="lobbyContent">

                        <div className="lobbyPreview">

                            <div className="previewHeader">
                                <span>
                                    Camera preview
                                </span>

                                <span className="liveIndicator">
                                    ● Live
                                </span>
                            </div>

                            <div className="previewVideoWrapper">

                                <video
                                    ref={localVideoref}
                                    autoPlay
                                    muted
                                    playsInline
                                />

                                {!videoAvailable ? (
                                    <div className="cameraOffMessage">
                                        <VideocamOffIcon />
                                        <span>
                                            Camera unavailable
                                        </span>
                                    </div>
                                ) : !video ? (
                                    <div className="cameraOffMessage">
                                        <VideocamOffIcon />
                                        <span>
                                            Camera is off
                                        </span>
                                    </div>
                                ) : null}

                            </div>

                            <div className="previewControls">

                                <button
                                    type="button"
                                    className={`previewControl ${
                                        audio ? "enabled" : "disabled"
                                    }`}
                                    onClick={toggleLobbyAudio}
                                    disabled={!audioAvailable}
                                    aria-label={
                                        audio
                                            ? "Turn microphone off"
                                            : "Turn microphone on"
                                    }
                                >
                                    {audio ? <MicIcon /> : <MicOffIcon />}
                                    <span>
                                        {audio ? "Microphone on" : "Microphone off"}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={`previewControl ${
                                        video ? "enabled" : "disabled"
                                    }`}
                                    onClick={toggleLobbyVideo}
                                    disabled={!videoAvailable}
                                    aria-label={
                                        video
                                            ? "Turn camera off"
                                            : "Turn camera on"
                                    }
                                >
                                    {video ? <VideocamIcon /> : <VideocamOffIcon />}
                                    <span>
                                        {video ? "Camera on" : "Camera off"}
                                    </span>
                                </button>

                            </div>

                        </div>


                        <div className="lobbyCard">

                            <div className="lobbyIcon">
                                <VideocamIcon />
                            </div>

                            <p className="lobbyEyebrow">
                                YOU'RE ABOUT TO JOIN
                            </p>

                            <h1>
                                Ready to join?
                            </h1>

                            <p className="lobbyDescription">
                                Enter your name to join
                                the meeting.
                            </p>


                            <div className="nameField">

                                <label>
                                    Your name
                                </label>

                                <TextField
                                    fullWidth
                                    placeholder="Enter your name"
                                    value={username}
                                    onChange={e =>
                                        setUsername(
                                            e.target.value
                                        )
                                    }
                                    onKeyDown={e => {
                                        if (
                                            e.key === "Enter"
                                        ) {
                                            connect();
                                        }
                                    }}
                                />

                            </div>


                            <Button
                                fullWidth
                                className="joinMeetingButton"
                                onClick={connect}
                            >
                                <span>
                                    Join Meeting
                                </span>

                                <span>
                                    →
                                </span>
                            </Button>


                            <p className="lobbyNote">
                                By joining, you agree to
                                keep the conversation
                                respectful.
                            </p>

                        </div>

                    </main>

                </div>

            ) : isWaitingForApproval ? (

                /* =========================
                   WAITING FOR ADMIN APPROVAL
                ========================= */

                <div className="meetingPage">
                    <header className="meetingHeader">

                        <div className="meetingBrand">
                            <div className="brandCamera small">
                                <VideocamIcon />
                            </div>

                            <span>
                                Meet<span>ora</span>
                            </span>
                        </div>

                        <div className="meetingInfo">
                            <span className="onlineDot"></span>
                            <span>Waiting for approval</span>
                        </div>

                        <div className="meetingActions">
                            <div className="meetingCode">
                                {window.location.pathname
                                    .replace("/", "")
                                    .toUpperCase()}
                            </div>
                        </div>

                    </header>

                    <main
                        className="meetingMain"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: "calc(100vh - 80px)"
                        }}
                    >
                        <div
                            style={{
                                width: "min(520px, 90vw)",
                                padding: "32px",
                                borderRadius: "20px",
                                background: "rgba(255,255,255,0.08)",
                                textAlign: "center",
                                backdropFilter: "blur(12px)"
                            }}
                        >
                            <div
                                style={{
                                    width: "72px",
                                    height: "72px",
                                    margin: "0 auto 20px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "rgba(255,255,255,0.12)"
                                }}
                            >
                                <GroupIcon />
                            </div>

                            <h2>Waiting for the host</h2>

                            <p>
                                Your request to join this meeting has
                                been sent to the admin.
                            </p>

                            <p>
                                Please wait until the host allows you
                                to enter.
                            </p>

                            <Button
                                variant="outlined"
                                onClick={handleEndCall}
                                style={{ marginTop: "16px" }}
                            >
                                Leave
                            </Button>
                        </div>
                    </main>
                </div>

            ) : (

                /* =========================
                   ACTUAL MEETING
                ========================= */

                <div className="meetingPage">

                    {/* TOP BAR */}

                    <header className="meetingHeader">

                        <div className="meetingBrand">

                            <div className="brandCamera small">
                                <VideocamIcon />
                            </div>

                            <span>
                                Meet<span>ora</span>
                            </span>

                        </div>


                        <div className="meetingInfo">

                            <span className="onlineDot"></span>

                            <span>
                                Team Meeting
                            </span>

                        </div>


                        <div className="meetingActions">

                            <div className="participantCount">

                                <GroupIcon />

                                <span>
                                    {videos.length + 1}
                                </span>

                            </div>

                            <div className="meetingCode">
                                {window.location.pathname
                                    .replace("/", "")
                                    .toUpperCase()}
                            </div>

                        </div>

                    </header>

                    {isAdmin && joinRequests.length > 0 && (
                        <div
                            style={{
                                position: "fixed",
                                top: "90px",
                                right: "24px",
                                zIndex: 1000,
                                width: "min(360px, calc(100vw - 48px))",
                                padding: "18px",
                                borderRadius: "16px",
                                background: "rgba(20, 20, 28, 0.96)",
                                boxShadow: "0 12px 40px rgba(0,0,0,0.35)"
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "12px"
                                }}
                            >
                                <strong>Join requests</strong>
                                <span>{joinRequests.length}</span>
                            </div>

                            {joinRequests.map(request => (
                                <div
                                    key={request.socketId}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "12px",
                                        padding: "12px 0",
                                        borderTop: "1px solid rgba(255,255,255,0.1)"
                                    }}
                                >
                                    <span>
                                        {request.username || "Participant"}
                                    </span>

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "8px"
                                        }}
                                    >
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() =>
                                                approveJoinRequest(
                                                    request.socketId
                                                )
                                            }
                                        >
                                            Allow
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() =>
                                                rejectJoinRequest(
                                                    request.socketId
                                                )
                                            }
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}


                    {/* MAIN VIDEO AREA */}

                    <main className="meetingMain">

                        <div className="videoGrid">

                            {/* LOCAL VIDEO */}

                            <div className="videoTile localTile">

                                <video
                                    className="meetUserVideo"
                                    ref={localVideoref}
                                    autoPlay
                                    muted
                                    playsInline
                                />

                                <div className="participantLabel">
                                    <span className="micStatus">
                                        {audio
                                            ? <MicIcon />
                                            : <MicOffIcon />
                                        }
                                    </span>

                                    {username || "You"}
                                </div>

                                <div className="youBadge">
                                    You
                                </div>

                            </div>


                            {/* OTHER PARTICIPANTS */}

                            {videos.map((video) => (

                                <div
                                    className="videoTile"
                                    key={video.socketId}
                                >

                                    <video
                                        data-socket={
                                            video.socketId
                                        }
                                        ref={ref => {

                                            if (
                                                ref &&
                                                video.stream
                                            ) {

                                                ref.srcObject =
                                                    video.stream;
                                            }

                                        }}
                                        autoPlay
                                        playsInline
                                    />

                                    <div className="participantLabel">
                                        <span className="micStatus">
                                            <MicIcon />
                                        </span>

                                        {video.username || "Participant"} 
                                    </div>

                                </div>

                            ))}

                        </div>


                        {/* EMPTY MEETING */}

                        {videos.length === 0 && (

                            <div className="waitingMessage">

                                <div className="waitingIcon">
                                    <GroupIcon />
                                </div>

                                <h2>
                                    You're the only one here
                                </h2>

                                <p>
                                    Share the meeting code
                                    with someone to invite
                                    them.
                                </p>

                                <button
                                    className="copyCodeButton"
                                    onClick={() => {

                                        const code =
                                            window.location.pathname
                                                .replace("/", "")
                                                .toUpperCase();

                                        navigator.clipboard.writeText(
                                            code
                                        );

                                    }}
                                >
                                    <ContentCopyIcon />
                                    Copy meeting code
                                </button>

                            </div>

                        )}

                    </main>


                    {/* CHAT */}

                    {showModal && (

                        <aside className="chatPanel">

                            <div className="chatHeader">

                                <div>

                                    <h2>
                                        Meeting chat
                                    </h2>

                                    <span>
                                        {messages.length} messages
                                    </span>

                                </div>

                                <button
                                    onClick={() =>
                                        setModal(false)
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            <div className="chatMessages">

                                {messages.length === 0 ? (

                                    <div className="emptyChat">

                                        <div>
                                            💬
                                        </div>

                                        <h3>
                                            No messages yet
                                        </h3>

                                        <p>
                                            Start the conversation.
                                        </p>

                                    </div>

                                ) : (

                                    messages.map(
                                        (item, index) => (

                                            <div
                                                className={
                                                    item.sender === username
                                                        ? "chatMessage own"
                                                        : "chatMessage"
                                                }
                                                key={index}
                                            >

                                                <span>
                                                    {item.sender}
                                                </span>

                                                <p>
                                                    {item.data}
                                                </p>

                                            </div>

                                        )
                                    )

                                )}

                            </div>


                            <div className="chatInput">

                                <TextField
                                    fullWidth
                                    placeholder="Type a message..."
                                    value={message}
                                    onChange={e =>
                                        setMessage(
                                            e.target.value
                                        )
                                    }
                                    onKeyDown={e => {

                                        if (
                                            e.key === "Enter"
                                        ) {
                                            sendMessage();
                                        }

                                    }}
                                />

                                <Button
                                    onClick={sendMessage}
                                >
                                    →
                                </Button>

                            </div>

                        </aside>

                    )}


                    {/* BOTTOM CONTROLS */}

                    <div className="meetingControls">

                        <IconButton
                            className={
                                video
                                    ? "controlButton"
                                    : "controlButton active"
                            }
                            onClick={handleVideo}
                        >
                            {video
                                ? <VideocamIcon />
                                : <VideocamOffIcon />
                            }
                        </IconButton>


                        <IconButton
                            className={
                                audio
                                    ? "controlButton"
                                    : "controlButton active"
                            }
                            onClick={handleAudio}
                        >
                            {audio
                                ? <MicIcon />
                                : <MicOffIcon />
                            }
                        </IconButton>


                        {screenAvailable && (

                            <IconButton
                                className={
                                    screen
                                        ? "controlButton active"
                                        : "controlButton"
                                }
                                onClick={handleScreen}
                            >
                                {screen
                                    ? <StopScreenShareIcon />
                                    : <ScreenShareIcon />
                                }
                            </IconButton>

                        )}


                        <IconButton
                            className="controlButton"
                            onClick={() => {

                                setModal(!showModal);

                                setNewMessages(0);

                            }}
                        >

                            <Badge
                                badgeContent={
                                    newMessages
                                }
                                color="error"
                            >
                                <ChatIcon />
                            </Badge>

                        </IconButton>


                        <IconButton
                            className="endCallButton"
                            onClick={handleEndCall}
                        >
                            <CallEndIcon />
                        </IconButton>

                    </div>

                </div>

            )}

        </div>
    );
} 
 