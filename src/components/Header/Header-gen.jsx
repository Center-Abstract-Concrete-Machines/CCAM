import * as React from "react";

export default function GenHeader(props) {
  return (
    <div className="justify-between items-center bg-stone-50 flex gap-5 p-4 border-b-black border-b border-solid max-md:flex-wrap">
      <img
        loading="lazy"
        src=""
        className="aspect-[3.61] object-contain object-center w-[202px] fill-black stroke-[1px] stroke-black overflow-hidden shrink-0 max-w-full my-auto"
      />
      <div className="items-stretch self-stretch flex justify-between gap-4 max-md:max-w-full max-md:flex-wrap">
        <div className="justify-center items-stretch flex grow basis-[0%] flex-col">
          <div className="justify-between items-stretch flex w-full gap-5 pb-1.5">
            <div className="text-black text-lg grow whitespace-nowrap">
              Programs
            </div>
            <div className="justify-between items-stretch flex gap-5">
              <div className="text-black text-lg whitespace-nowrap">[</div>
              <div className="text-black text-lg whitespace-nowrap">]</div>
            </div>
          </div>
          <div className="justify-between items-stretch flex w-full gap-5 py-1.5">
            <div className="text-black text-lg grow whitespace-nowrap">
              Projects
            </div>
            <div className="justify-between items-stretch flex gap-5">
              <div className="text-black text-lg whitespace-nowrap">[</div>
              <div className="text-black text-lg whitespace-nowrap">]</div>
            </div>
          </div>
          <div className="justify-between items-stretch flex w-full gap-5 pt-1.5">
            <div className="text-black text-lg grow whitespace-nowrap">
              Resources
            </div>
            <div className="justify-between items-stretch flex gap-5">
              <div className="text-black text-lg whitespace-nowrap">[</div>
              <div className="text-black text-lg whitespace-nowrap">]</div>
            </div>
          </div>
        </div>
        <div className="justify-center items-stretch flex grow basis-[0%] flex-col">
          <div className="justify-between items-stretch flex w-full gap-5 pb-1.5">
            <div className="text-black text-lg grow whitespace-nowrap">
              About
            </div>
            <div className="justify-between items-stretch flex gap-5">
              <div className="text-black text-lg whitespace-nowrap">[</div>
              <div className="text-black text-lg whitespace-nowrap">]</div>
            </div>
          </div>
          <div className="justify-between items-stretch flex w-full gap-5 py-1.5">
            <div className="text-black text-lg grow whitespace-nowrap">
              Contact
            </div>
            <div className="justify-between items-stretch flex gap-5">
              <div className="text-black text-lg whitespace-nowrap">[</div>
              <div className="text-black text-lg whitespace-nowrap">]</div>
            </div>
          </div>
          <div className="justify-between items-stretch flex w-full gap-5 pt-1.5">
            <div className="text-black text-lg grow whitespace-nowrap">
              Follow
            </div>
            <div className="justify-between items-stretch flex gap-5">
              <div className="text-black text-lg whitespace-nowrap">[</div>
              <div className="text-black text-lg whitespace-nowrap">]</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


