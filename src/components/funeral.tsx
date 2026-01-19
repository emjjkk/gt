import React, { useEffect, useState, type JSX } from "react";
import { supabase } from "../db/supabase";

type Funeral = {
    id: string;
    date: string | null;
    venue: string | null;
    livestream_url: string | null;
    status: "pending" | "scheduled" | "live" | "done";
};

export default function Funeral(): JSX.Element {
    const [funeral, setFuneral] = useState<Funeral | null>(null);
    const [loading, setLoading] = useState(true);
    const [isImageOpen, setIsImageOpen] = useState(false);

    useEffect(() => {
        const fetchFuneral = async () => {
            const { data, error } = await supabase
                .from<Funeral>("funeral")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.error("Funeral fetch error:", error);
            } else {
                setFuneral(data);
            }

            setLoading(false);
        };

        fetchFuneral();
    }, []);

    if (loading) {
        return (
            <section
                id="funeral"
                className="dark:text-white dark:bg-black/[0.98] bg-[var(--clr-white)] w-full flex justify-center"
            >
                <div className="py-20 max-w-6xl w-full border-t dark:border-slate-800 border-[var(--clr-celadon)] text-center">
                    <h2 className="text-3xl font-domine mb-5">Funeral Details</h2>
                    <p>Loading funeral details...</p>
                </div>
            </section>
        );
    }

    if (!funeral) {
        return (
            <section
                id="funeral"
                className="dark:text-white dark:bg-black/[0.98] bg-[var(--clr-white)] w-full flex justify-center px-5 md:px-0"
            >
                <div className="py-20 max-w-6xl w-full border-t dark:border-slate-800 border-[var(--clr-celadon)]">
                    <h2 className="text-3xl font-domine mb-10 text-center">
                        Funeral Details
                    </h2>

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
                            <p className="text-md mb-3 mt-4 md:mt-0">
                                Livestream links will be provided and can be watched here.
                            </p>

                            <p className="font-bold text-xl mb-3 text-blue-500">
                                Schedule & Arrangements
                            </p>

                            <p className="font-semibold text-blue-500">
                                <i className="fa-solid fa-dove"></i> Service of Songs
                            </p>
                            <p>
                                TIme: Thursday, February 19th 2026 · 5:30PM – 7:30PM
                            </p>
                            <p className="mb-3">
                                Venue: St. Williams Church, Walderslade, Chatham, UK
                            </p>

                            <p className="font-semibold text-blue-500">
                                <i className="fa-solid fa-cross"></i> Funeral Service
                            </p>
                            <p>TIme: Friday, February 20th 2026 · 10:00AM</p>
                            <p className="mb-3">
                                Venue: St. Williams Church, Walderslade, Chatham, UK
                            </p>

                            <p className="font-semibold mb-3 text-blue-500">
                                <i className="fa-solid fa-lock"></i> Interment To Follow Directly (Private event)
                            </p>

                            <p className="font-semibold text-blue-500">
                                <i className="fa-solid fa-wine-glass"></i> Reception
                            </p>
                            <p>Time: To Be Announced</p>
                            <p>
                                Venue: St. Justus Church Hall, Rochester, UK
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
            </section>
        );
    }

    return (
        <section className="dark:text-white dark:bg-black/[0.98] py-20 bg-[var(--clr-white)] border-t dark:border-slate-800 border-[var(--clr-celadon)]">
            <div className="max-w-3xl mx-auto px-6 text-center">
                <h2 className="text-3xl font-domine mb-10">Funeral Details</h2>

                {funeral.status === "pending" && (
                    <p className="text-lg">
                        Funeral date and venue are not confirmed yet.
                    </p>
                )}

                {funeral.status === "scheduled" && funeral.date && funeral.venue && (
                    <div className="space-y-2 text-lg">
                        <p>
                            <strong>Date & Time:</strong>{" "}
                            {new Date(funeral.date).toLocaleString()}
                        </p>
                        <p>
                            <strong>Venue:</strong> {funeral.venue}
                        </p>
                    </div>
                )}

                {funeral.status === "live" && funeral.livestream_url && (
                    <div className="space-y-3 text-lg">
                        <p>The funeral is currently live.</p>
                        <a
                            href={funeral.livestream_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--clr-celadon)] underline font-semibold"
                        >
                            View Livestream
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
}
