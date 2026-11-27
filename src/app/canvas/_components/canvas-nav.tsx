import Image from "next/image";
import Link from "next/link";

export function CanvasNav() {
  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
      <Link href="/canvas" aria-label="Canvas home">
        <Image
          src="/arroweyeLogo.svg"
          alt="Arroweye"
          width={120}
          height={32}
          className="h-8 w-auto brightness-0 invert"
        />
      </Link>
      <Link
        href="/campaigns/setup"
        className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:bg-white/90"
      >
        Start Campaign
      </Link>
    </div>
  );
}
