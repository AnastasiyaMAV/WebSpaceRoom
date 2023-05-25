import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import "./App.css";
import { Button, Input, Card } from "antd";
import { CopyOutlined, PhoneOutlined } from "@ant-design/icons";
import { socket } from "./variables/variables";
import { CopyToClipboard } from "react-copy-to-clipboard";

function App() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      })
      .catch((e) => console.log(e));

    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });
  }, []);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });
    peer.on("stream", (stream) => {
      if (stream) {
        userVideo.current.srcObject = stream;
      }
    });
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
  };

  return (
    <>
      <h1 style={{ textAlign: "center" }}>Space Roow</h1>
      <div className="main-container">
        <div className="video-container">
          {stream && (
            <video className="video" playsInline muted ref={myVideo} autoPlay />
          )}
          {callAccepted && !callEnded && (
            <video className="video" playsInline ref={userVideo} autoPlay />
          )}
        </div>
        <div className="cards-container">
          <Card
            title="Call control panel"
            bordered={false}
            style={{
              width: 300,
            }}
          >
            <div>
              <label>Name</label>
              <Input
                placeholder="Your name"
                id="filled-basic"
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="button">
              <CopyToClipboard text={me}>
                <Button type="dashed" icon={<CopyOutlined />}>
                  Copy ID
                </Button>
              </CopyToClipboard>
            </div>
          </Card>

          <Card
            title="User call panel"
            bordered={false}
            style={{
              width: 300,
            }}
          >
            <div>
              <label>ID to call</label>
              <Input
                placeholder="ID to call"
                id="filled-basic"
                label="ID to call"
                value={idToCall}
                onChange={(e) => setIdToCall(e.target.value)}
              />
            </div>

            <div className="button">
              {callAccepted && !callEnded ? (
                <Button type="primary" onClick={leaveCall} danger>
                  End Call
                </Button>
              ) : (
                <Button
                  type="primary"
                  aria-label="call"
                  onClick={() => callUser(idToCall)}
                  icon={<PhoneOutlined />}
                />
              )}
            </div>
          </Card>

          <Card
            title="Call answer panel"
            bordered={false}
            style={{
              width: 300,
            }}
          >
            <div>
              {receivingCall && !callAccepted ? (
                <div className="caller">
                  <h2 className="title">They call you!!!</h2>
                  <div className="button"></div>
                  <Button type="primary" onClick={answerCall}>
                    Answer
                  </Button>
                </div>
              ) : (
                <div className="caller">
                  <h2>No incoming calls</h2>
                  <div className="button">
                    <Button disabled type="primary">
                      Answer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default App;
