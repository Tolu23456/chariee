import React, { useState, useEffect, useRef } from 'react'
import "./index.css"
import Navbar from './components/Navbar'
import { GoogleGenAI } from "@google/genai";
import { BeatLoader } from "react-spinners";
import Markdown from 'react-markdown'
import { RiComputerFill } from "react-icons/ri";
import { GiOpenBook, GiWhiteBook } from 'react-icons/gi';
import { FaBloggerB } from 'react-icons/fa';

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
      // Dynamic runtime configuration to evade build compilation locks
      const targetApiKey = import.meta.env.VITE_GEMINI_API_KEY || 
        (typeof process !== 'undefined' ? process.env.VITE_GEMINI_API_KEY : undefined);

      if (!targetApiKey) {
        throw new Error("API Key is missing. Check your Vercel Environment Variables setup.");
      }

      const ai = new GoogleGenAI({ apiKey: targetApiKey });

      // FIX: Clean production-stable model mapping matching modern SDK standards
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: textToSend,
      });

      const text =
        response?.text ||
        response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response generated.";

      setData(prevData => [
        ...prevData,
        {
          role: "ai",
          content: text
        }
      ]);

    } catch (error) {
      console.error("Gemini Error:", error);
      let errorMessage = "Something went wrong.";

      // Detailed accurate state reporting prevents fake 429 loops
      if (error.status === 429 || error.message?.includes("429")) {
        errorMessage = "Gemini API limit reached. Please wait a minute and try again.";
      }
      else if (error.message?.toLowerCase().includes("api key") || error.message?.includes("missing")) {
        errorMessage = "Invalid or missing Gemini API key configuration on Vercel.";
      }
      else if (error.message?.toLowerCase().includes("fetch") || error.message?.toLowerCase().includes("network")) {
        errorMessage = "Network error. Check your internet connection.";
      }
      else if (error.message) {
        errorMessage = error.message; // Yield exact system failure descriptions directly
      }

      setData(prevData => [
        ...prevData,
        {
          role: "ai",
          content: errorMessage
        }
      ]);

    } finally {
      setLoading(false);
    }
  }

  const handleCardClick = (suggestionText) => {
    getResponse(suggestionText);
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-black text-white">
      <Navbar />

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
            <div className="w-full flex flex-col gap-4 md:gap-5 py-4 md:py-8">
              {
                data.map((item, index) => {
                  const isUser = item.role === "user";
                  return (
                    <div
                      key={index}
                      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 md:px-5 md:py-4 text-sm md:text-base leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-none'
                        }`}
                      >
                        <p className='text-[10px] md:text-[11px] uppercase tracking-wider font-bold mb-1 opacity-60'>
                          {isUser ? "User" : "Chariee.ai"}
                        </p>
                        <div className="prose prose-invert max-w-none text-sm md:text-base">
                          <Markdown>{item.content}</Markdown>
                        </div>
                      </div>
                    </div>
                  )
                })
              }

              {/* LOADER */}
              {
                loading && (
                  <div className="flex justify-start pl-2">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 md:px-5 md:py-4 rounded-bl-none">
                      <BeatLoader size={8} color='#3b82f6' />
                    </div>
                  </div>
                )
              }
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