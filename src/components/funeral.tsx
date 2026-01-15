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
            <section id="funeral" className="dark:text-white dark:bg-black/[0.98] bg-[var(--clr-white)] w-full flex justify-center">
                <div className="py-20 max-w-6xl 2xl:max-w-7xl w-full border-t dark:border-slate-800 border-[var(--clr-celadon)] text-center">
                    <h2 className="text-3xl 2xl:text-4xl font-domine mb-5 text-center">
                        Funeral Details
                    </h2>
                    <p>Loading funeral details...</p>
                </div>
            </section>
        );
    }

    if (!funeral) {
        return (
            <section className="dark:text-white dark:bg-black/[0.98] bg-[var(--clr-white)] w-full flex justify-center">
                <div className="py-20 max-w-7xl w-full border-t dark:border-slate-800 border-[var(--clr-celadon)] text-center">
                    <h2 className="text-3xl 2xl:text-4xl font-domine mb-5 text-center">
                        Funeral Details
                    </h2>
                    <p>No funeral details have been confirmed as of this moment.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="dark:text-white dark:bg-black/[0.98] py-20 bg-[var(--clr-white)] border-t dark:border-slate-800 border-[var(--clr-celadon)]">
            <div className="max-w-3xl mx-auto px-6 text-center">
                <h2 className="text-3xl 2xl:text-4xl font-domine mb-10">Funeral Details</h2>

                {funeral.status === "pending" && (
                    <p className="text-gray-700 text-lg">
                        Funeral date and venue are not confirmed yet. Details coming soon.
                    </p>
                )}

                {funeral.status === "scheduled" && funeral.date && funeral.venue && (
                    <div className="text-gray-800 text-lg space-y-2">
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
                    <div className="text-gray-800 text-lg space-y-2">
                        <p>
                            The funeral is currently live. Watch it here:
                        </p>
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
