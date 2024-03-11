import { CiBookmark } from "react-icons/ci";
import { FaPause, FaPlay, FaStepBackward, FaStepForward } from "react-icons/fa";
import { FaArrowRotateLeft, FaArrowRotateRight } from "react-icons/fa6";

export default function HomePage() {
  return (
    <main className="flex items-center justify-center bg-slate-200 p-2">
      <div className="mx-4 flex w-full flex-col rounded rounded-b-lg bg-slate-900 text-black">
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-stone-300">
            FSR
          </div>
          <div>
            <p className="text-sm font-semibold text-sky-300">Ep. 128</p>
            <p className="text-sm font-bold text-stone-400">
              Scaling CSS at Heroku with Utility Classes
            </p>
            <p className="font-extrabold text-stone-200">Full Stack Radio</p>
          </div>
        </div>
        <div className="mx-4 mb-6 flex flex-col gap-2">
          <div className="relative h-2 rounded-xl bg-slate-300/30">
            <div className="relative z-10 h-2 w-[50%] rounded-xl bg-sky-300">
              <div className="absolute -right-1 -top-1 z-10 h-4 w-4 rounded-full border-4 border-white bg-sky-300"></div>
            </div>
          </div>

          <div className="flex justify-between">
            <p className="text-sm text-white">24:15</p>
            <p className="text-sm text-white/40">75:50</p>
          </div>
        </div>
        <div className="flex items-center justify-evenly rounded-b-lg bg-slate-300 p-4 text-slate-500">
          <CiBookmark />
          <FaStepBackward />
          <FaArrowRotateLeft />
          <div className="w-20"></div>
          <div className="absolute flex h-20 w-20 flex-none items-center justify-center rounded-full border border-slate-300 bg-white text-xl">
            <FaPause />
            {/* <FaPlay /> */}
          </div>
          <FaArrowRotateRight />
          <FaStepForward />
          <div className="flex items-center justify-center rounded-lg border-2 border-slate-500 px-1 text-xs">
            1x
          </div>
        </div>
      </div>
    </main>
  );
}
