"use client";

import styles from "./page.module.css";
import dynamic from "next/dynamic";

const Slideshow = dynamic(
  () => import("@/components/ImageSlideshow"),
  { ssr: false }
);

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Slideshow />
      </main>
    </div>
  );
}
