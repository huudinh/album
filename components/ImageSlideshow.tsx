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
const KEN_BURNS_DELAY = 1.5;    // Chờ trước khi hiệu ứng Ken Burns bắt đầu (giây) - Điều chỉnh để hiệu ứng bắt đầu sớm hơn
const KEN_BURNS_DURATION = 7;   // Thời gian hiệu ứng Ken Burns chạy (giây) - Tăng thời gian để hiệu ứng mượt mà hơn
const IDLE_TIME_AFTER_EFFECTS = 1; // Thời gian chờ sau khi hiệu ứng Ken Burns kết thúc (giây)

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

// ================= HELPER FUNCTION FOR KEN BURNS ANIMATION =================
const generateKenBurnsAnimation = () => {
    // Phạm vi scale tối thiểu/tối đa
    // Đã tăng minScale để đảm bảo ảnh luôn lớn hơn khung nhìn, tránh lộ viền đen
    const minScale = 1.1; // Bắt đầu ít nhất từ 1.1 (zoom 10%)
    const maxScale = 1.4; // Tăng nhẹ maxScale để có thêm không gian pan/zoom

    // Chọn ngẫu nhiên kiểu hiệu ứng: zoom-in hoặc zoom-out
    const isZoomIn = Math.random() > 0.5;

    let startScale, endScale;
    if (isZoomIn) {
        startScale = minScale + Math.random() * (0.15); // Bắt đầu từ minScale hoặc hơn một chút
        endScale = maxScale - Math.random() * (0.15); // Kết thúc ở maxScale hoặc thấp hơn một chút
    } else {
        startScale = maxScale - Math.random() * (0.15);
        endScale = minScale + Math.random() * (0.15);
    }

    // Đảm bảo có sự khác biệt rõ ràng về scale và nằm trong giới hạn min/max
    startScale = Math.max(minScale, Math.min(maxScale, startScale));
    endScale = Math.max(minScale, Math.min(maxScale, endScale));

    // Nếu sự khác biệt scale quá nhỏ, điều chỉnh để có chuyển động rõ rệt
    if (Math.abs(startScale - endScale) < 0.08) { // Giảm ngưỡng để buộc chuyển động sớm hơn
        if (startScale < (minScale + maxScale) / 2) {
            endScale = Math.min(maxScale, startScale + 0.12 + Math.random() * 0.05); // Tăng zoom
        } else {
            endScale = Math.max(minScale, startScale - 0.12 - Math.random() * 0.05); // Giảm zoom
        }
    }


    // Hàm để tính giới hạn pan dựa trên scale hiện tại
    // Giá trị pan trong framer-motion là phần trăm của kích thước *gốc* của element.
    // Nếu ảnh được scale S lần, nó có (S-1) * 100% "phần thừa".
    // Phần thừa này có thể dịch chuyển 50% sang mỗi bên.
    const calculateMaxPanPercentage = (scale: number) => {
        return (scale - 1) * 50;
    };

    let startX, startY, endX, endY;

    // Tính toán giới hạn pan cho điểm bắt đầu và kết thúc dựa trên scale tương ứng
    const maxStartPan = calculateMaxPanPercentage(startScale);
    const maxEndPan = calculateMaxPanPercentage(endScale);

    // Vị trí pan ngẫu nhiên khởi tạo
    startX = (Math.random() * 2 - 1) * maxStartPan; // Từ -maxStartPan đến +maxStartPan
    startY = (Math.random() * 2 - 1) * maxStartPan;

    // Vị trí pan ngẫu nhiên kết thúc
    endX = (Math.random() * 2 - 1) * maxEndPan;
    endY = (Math.random() * 2 - 1) * maxEndPan;

    // Để tránh animation quá tĩnh, đảm bảo có một số chuyển động
    const movementThreshold = 5; // Ngưỡng phần trăm cho chuyển động X/Y
    const scaleChangeThreshold = 0.05; // Ngưỡng scale cho zoom

    if (Math.abs(startX - endX) < movementThreshold && Math.abs(startY - endY) < movementThreshold && Math.abs(startScale - endScale) < scaleChangeThreshold) {
        // Nếu chuyển động quá nhỏ, buộc animation phải rõ rệt hơn
        if (Math.random() > 0.5) { // Buộc pan đáng kể
            const panForce = (movementThreshold + Math.random() * (10 - movementThreshold)); // Tối đa 10% dịch chuyển
            endX = startX + (Math.random() > 0.5 ? 1 : -1) * panForce;
            endY = startY + (Math.random() > 0.5 ? 1 : -1) * panForce;
        } else { // Buộc zoom đáng kể
            const scaleForce = (scaleChangeThreshold + Math.random() * 0.1);
            endScale = startScale + (Math.random() > 0.5 ? 1 : -1) * scaleForce;
            // Giới hạn scale trong phạm vi min/max đã định nghĩa
            endScale = Math.max(minScale, Math.min(maxScale, endScale));
        }
    }

    // CUỐI CÙNG, kẹp các giá trị endX, endY vào giới hạn pan của nó
    // Điều này quan trọng để đảm bảo không có viền đen nào lộ ra nếu logic "buộc" đẩy chúng quá xa.
    endX = Math.max(-maxEndPan, Math.min(maxEndPan, endX));
    endY = Math.max(-maxEndPan, Math.min(maxEndPan, endY));
    // Tương tự cho startX, startY (dù ít khả năng gây lỗi hơn)
    startX = Math.max(-maxStartPan, Math.min(maxStartPan, startX));
    startY = Math.max(-maxStartPan, Math.min(maxStartPan, startY));


    return {
        initial: {
            scale: startScale,
            x: `${startX}%`,
            y: `${startY}%`,
            opacity: 0,
        },
        animate: {
            scale: endScale,
            x: `${endX}%`,
            y: `${endY}%`,
            opacity: 1,
        }
    };
};

// ================= COMPONENT =================
export default function ImageSlideshow() {
    const [images, setImages] = useState<string[]>([]);
    const [index, setIndex] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);
    // State để lưu các thuộc tính animation Ken Burns cho slide hiện tại
    const [kenBurnsProps, setKenBurnsProps] = useState(generateKenBurnsAnimation());

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

        // Reset index nếu nó vượt quá giới hạn (có thể xảy ra nếu images thay đổi)
        if (index >= images.length) {
            setIndex(0);
        }

        const timer = setInterval(next, AUTO_PLAY_DELAY);
        return () => clearInterval(timer);
    }, [playing, images.length, index]);

    // ================= GENERATE KEN BURNS PROPS ON INDEX CHANGE =================
    useEffect(() => {
        if (images.length > 0) {
            setKenBurnsProps(generateKenBurnsAnimation());
        }
    }, [index, images.length]); // Tạo lại props mỗi khi index hoặc danh sách ảnh thay đổi

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
                    height: isFullscreen ? "100vh" : undefined,
                    aspectRatio: isFullscreen ? undefined : "1 / 1",
                    width: "100%",
                    overflow: "hidden", // Quan trọng để cắt hiệu ứng Ken Burns bên trong
                    background: "#000",
                    borderRadius: 8 // Bo tròn cho container chính
                }}
            >
                {/* KEN BURNS IMAGE */}
                <AnimatePresence>
                    <motion.div
                        key={index} // key thay đổi để framer-motion re-mount và áp dụng animation mới
                        initial={kenBurnsProps.initial}
                        animate={kenBurnsProps.animate}
                        exit={{ opacity: 0, transition: { duration: FADE_IN_DURATION } }}
                        transition={{
                            opacity: { duration: FADE_IN_DURATION }, // Transition cho opacity
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
                        style={{ position: "absolute", inset: 0 }} // Loại bỏ borderRadius tại đây
                    >
                        <Image
                            src={images[index]}
                            alt={`Slide ${index + 1}`}
                            fill
                            sizes="100vw"
                            priority={index === 0}
                            unoptimized
                            style={{
                                objectFit: "cover", // Đã thay đổi thành 'cover'
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