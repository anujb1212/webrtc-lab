import { useEffect, useRef, useState } from "react"

export const Receiver = () => {
    const [status, setStatus] = useState<'disconnected' | 'connected' | 'receiving'>('disconnected');
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');

        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'receiver'
            }));
            setStatus('connected');
        };

        socket.onclose = () => {
            setStatus('disconnected');
        };

        startReceiving(socket);

        return () => {
            socket.close();
        };
    }, []);

    function startReceiving(socket: WebSocket) {
        const pc = new RTCPeerConnection();

        pc.ontrack = (event) => {
            if (videoRef.current) {
                videoRef.current.srcObject = new MediaStream([event.track]);
                videoRef.current.play();
                setStatus('receiving');
            }
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createOffer') {
                pc.setRemoteDescription(message.sdp).then(() => {
                    pc.createAnswer().then((answer) => {
                        pc.setLocalDescription(answer);
                        socket.send(JSON.stringify({
                            type: 'createAnswer',
                            sdp: answer
                        }));
                    });
                });
            } else if (message.type === 'iceCandidate') {
                pc.addIceCandidate(message.candidate);
            }
        };
    }

    return (
        <div className="container">
            <div className="header">
                <h1>📺 Receiver</h1>
                <p>Receive video stream</p>
                <div className="status-indicator">
                    <span className={`status-dot ${status === 'connected' ? 'connected' : status === 'receiving' ? 'connected' : ''}`}></span>
                    <span>
                        {status === 'disconnected' && 'Disconnected'}
                        {status === 'connected' && 'Waiting for stream...'}
                        {status === 'receiving' && 'Receiving'}
                    </span>
                </div>
            </div>

            <div className="video-container">
                <div className="video-wrapper">
                    {status === 'receiving' ? (
                        <video ref={videoRef} autoPlay playsInline />
                    ) : (
                        <div className="video-placeholder">
                            <div className="video-icon">📺</div>
                            <span>
                                {status === 'connected' ? 'Waiting for sender...' : 'Connecting...'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="info-card">
                <p>
                    You are ready to receive the video stream.
                    The stream will appear automatically when the sender starts broadcasting.
                </p>
            </div>
        </div>
    );
};
