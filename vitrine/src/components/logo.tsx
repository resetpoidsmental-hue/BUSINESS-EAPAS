import Image from "next/image";
import Link from "next/link";

export function Logo({ height = 36 }: { height?: number }) {
  const width = Math.round(height * (2000 / 670));
  return (
    <Link href="/" className="flex items-center" aria-label="Santé & Co, accueil">
      <Image
        src="/logo.webp"
        alt="Santé & Co"
        width={width}
        height={height}
        priority
        className="h-auto"
        style={{ height, width: "auto" }}
      />
    </Link>
  );
}
