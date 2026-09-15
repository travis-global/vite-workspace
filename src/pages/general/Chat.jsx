// src/pages/general/Chat.jsx

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  listChannels,
  createChannel,
  startDm,
  getMessages,
  sendMessage,
  markChannelRead,
} from '../../api/endpoints/chat';
import { connectChatSocket } from '../../api/chatSocket';
import styles from './Chat.module.css';

export default function Chat() {
  const [channels, setChannels] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newMembers, setNewMembers] = useState('');
  const [dmUserId, setDmUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeIdRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const loadChannels = useCallback(async () => {
    try {
      const { data } = await listChannels();
      setChannels(data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load channels.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const openChannel = useCallback(async (channelId) => {
    setActiveId(channelId);
    setError(null);
    try {
      const { data } = await getMessages(channelId);
      const list = data || [];
      setMessages(list);
      if (list.length > 0) {
        const lastId = list[list.length - 1].message_id;
        await markChannelRead(channelId, lastId).catch(() => {});
        await loadChannels();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load messages.');
      setMessages([]);
    }
  }, [loadChannels]);

  // Live WebSocket — whole time Chat page is mounted
  useEffect(() => {
    const disconnect = connectChatSocket((data) => {
      if (data.event !== 'new_message' || !data.message) return;

      const msg = data.message;
      const channelId = msg.channel_id;

      // If this conversation is open, append the message
      if (channelId === activeIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.message_id === msg.message_id)) return prev;
          return [...prev, msg];
        });
        markChannelRead(channelId, msg.message_id).catch(() => {});
      }

      // Refresh sidebar unread badges
      loadChannels();
    });

    return disconnect;
  }, [loadChannels]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    const content = draft.trim();
    setDraft('');
    try {
      // Server broadcasts new_message to all members (including us)
      await sendMessage(activeId, content);
      // If WS is slow, soft refresh history
      // openChannel(activeId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Send failed.');
      setDraft(content);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    const memberIds = newMembers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const { data } = await createChannel({
        name: newChannelName.trim(),
        memberIds,
      });
      setNewChannelName('');
      setNewMembers('');
      await loadChannels();
      if (data?.channel_id) openChannel(data.channel_id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Create channel failed.');
    }
  };

  const handleDm = async (e) => {
    e.preventDefault();
    try {
      const { data } = await startDm(dmUserId.trim());
      setDmUserId('');
      await loadChannels();
      if (data?.channel_id) openChannel(data.channel_id);
    } catch (err) {
      setError(err.response?.data?.detail || 'DM failed.');
    }
  };

  const active = channels.find((c) => c.channel_id === activeId);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Chat</h1>
        <p className={styles.subtitle}>
          Channels and DMs — live over WebSocket while this page is open.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <h2>Conversations</h2>
          {loading ? (
            <p className={styles.muted}>Loading…</p>
          ) : channels.length === 0 ? (
            <p className={styles.muted}>None yet.</p>
          ) : (
            <ul className={styles.channelList}>
              {channels.map((c) => (
                <li key={c.channel_id}>
                  <button
                    type="button"
                    className={
                      c.channel_id === activeId
                        ? styles.channelActive
                        : styles.channelBtn
                    }
                    onClick={() => openChannel(c.channel_id)}
                  >
                    <span>{c.name || c.channel_id}</span>
                    {c.unread_count > 0 && (
                      <span className={styles.badge}>{c.unread_count}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className={styles.sideForm} onSubmit={handleCreateChannel}>
            <input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="New channel name"
              required
            />
            <input
              value={newMembers}
              onChange={(e) => setNewMembers(e.target.value)}
              placeholder="member user_ids (comma)"
            />
            <button type="submit" className={styles.smallBtn}>
              Create channel
            </button>
          </form>

          <form className={styles.sideForm} onSubmit={handleDm}>
            <input
              value={dmUserId}
              onChange={(e) => setDmUserId(e.target.value)}
              placeholder="DM user_id"
              required
            />
            <button type="submit" className={styles.smallBtn}>
              Start DM
            </button>
          </form>
        </aside>

        <main className={styles.main}>
          {!activeId ? (
            <p className={styles.muted}>Select a conversation.</p>
          ) : (
            <>
              <div className={styles.mainHead}>
                <h2>{active?.name || activeId}</h2>
              </div>
              <div className={styles.messages}>
                {messages.map((m) => (
                  <div key={m.message_id} className={styles.msg}>
                    <div className={styles.msgMeta}>
                      <span className={styles.mono}>{m.sender_id}</span>
                      <span className={styles.time}>{m.created_at}</span>
                    </div>
                    <div className={styles.msgBody}>{m.content}</div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form className={styles.composer} onSubmit={handleSend}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Message…"
                  required
                />
                <button type="submit" className={styles.primaryBtn}>
                  Send
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
