export default function Home() {
  const name = process.env.VALENTINE_NAME || "Mycala";
  return (
    <ValentineApp name={name} />
  );
}

import { ValentineApp } from "@/components/valentine/ValentineApp";
