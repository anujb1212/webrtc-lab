import { useEffect, useState, useRef } from "react"

export const Sender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [pc, setPC] = useState<RTCPeerConnection | null>(null);
    const [status, setStatus] = useState<'disconnected' | 'connected' | 'streaming'>('disconnected');
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        setSocket(socket);

        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'sender'
            }));
            setStatus('connected');
        };

        socket.onclose = () => {
            setStatus('disconnected');
        };

        return () => {
            socket.close();
        };
    }, []);

    const initiateConn = async () => {
        if (!socket) {
            alert("Socket not found");
            return;
        }

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createAnswer') {
                await pc?.setRemoteDescription(message.sdp);
            } else if (message.type === 'iceCandidate') {
                pc?.addIceCandidate(message.candidate);
            }
        };

        const newPc = new RTCPeerConnection();
        setPC(newPc);

        newPc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate
                }));
            }
        };

        newPc.onnegotiationneeded = async () => {
            const offer = await newPc.createOffer();
            await newPc.setLocalDescription(offer);
            socket?.send(JSON.stringify({
                type: 'createOffer',
                sdp: newPc.localDescription
            }));
        };

        getCameraStreamAndSend(newPc);
    };

    const getCameraStreamAndSend = async (pc: RTCPeerConnection) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            stream.getTracks().forEach((track) => {
                pc?.addTrack(track, stream);
            });

            setStatus('streaming');
        } catch (error) {
            console.error("Error accessing camera:", error);
            alert("Failed to access camera. Please check permissions.");
        }
    };

    return (
        <div className="container">
            <div className="header">
                <h1>📹 Sender</h1>
                <p>Share your video stream</p>
                <div className="status-indicator">
                    <span className={`status-dot ${status === 'connected' ? 'connected' : status === 'streaming' ? 'connected' : ''}`}></span>
                    <span>
                        {status === 'disconnected' && 'Disconnected'}
                        {status === 'connected' && 'Connected'}
                        {status === 'streaming' && 'Streaming'}
                    </span>
                </div>
            </div>

            <div className="video-container">
                <div className="video-wrapper">
                    {status === 'streaming' ? (
                        <video ref={videoRef} autoPlay playsInline muted />
                    ) : (
                        <div className="video-placeholder">
                            <div className="video-icon">📹</div>
                            <span>Click "Start Stream" to begin</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="controls">
                <button
                    onClick={initiateConn}
                    disabled={status === 'streaming' || status === 'disconnected'}
                >
                    {status === 'streaming' ? 'Streaming...' : 'Start Stream'}
                </button>
            </div>

            <div className="info-card">
                <p>
                    Your video stream will be sent to the receiver.
                    Make sure the receiver is connected before starting.
                </p>
            </div>
        </div>
    );
};
