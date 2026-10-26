"use client";

import Image from "next/image";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const menuItems = [
  {
    name: "Studio",
    img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701294/qkpawzztfn7c6osevfmm_sripez.svg",
    url: "https://studio.arroweye.pro/",
  },
  {
    name: "Spots",
    img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701294/21_elj38n_jljfio.svg",
    url: "https://spots.arroweye.pro/",
  },
  {
    name: "Showtime",
    img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701304/sds_nzwm72_m4pzcw.svg",
    url: "https://studio.arroweye.pro/",
  },
  {
    name: "Drops",
    img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701297/qkpawzztfn7c6osevfmm_1_14_dnwz5r_cduoei.svg",
    url: "https://studio.arroweye.pro/",
  },
  {
    name: "Spins",
    img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701301/qkpawzztfn7c6osevfmm_1_4_x8h1iz_i2uebl.svg",
    url: "https://spins.arroweye.pro/",
  },
  {
    name: "Tools",
    img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701302/sds_3_tsxk8m_ftgc0v.svg",
    url: "https://cocoa.house/tools",
  },
];

/** Arroweye app switcher; render inside a DropdownMenuContent. */
export function ToolsMenuItems() {
  return (
    <>
      <div className="mb-6 grid grid-cols-3 gap-x-4 gap-y-6">
        {menuItems.map((item) => (
          <DropdownMenuItem key={item.name} asChild>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex cursor-pointer flex-col items-center rounded-[10px] text-center outline-none focus:bg-transparent"
            >
              <div className="flex size-14 items-center justify-center rounded-[12px] bg-neutral-50 transition-colors duration-150 group-hover:bg-neutral-100 dark:bg-zinc-900 dark:group-hover:bg-zinc-800">
                <Image
                  src={item.img}
                  alt={item.name}
                  width={40}
                  height={40}
                  className="size-10 object-contain"
                />
              </div>
              <span className="mt-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                {item.name}
              </span>
            </a>
          </DropdownMenuItem>
        ))}
      </div>

      <div className="flex items-center rounded-[12px] border border-neutral-100 bg-[#fafafa] p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Image
          src="https://res.cloudinary.com/dyueswnzk/image/upload/v1758701617/r3o4deralgc2jl1y1xag_ynrxbj.webp"
          alt="Ad Cover"
          width={64}
          height={96}
          className="mr-4 h-24 w-16 shrink-0 rounded-[8px] object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-bold tracking-wider text-neutral-400 uppercase">
            ADS BY <span className="underline">VIVO</span>
          </div>
          <div className="mt-1 mb-3 text-xs leading-snug font-medium text-neutral-700 dark:text-neutral-300">
            Stay in tune with the continent that makes the world dance
          </div>
          <div className="flex gap-2">
            <DropdownMenuItem asChild>
              <button
                className="cursor-pointer rounded-[6px] bg-black px-3 py-1 text-[11px] font-bold text-white outline-none transition-[background-color,transform] duration-150 hover:bg-neutral-800 active:scale-[0.97]"
                onClick={() => {
                  window.open("https://butta.cocoa.house/", "_blank");
                }}
              >
                Subscribe
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <button
                className="cursor-pointer rounded-[6px] border border-neutral-300 px-3 py-1 text-[11px] font-bold text-neutral-800 outline-none transition-[background-color,transform] duration-150 hover:bg-neutral-50 active:scale-[0.97] dark:text-neutral-200 dark:hover:bg-zinc-800"
                onClick={() => {
                  window.open(
                    "https://open.spotify.com/playlist/3CVugIVKRAsTMQn0JeaP65?si=q_g3HBORS7GFNUdIC1BMDA&pi=qbbp4pmmSOCgF&nd=1&dlsi=d383ce1fced64d36",
                    "_blank",
                  );
                }}
              >
                Listen
              </button>
            </DropdownMenuItem>
          </div>
        </div>
      </div>
    </>
  );
}
