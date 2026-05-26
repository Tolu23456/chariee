import React from 'react'
import { FaRobot, FaRegUserCircle } from "react-icons/fa";
import { HiPencilSquare } from "react-icons/hi2";

const Navbar = ({ onNewChat }) => {
  return (
    <nav className="w-full">
      <div className="flex items-center justify-between h-[70px] px-6 md:px-[150px]">

        {/* Logo */}
        <div className="logo gap-1.5 flex items-center text-3xl text-white">
          <FaRobot />
          <div className='text-xl font-semibold tracking-wide'>Chariee.<span className="text-blue-500">ai</span></div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNewChat}
            title="New Chat"
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-lg transition-all"
          >
            <HiPencilSquare className="text-base" />
            <span>New Chat</span>
          </button>
          <div className="text-3xl cursor-pointer text-white">
            <FaRegUserCircle />
          </div>
        </div>

      </div>
    </nav>
  )
}

export default Navbar