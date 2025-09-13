import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("https://realtime-chat-app-8g02.onrender.com");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [joined, setJoined] = useState(false);
  const [typing, setTyping] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef();

  // Handle socket events (in a single useEffect)
  useEffect(() => {
    socket.on("receive_message", (data) => {
      setChat((prev) => [
        ...prev,
        {
          ...data,
          status: data.username === username ? "sent" : "seen",
        },
      ]);
    });

    socket.on("user_typing", ({ username }) => {
      setTyping(`${username} is typing...`)
      
      setTimeout(() => {
        setTyping("");
      },3000)
    
    });
    // socket.on("user_stop_typing", () => setTyping(""));

    return () => {
      socket.off("receive_message");
      socket.off("user_typing");
      // socket.off("user_stop_typing");
    };
  }, [username]); // Only listen to changes in username

  // Focus on input area when a message or user joins
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [chat, joined]);

  //scroll to bottom smooth
  useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [chat]);


  // Join a room
  const joinRoom = () => {
    if (username && room) {
      socket.emit("join_room", { username, room });
      setJoined(true);
    }
  };

  // Send a message
  const sendMessage = () => {
    if (message.trim()) {
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const newMsg = {
        username,
        text: message,
        room,
        time,
        status: "sent", // Initially set to "sent" until seen by others
      };

      // setChat((prev) => [...prev, newMsg]); // Instant feedback
      socket.emit("send_message", newMsg);

      setMessage(""); // Clear message input
      // socket.emit("user_stop_typing", { room });
    }
  };

  // Handle typing input
  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("user_typing", { username, room });

    // Delay sending the stop typing event to give a buffer before sending
    // if (typingTimeout.current) clearTimeout(typingTimeout.current);
    // typingTimeout.current = setTimeout(() => {
    //   socket.emit("user_stop_typing", { room });
    // }, 1000);
  };

  if (!joined) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <h2>💬 Welcome to ChatApp</h2>
          <p className="subtext">Join a room to start chatting!</p>
  
          <input
            className="login-input"
            placeholder="👤 Username"
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="login-input"
            placeholder="🏠 Room name"
            onChange={(e) => setRoom(e.target.value)}
          />
          <button className="login-button" onClick={joinRoom}>
            🚀 Join Room
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="chat-container">
      <div className="chat-header">Room: {room}</div>

      <div className="chat-box">
        {chat.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.username === username ? "own" : "other"}`}
          >
            <div className="bubble">
              <span className="text">{msg.text}</span>
              <span className="meta">
                {msg.time}
                {msg.username === username && (
                  <span className="ticks">
                    {" "}
                    {msg.status === "seen" ? "✓✓" : "✓"}
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}

        {/* {typing && <div className="typing">{typing}</div>} */}
        <div className="typing">{typing}</div>
          {/* 👇 Auto scroll target */}
          <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        <input
          ref={inputRef}
          value={message}
          onChange={handleTyping}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
