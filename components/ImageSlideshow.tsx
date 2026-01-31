"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button, Card, Spin } from "antd";
import {
    RightOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
} from "@ant-design/icons";
import { AnimatePresence, motion } from "framer-motion";

// ================= CONFIG =================
const FADE_IN_DURATION = 0.6;   // Thời gian hiệu ứng mờ dần vào khi ảnh xuất hiện (giây)
const KEN_BURNS_DELAY = 3;      // Chờ trước khi hiệu ứng Ken Burns bắt đầu (giây)
const KEN_BURNS_DURATION = 6;   // Thời gian hiệu ứng Ken Burns chạy (giây)
const IDLE_TIME_AFTER_EFFECTS = 2; // Thời gian chờ sau khi hiệu ứng Ken Burns kết thúc (giây)

// Tổng thời gian cho một slide = (độ trễ Ken Burns + thời lượng Ken Burns) + thời gian chờ bổ sung
const AUTO_PLAY_DELAY = (KEN_BURNS_DELAY + KEN_BURNS_DURATION + IDLE_TIME_AFTER_EFFECTS) * 1000;

// ================= TYPES =================
interface AlbumImageDetail {
    id: number;
    title: string;
    cover: string;
}

interface ApiAlbumResponse {
    id: number;
    title: string;
    date: string;
    cover: string;
    album: AlbumImageDetail[];
}

// ================= COMPONENT =================
export default function ImageSlideshow() {
    const [images, setImages] = useState<string[]>([]);
    const [index, setIndex] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);

    const containerRef = useRef<HTMLDivElement | null>(null);

    // ================= FETCH API =================
    useEffect(() => {
        fetch("https://huudinh.io.vn/wp-json/mock/v1/albums")
            .then((res) => res.json())
            .then((data: ApiAlbumResponse[]) => {
                const allCovers: string[] = [];
                data.forEach((albumItem) => {
                    albumItem.album.forEach((imageDetail) => {
                        if (imageDetail.cover) {
                            allCovers.push(imageDetail.cover);
                        }
                    });
                });
                setImages(allCovers);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const next = () => {
        setIndex((i) => (i + 1) % images.length);
    };

    // ================= AUTOPLAY =================
    useEffect(() => {
        if (!playing || images.length === 0) return;

        if (index >= images.length) {
            setIndex(0);
        }

        const timer = setInterval(next, AUTO_PLAY_DELAY);
        return () => clearInterval(timer);
    }, [playing, images.length, index]);

    // ================= FULLSCREEN LISTENER =================
    useEffect(() => {
        const onChange = () =>
            setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", onChange);
        return () =>
            document.removeEventListener("fullscreenchange", onChange);
    }, []);

    const toggleFullscreen = () => {
        const el = containerRef.current;
        if (!el) return;
        document.fullscreenElement
            ? document.exitFullscreen()
            : el.requestFullscreen();
    };

    // ================= LOADING =================
    if (loading) {
        return (
            // Card loading cũng được chỉnh để có tỷ lệ 1:1 cho phù hợp
            <Card style={{ maxWidth: 900, border: 'none', margin: "0 auto", width: "100%", aspectRatio: "1 / 1" }}>
                <Spin fullscreen />
            </Card>
        );
    }

    if (images.length === 0) return null;

    return (
        <Card
            style={{ maxWidth: 900, border: 'none', margin: "0 auto", width: "100%" }}
            styles={{ body: { padding: 0 } }}
        >
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    // Khi không fullscreen, sử dụng aspectRatio để div là hình vuông.
                    // Khi fullscreen, height chiếm 100vh và aspectRatio bị ghi đè.
                    height: isFullscreen ? "100vh" : undefined,
                    aspectRatio: isFullscreen ? undefined : "1 / 1", // Áp dụng tỷ lệ 1:1 khi không fullscreen
                    width: "100%", // Luôn chiếm 100% chiều rộng của Card
                    overflow: "hidden",
                    background: "#000",
                    borderRadius: 8
                }}
            >
                {/* KEN BURNS IMAGE */}
                <AnimatePresence>
                    <motion.div
                        key={index}
                        initial={{ scale: 1, x: 0, y: 0, opacity: 0 }}
                        animate={{
                            scale: 1.12,
                            x: -20,
                            y: -12,
                            opacity: 1,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            opacity: { duration: FADE_IN_DURATION },
                            scale: {
                                delay: KEN_BURNS_DELAY,
                                duration: KEN_BURNS_DURATION,
                                ease: "easeOut",
                            },
                            x: {
                                delay: KEN_BURNS_DELAY,
                                duration: KEN_BURNS_DURATION,
                                ease: "easeOut",
                            },
                            y: {
                                delay: KEN_BURNS_DELAY,
                                duration: KEN_BURNS_DURATION,
                                ease: "easeOut",
                            },
                        }}
                        style={{ position: "absolute", inset: 0, borderRadius: 24 }}
                    >
                        <Image
                            src={images[index]}
                            alt={`Slide ${index + 1}`}
                            fill
                            sizes="100vw"
                            priority={index === 0}
                            unoptimized
                            style={{
                                objectFit: "contain", // Luôn hiển thị toàn bộ ảnh, giữ nguyên tỷ lệ
                            }}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* NEXT */}
                <Button
                    shape="circle"
                    icon={<RightOutlined />}
                    onClick={next}
                    style={{
                        position: "absolute",
                        bottom: 56,
                        right: 16,
                        zIndex: 10,
                    }}
                />

                {/* PLAY / PAUSE */}
                <Button
                    shape="circle"
                    icon={
                        playing ? (
                            <PauseCircleOutlined />
                        ) : (
                            <PlayCircleOutlined />
                        )
                    }
                    onClick={() => setPlaying((p) => !p)}
                    style={{
                        position: "absolute",
                        bottom: 16,
                        right: 16,
                        zIndex: 10,
                    }}
                />

                {/* FULLSCREEN */}
                <Button
                    shape="circle"
                    icon={
                        isFullscreen ? (
                            <FullscreenExitOutlined />
                        ) : (
                            <FullscreenOutlined />
                        )
                    }
                    onClick={toggleFullscreen}
                    style={{
                        position: "absolute",
                        bottom: 16,
                        left: 16,
                        zIndex: 10,
                    }}
                />
            </div>
        </Card>
    );
}