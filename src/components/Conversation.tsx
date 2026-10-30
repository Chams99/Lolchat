import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { portraitUrl, type Champion } from "../../shared/champions";
import { MessageText } from "./MessageText";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ConversationProps {
  champion: Champion;
  messages: Message[];
  streamingId: string | null;
  error: string;
  onSend: (text: string) => void;
  onStop: () => void;
  onRetry: () => void;
  onReset: () => void;
}

const MAX_INPUT = 1000;

export function Conversation({ champion, messages, streamingId, error, onSend, onStop, onRetry, onReset }: ConversationProps) {
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);
  const isStreaming = streamingId !== null;
  const lastMessage = messages[messages.length - 1];
  const showSuggestions = messages.length === 1 && !isStreaming && !error;

  // Follow new text while the reader is at the bottom; leave them alone if they scrolled up.
  useLayoutEffect(() => {
    const log = logRef.current;
    if (log && stickToBottom.current) log.scrollTop = log.scrollHeight;
  }, [messages, error, showSuggestions]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }, [draft]);

  const submit = (text: string) => {
    if (!text.trim() || isStreaming) return;
    stickToBottom.current = true;
    onSend(text);
    setDraft("");
    inputRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(draft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit(draft);
    }
  };

  return (
    <section className="conversation" aria-labelledby="champion-name">
      <header className="conversation__header">
        <img className="conversation__portrait" src={portraitUrl(champion.id)} alt="" width={64} height={64} />
        <div className="conversation__heading">
          <h2 id="champion-name" className="conversation__name">
            {champion.name}
          </h2>
          <p className="conversation__title">{champion.title}</p>
        </div>
        <button
          type="button"
          className="button button--ghost conversation__reset"
          onClick={onReset}
          disabled={messages.length <= 1 && !isStreaming && !error}
        >
          New conversation
        </button>
      </header>

      <div
        ref={logRef}
        className="messages"
        role="log"
        aria-label={`Conversation with ${champion.name}`}
        aria-live="polite"
        aria-busy={isStreaming}
        tabIndex={0}
        onScroll={(event) => {
          const el = event.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        <ol className="messages__list">
          {messages.map((message) => (
            <li key={message.id} className={`message message--${message.role}`}>
              {message.role === "assistant" && (
                <img className="message__avatar" src={portraitUrl(champion.id)} alt="" width={36} height={36} />
              )}
              <div className="message__bubble">
                <span className="visually-hidden">{message.role === "assistant" ? `${champion.name}: ` : "You: "}</span>
                {message.content ? (
                  <MessageText text={message.content} />
                ) : (
                  <span className="typing" aria-label={`${champion.name} is typing`}>
                    <span />
                    <span />
                    <span />
                  </span>
                )}
                {message.id === streamingId && message.content && <span className="caret" aria-hidden="true" />}
              </div>
            </li>
          ))}
        </ol>

        {showSuggestions && (
          <div className="suggestions">
            <p className="suggestions__label">Try asking</p>
            <ul className="suggestions__list">
              {champion.suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button type="button" className="chip" onClick={() => submit(suggestion)}>
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="notice" role="alert">
            <p>{error}</p>
            {lastMessage?.role === "user" && (
              <button type="button" className="button button--small" onClick={onRetry}>
                Try again
              </button>
            )}
          </div>
        )}
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <label htmlFor="message-input" className="visually-hidden">
          Message {champion.name}
        </label>
        <textarea
          id="message-input"
          ref={inputRef}
          className="composer__input"
          rows={1}
          maxLength={MAX_INPUT}
          placeholder={`Message ${champion.name}…`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        {isStreaming ? (
          <button type="button" className="button button--stop" onClick={onStop}>
            Stop
          </button>
        ) : (
          <button type="submit" className="button button--send" disabled={!draft.trim()}>
            Send
          </button>
        )}
      </form>
      <p className="composer__note">Replies come from a language model playing the champion, so they may not match official lore.</p>
    </section>
  );
}
