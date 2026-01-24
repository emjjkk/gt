import React, { useState, type JSX } from "react";

export default function Funeral(): JSX.Element {
    const [isImageOpen, setIsImageOpen] = useState(false);
    const [isStreamOpen, setIsStreamOpen] = useState(false);

    // Set to null until livestream is ready
    const youtubeLivestreamUrl = null
    // Example when live: 
    // const youtubeLivestreamUrl = "https://www.youtube.com/embed/VIDEO_ID?autoplay=1&rel=0&modestbranding=1&controls=1";

    return (
        <section
            id="funeral"
            className="dark:text-white dark:bg-black/[0.98] bg-[var(--clr-white)] w-full flex justify-center px-5 md:px-0"
        >
            <div className="py-20 max-w-6xl w-full border-t dark:border-slate-800 border-[var(--clr-celadon)]">
                <h2 className="text-3xl font-domine mb-10 text-center">
                    Funeral Details
                </h2>
                <div className="w-full flex items-center justify-center mb-10">
                    {/* Livestream Button */}
                    <button
                        onClick={() => setIsStreamOpen(true)}
                        className="mb-5 w-full md:w-auto px-6 py-3 rounded-lg font-semibold text-[#105] cursor-pointer
                                       bg-[var(--clr-celadon)] hover:opacity-90 transition shadow flex items-center gap-2"
                    >
                        <i className="fa-solid fa-circle-play"></i>
                        LIVE SOON: Service Of Songs @ St. Williams Church 
                    </button>
                </div>

                <div className="md:flex items-center gap-10">
                    {/* Image */}
                    <div className="md:w-1/2">
                        <img
                            src="/invite.jpeg"
                            alt="invite"
                            onClick={() => setIsImageOpen(true)}
                            className="cursor-zoom-in max-w-xl w-full mx-auto rounded-lg shadow-lg hover:opacity-90 transition"
                        />
                    </div>

                    {/* Details */}
                    <div className="md:w-1/2 text-left">

                        <p className="font-bold text-xl mb-3 text-[var(--clr-celadon)]">
                            Schedule & Arrangements
                        </p>

                        <p className="font-semibold text-[var(--clr-celadon)]">
                            <i className="fa-solid fa-dove"></i> Service of Songs
                        </p>
                        <p>
                            Time: Thursday, February 19th 2026 · 5:30PM – 7:30PM
                        </p>
                        <p className="mb-3">
                            Venue: St. Williams Church, Walderslade, Chatham, UK
                        </p>

                        <p className="font-semibold text-[var(--clr-celadon)]">
                            <i className="fa-solid fa-cross"></i> Funeral Service
                        </p>
                        <p>Time: Friday, February 20th 2026 · 10:00AM</p>
                        <p className="mb-3">
                            Venue: St. Williams Church, Walderslade, Chatham, UK
                        </p>

                        <p className="font-semibold mb-3 text-[var(--clr-celadon)]">
                            <i className="fa-solid fa-lock"></i> Interment To Follow Immediately (Private event) - By Invitation Only
                        </p>

                        <p className="font-semibold text-[var(--clr-celadon)]">
                            <i className="fa-solid fa-wine-glass"></i> Reception
                        </p>
                        <p>Time: Immediately after service</p>
                        <p>
                            Venue: St. Justus Church Hall, The Fairway, Rochester, UK
                        </p>
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            {isImageOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4"
                    onClick={() => setIsImageOpen(false)}
                >
                    <div
                        className="relative max-w-5xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute -top-12 right-0 text-white text-4xl font-bold"
                            onClick={() => setIsImageOpen(false)}
                        >
                            ×
                        </button>

                        <img
                            src="/invite.jpeg"
                            alt="invite enlarged"
                            className="w-full rounded-lg shadow-2xl"
                        />
                    </div>
                </div>
            )}

            {/* Livestream Modal */}
            {isStreamOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/[0.95] flex items-center justify-center px-4"
                    onClick={() => setIsStreamOpen(false)}
                >
                    <div
                        className="relative w-full max-w-6xl aspect-video bg-black rounded-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute -top-12 right-0 text-white text-4xl font-bold"
                            onClick={() => setIsStreamOpen(false)}
                        >
                            ×
                        </button>

                        {youtubeLivestreamUrl ? (
                            <div className="relative w-full h-full">
                                <iframe
                                    src={youtubeLivestreamUrl}
                                    title="Livestream"
                                    allow="autoplay; encrypted-media"
                                    allowFullScreen
                                    className="w-full h-full"
                                />

                                {/* Interaction-blocking overlay */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        pointerEvents: "auto",
                                        cursor: "default",
                                    }}
                                    onContextMenu={(e) => e.preventDefault()}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white text-lg font-semibold">
                                Livestream will be shown here
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

/*
<iframe width="990" height="557" src="https://www.youtube.com/embed/Fw9hgttWzIg" title="🔴 Crystal Bay Beach Resort | Lamai | Koh Samui | Thailand | Live Beach Webcam | 2160p 4K" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

*/
