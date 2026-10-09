
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  MessageCircle,
  SendHorizontal,
  CheckCheck,
} from "lucide-react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import EmptyState from "../UI/EmptyState";
import { initials } from "../../Utils/helpers";
import axios from "axios";

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const ChatBox = ({ contact, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  const { id } = useParams();
  const loggedInUser = useSelector((store) => store.user);
  const myId = loggedInUser?._id;

  // Load existing conversation history
  useEffect(() => {
    if (!id || !myId) return;

    let cancelled = false;

    axios
      .get(
        `${import.meta.env.VITE_BACKEND_URL}/api/chats/${id}`,
        {
          withCredentials: true,
        }
      )
      .then((res) => {
        if (cancelled) return;

        const history = (res.data.data || []).map((message) => ({
          ...message,
          id: message._id || makeId(),
          createdAt: message.createdAt || null,
        }));

        setMessages(history);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Unable to load chat history:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, myId]);

  // Connect socket and join the conversation room
  useEffect(() => {
    if (!myId || !id) return;

    const socket = io(import.meta.env.VITE_BACKEND_URL);

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", {
        sender: myId,
        receiver: id,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [myId, id]);

  // Listen for incoming messages
  useEffect(() => {
    const socket = socketRef.current;

    if (!socket) return;

    const handleIncoming = (data) => {
      if (String(data.sender) !== String(id)) return;

      if (
        data.receiver &&
        String(data.receiver) !== String(myId)
      ) {
        return;
      }

      setMessages((prev) => {
        if (
          data._id &&
          prev.some((message) => message._id === data._id)
        ) {
          return prev;
        }

        return [
          ...prev,
          {
            _id: data._id,
            id: data._id || makeId(),
            text: data.text ?? data.msg ?? "",
            sender: data.sender,
            receiver: data.receiver,
            createdAt: data.createdAt || null,
          },
        ];
      });
    };

    socket.on("rec-msg", handleIncoming);

    return () => {
      socket.off("rec-msg", handleIncoming);
    };
  }, [id, myId]);

  // Scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length]);

  // Send a message
  const handleSubmit = (e) => {
    e.preventDefault();

    const value = text.trim();
    const socket = socketRef.current;

    if (!value || !socket || !myId) return;

    const createdAt = new Date().toISOString();

    socket.emit("send-msg", {
      msg: value,
      sender: myId,
      receiver: id,
      createdAt,
    });

    // Show the message immediately
    setMessages((prev) => [
      ...prev,
      {
        id: makeId(),
        text: value,
        sender: myId,
        receiver: id,
        createdAt,
      },
    ]);

    setText("");
  };

  return (
    <div className="flex h-[calc(100vh-73px-3rem)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-73px-4rem)]">

      {/* Header */}

      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3.5">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={19} />
        </button>

        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-sm font-semibold text-white">
          {initials(contact?.name ?? "")}

          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {contact?.name}
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-500">
            <span className="capitalize">{contact?.role}</span>
            {contact?.email && ` · ${contact.email}`}
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 sm:flex">
          <MessageCircle size={15} className="text-teal-700" />

          <span className="text-xs font-medium text-teal-800">
            TeamFlow Chat
          </span>
        </div>
      </header>

      {/* Messages */}

      <main
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(20,184,166,0.07), transparent 42%), #f8fafc",
        }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={MessageCircle}
              title="Start a conversation"
              description={`Send your first message to ${
                contact?.name ?? "your teammate"
              }.`}
            />
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4">
            {messages.map((message) => {
              const isMine =
                String(message.sender) === String(myId);

              return (
                <div
                  key={message.id || message._id}
                  className={`flex ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${
                      isMine
                        ? "rounded-br-md bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-sm shadow-teal-900/10"
                        : "rounded-bl-md border border-slate-200/80 bg-white text-slate-800 shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                      {message.text}
                    </p>

                    <div className="mt-1.5 flex items-center justify-end gap-1.5">
                      <span
                        className={`text-[10px] ${
                          isMine
                            ? "text-teal-100"
                            : "text-slate-400"
                        }`}
                      >
                        {formatTime(message.createdAt)}
                      </span>

                      {isMine && (
                        <CheckCheck
                          size={14}
                          className="text-teal-100"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* Message Composer */}

      <footer className="border-t border-slate-200 bg-white px-3 py-3 sm:px-5 sm:py-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-4xl items-center gap-3"
        >
          <div className="flex h-12 min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-teal-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Message ${
                contact?.name ?? "your teammate"
              }...`}
              autoComplete="off"
              maxLength={1000}
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={!text.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm transition hover:bg-teal-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label="Send message"
          >
            <SendHorizontal size={19} />
          </button>
        </form>

        <p className="mx-auto mt-2 hidden max-w-4xl px-1 text-[11px] text-slate-400 sm:block">
          Keep your team communication clear and productive.
        </p>
      </footer>
    </div>
  );
};

export default ChatBox;


























