import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { champions, findChampion, splashUrl, type Champion } from "../shared/champions";
import { ChampionPicker } from "./components/ChampionPicker";
import { Conversation, type Message } from "./components/Conversation";
import { ChatError, errorMessage, streamReply, type ChatMessage } from "./lib/chat-client";
import { textOn } from "./lib/color";
import { readJSON, writeJSON } from "./lib/storage";

const CHAMPION_KEY = "lolchat:champion";
const CONVERSATIONS_KEY = "lolchat:conversations:v2";
const SAVED_MESSAGES = 60;
// Stay well inside the server's limits on message count and size.
const SENT_MESSAGES = 30;
const SENT_CHARS = 20_000;
const MESSAGE_CHARS = 2_000;

type Conversations = Record<string, Message[]>;

let counter = 0;
const newId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

const greetingFor = (champion: Champion): Message => ({
  id: `greeting-${champion.id}`,
  role: "assistant",
  content: champion.greeting,
});

/** The most recent part of the conversation that fits the request limits. */
function recentHistory(messages: Message[]): ChatMessage[] {
  const picked: ChatMessage[] = [];
  let total = 0;
  for (let i = messages.length - 1; i >= 0 && picked.length < SENT_MESSAGES; i--) {
    const content = messages[i].content.trim().slice(0, MESSAGE_CHARS);
    if (!content) continue;
    if (total + content.length > SENT_CHARS) break;
    total += content.length;
    picked.unshift({ role: messages[i].role, content });
  }
  return picked;
}

function savedConversations(conversations: Conversations): Conversations {
  const saved: Conversations = {};
  for (const [id, messages] of Object.entries(conversations)) {
    if (findChampion(id)) saved[id] = messages.filter((m) => m.content.trim()).slice(-SAVED_MESSAGES);
  }
  return saved;
}

export function App() {
  const [championId, setChampionId] = useState(() => {
    const saved = readJSON<string>(CHAMPION_KEY, champions[0].id);
    return findChampion(saved) ? saved : champions[0].id;
  });
  const [conversations, setConversations] = useState<Conversations>(() => savedConversations(readJSON(CONVERSATIONS_KEY, {})));
  const [streaming, setStreaming] = useState<{ championId: string; messageId: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const controllerRef = useRef<AbortController | null>(null);

  const champion = findChampion(championId) ?? champions[0];
  const messages = conversations[champion.id] ?? [greetingFor(champion)];

  useEffect(() => writeJSON(CHAMPION_KEY, championId), [championId]);
  useEffect(() => {
    if (!streaming) writeJSON(CONVERSATIONS_KEY, savedConversations(conversations));
  }, [conversations, streaming]);
  useEffect(() => {
    document.title = `${champion.name} · LolChat`;
  }, [champion]);

  const ask = useCallback(async (target: Champion, history: Message[]) => {
    const controller = new AbortController();
    controllerRef.current = controller;
    const replyId = newId();
    setErrors((current) => ({ ...current, [target.id]: "" }));
    setConversations((current) => ({ ...current, [target.id]: [...history, { id: replyId, role: "assistant", content: "" }] }));
    setStreaming({ championId: target.id, messageId: replyId });

    const append = (text: string) =>
      setConversations((current) => ({
        ...current,
        [target.id]: (current[target.id] ?? []).map((m) => (m.id === replyId ? { ...m, content: m.content + text } : m)),
      }));

    try {
      await streamReply(target.id, recentHistory(history), append, controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) {
        const code = error instanceof ChatError ? error.code : "upstream_error";
        setErrors((current) => ({ ...current, [target.id]: errorMessage(code, target.name) }));
      }
      // Keep whatever arrived before a stop or an error; drop an empty reply.
      setConversations((current) => ({
        ...current,
        [target.id]: (current[target.id] ?? []).filter((m) => m.id !== replyId || m.content.trim()),
      }));
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      setStreaming((current) => (current?.messageId === replyId ? null : current));
    }
  }, []);

  const stop = () => controllerRef.current?.abort();

  const send = (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;
    void ask(champion, [...messages, { id: newId(), role: "user", content }]);
  };

  const retry = () => {
    if (!streaming && messages[messages.length - 1]?.role === "user") void ask(champion, messages);
  };

  const reset = () => {
    stop();
    setConversations((current) => {
      const next = { ...current };
      delete next[champion.id];
      return next;
    });
    setErrors((current) => ({ ...current, [champion.id]: "" }));
  };

  const select = (id: string) => {
    if (id === championId) return;
    stop();
    setChampionId(id);
  };

  const theme = { "--accent": champion.accent, "--on-accent": textOn(champion.accent) } as CSSProperties;

  return (
    <div className="app" style={theme}>
      <div className="backdrop" aria-hidden="true">
        <img key={champion.id} className="backdrop__image" src={splashUrl(champion.id)} alt="" />
      </div>

      <aside className="sidebar">
        <div className="brand">
          <svg className="brand__mark" viewBox="0 0 64 64" aria-hidden="true">
            <path d="M16 15h32a7 7 0 0 1 7 7v15a7 7 0 0 1-7 7H31l-11 9v-9h-4a7 7 0 0 1-7-7V22a7 7 0 0 1 7-7z" />
          </svg>
          <div>
            <h1 className="brand__name">LolChat</h1>
            <p className="brand__tagline">Talk with the champions of Runeterra</p>
          </div>
        </div>
        <ChampionPicker champions={champions} selectedId={champion.id} onSelect={select} />
      </aside>

      <main className="main">
        <Conversation
          key={champion.id}
          champion={champion}
          messages={messages}
          streamingId={streaming?.championId === champion.id ? streaming.messageId : null}
          error={errors[champion.id] ?? ""}
          onSend={send}
          onStop={stop}
          onRetry={retry}
          onReset={reset}
        />
      </main>

      <footer className="legal">
        LolChat isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially
        involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks
        or registered trademarks of Riot Games, Inc.
      </footer>
    </div>
  );
}
