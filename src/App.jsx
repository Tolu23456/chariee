import React, { useState, useEffect, useRef } from 'react'
import "./index.css"
import Navbar from './components/Navbar'
import { BeatLoader } from "react-spinners";
import Markdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { RiComputerFill } from "react-icons/ri";
import { GiOpenBook, GiWhiteBook } from 'react-icons/gi';
import { FaBloggerB } from 'react-icons/fa';
import { IoCopyOutline, IoCheckmarkOutline } from 'react-icons/io5';

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden my-3 border border-zinc-700 text-sm">
      <div className="flex items-center justify-between bg-zinc-800 px-4 py-2">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-xs"
        >
          {copied ? <IoCheckmarkOutline className="text-green-400" /> : <IoCopyOutline />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: 0, background: "#1a1a2e", fontSize: "0.85rem" }}
        showLineNumbers
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

const markdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";
    const code = String(children).replace(/\n$/, "");

    if (!inline && (match || code.includes("\n"))) {
      return <CodeBlock language={language}>{code}</CodeBlock>;
    }
    return (
      <code className="bg-zinc-800 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    );
  },
};

const App = () => {
  const [screen, setScreen] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const messagesEndRef = useRef(null);

  // AUTO SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [data, loading]);

  // GET AI RESPONSE
  async function getResponse(currentPrompt) {
    const textToSend = currentPrompt || prompt;

    if (!textToSend.trim()) {
      alert("Please enter a prompt!");
      return;
    }

    if (loading) return;

    setData(prevData => [
      ...prevData,
      {
        role: "user",
        content: textToSend
      }
    ]);

    setScreen(2);
    setPrompt("");
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

      if (!apiKey) {
        throw new Error("API Key is missing. Please set VITE_OPENROUTER_API_KEY in your environment.");
      }

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b:free",
          messages: [
            {
              role: "system",
              content: "You are Chariee, a helpful and friendly AI assistant. Always refer to yourself as Chariee, never as ChatGPT or any other AI name."
            },
            { role: "user", content: textToSend }
          ],
          stream: true,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Request failed with status ${res.status}`);
      }

      setData(prevData => [...prevData, { role: "ai", content: "" }]);
      setLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (delta) {
              accumulated += delta;
              setData(prevData => {
                const updated = [...prevData];
                updated[updated.length - 1] = { role: "ai", content: accumulated };
                return updated;
              });
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

    } catch (error) {
      console.error("API Error:", error);
      let errorMessage = "Something went wrong.";

      if (error.message?.toLowerCase().includes("api key") || error.message?.includes("missing")) {
        errorMessage = "Invalid or missing API key. Check your VITE_OPENROUTER_API_KEY secret.";
      } else if (error.message?.toLowerCase().includes("rate limit") || error.message?.includes("429")) {
        errorMessage = "Rate limit reached. Please wait a moment and try again.";
      } else if (error.message?.toLowerCase().includes("fetch") || error.message?.toLowerCase().includes("network")) {
        errorMessage = "Network error. Check your internet connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setData(prevData => [...prevData, { role: "ai", content: errorMessage }]);

    } finally {
      setLoading(false);
    }
  }

  const handleCardClick = (suggestionText) => {
    getResponse(suggestionText);
  };

  const handleNewChat = () => {
    setData([]);
    setPrompt("");
    setScreen(1);
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-black text-white">
      <Navbar onNewChat={handleNewChat} />

      {/* MAIN CHAT */}
      <div className="flex-1 overflow-y-auto no-scrollbar w-full max-w-4xl mx-auto px-4 md:px-6">
        {
          screen === 1 ? (
            <div className="w-full min-h-full flex items-center justify-center flex-col py-6 md:py-10">
              <h3 className='text-4xl md:text-5xl font-bold tracking-tight mb-6 md:mb-8 text-center'>
                Chariee.<span className='text-blue-500'>ai</span>
              </h3>

              {/* SUGGESTIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full max-w-2xl px-2 sm:px-4">
                <div
                  onClick={() => handleCardClick("Create a website using html css and js.")}
                  className="card cursor-pointer bg-zinc-950 border border-zinc-900 transition-all hover:bg-zinc-900 rounded-xl p-4 md:p-5"
                >
                  <i className='text-2xl md:text-3xl text-blue-500'><RiComputerFill /></i>
                  <p className='mt-2 md:mt-3 text-sm md:text-base text-zinc-300 font-medium'>Create a website using html css and js.</p>
                </div>

                <div
                  onClick={() => handleCardClick("Write a book for me. topic is coding.")}
                  className="card cursor-pointer bg-zinc-950 border border-zinc-900 transition-all hover:bg-zinc-900 rounded-xl p-4 md:p-5"
                >
                  <i className='text-2xl md:text-3xl text-purple-500'><GiWhiteBook /></i>
                  <p className='mt-2 md:mt-3 text-sm md:text-base text-zinc-300 font-medium'>Write a book for me. topic is coding.</p>
                </div>

                <div
                  onClick={() => handleCardClick("Tell me a comedy story.")}
                  className="card cursor-pointer bg-zinc-950 border border-zinc-900 transition-all hover:bg-zinc-900 rounded-xl p-4 md:p-5"
                >
                  <i className='text-2xl md:text-3xl text-amber-500'><GiOpenBook /></i>
                  <p className='mt-2 md:mt-3 text-sm md:text-base text-zinc-300 font-medium'>Tell me a comedy story.</p>
                </div>

                <div
                  onClick={() => handleCardClick("Create a blog for me topic is web dev.")}
                  className="card cursor-pointer bg-zinc-950 border border-zinc-900 transition-all hover:bg-zinc-900 rounded-xl p-4 md:p-5"
                >
                  <i className='text-2xl md:text-3xl text-emerald-500'><FaBloggerB /></i>
                  <p className='mt-2 md:mt-3 text-sm md:text-base text-zinc-300 font-medium'>Create a blog for me topic is web dev.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col py-4 md:py-6">
              {data.map((item, index) => {
                const isUser = item.role === "user";
                return isUser ? (
                  <div key={index} className="flex justify-end px-2 py-2">
                    <div className="max-w-[75%] md:max-w-[60%] bg-zinc-700 text-white text-sm md:text-base leading-relaxed rounded-3xl px-5 py-3">
                      {item.content}
                    </div>
                  </div>
                ) : (
                  <div key={index} className="flex items-start gap-3 px-2 py-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mt-0.5">
                      C
                    </div>
                    <div className="flex-1 min-w-0 text-zinc-100 text-sm md:text-base leading-relaxed">
                      <p className="text-xs font-semibold text-zinc-400 mb-1">Chariee</p>
                      <div className="prose prose-invert max-w-none text-sm md:text-base">
                        <Markdown components={markdownComponents}>{item.content}</Markdown>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* LOADER */}
              {loading && (
                <div className="flex items-start gap-3 px-2 py-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    C
                  </div>
                  <div className="flex items-center h-8">
                    <BeatLoader size={7} color='#a1a1aa' />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )
        }
      </div>

      {/* INPUT AREA */}
      <div className="pb-4 md:pb-6 px-3 md:px-4 w-full bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 md:p-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <input
              type="text"
              value={prompt}
              placeholder='Enter your prompt...'
              className='flex-1 bg-transparent py-2 md:py-3 px-2 outline-none text-base md:text-lg text-white placeholder:text-zinc-500 min-w-0'
              onChange={(e) => { setPrompt(e.target.value) }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  getResponse();
                }
              }}
            />

            {/* SEND BUTTON */}
            <button
              onClick={() => getResponse()}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all px-4 py-2 md:px-5 md:py-3 rounded-xl font-medium text-sm md:text-base disabled:opacity-50 flex-shrink-0"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>

          <p className='text-zinc-600 text-[10px] md:text-xs text-center mt-2'>
            Chariee.ai can make mistakes! Double-check critical computations.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App