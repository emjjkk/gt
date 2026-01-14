import React, { useEffect, useState, type JSX } from "react";
import { supabase } from "../db/supabase";

type ThoughtPrayer = {
    id: string;
    message: string;
    name: string | null;
    created_at: string;
};

export default function ThoughtsPrayers(): JSX.Element {
    const [entries, setEntries] = useState<ThoughtPrayer[]>([]);
    const [message, setMessage] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [showAll, setShowAll] = useState(false); // <-- new state for "see all"

    // Fetch approved entries
    useEffect(() => {
        const fetchEntries = async () => {
            const { data, error } = await supabase
                .from<ThoughtPrayer>("thoughts_prayers")
                .select("*")
                .eq("status", "ok")
                .order("created_at", { ascending: false });

            if (error) {
                console.error(error);
            } else {
                setEntries(data ?? []);
            }
            setLoading(false);
        };

        fetchEntries();
    }, []);

    // Submit new entry
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        setSubmitting(true);

        const { error } = await supabase
            .from("thoughts_prayers")
            .insert({
                message,
                name: name || null,
                status: "draft",
            });

        if (error) {
            console.error("Submission error:", error);
        } else {
            alert("Your thought has been submitted and is pending approval.");
            setMessage("");
            setName("");
            setFormVisible(false);
        }
        setSubmitting(false);
    };

    // Only show first 2 rows (6 items) if showAll is false
    const visibleEntries = showAll ? entries : entries.slice(0, 8);

    return (
        <section id="thoughts" className="bg-[var(--clr-white)] w-full flex justify-center">
            <div className="py-20 max-w-7xl w-full flex flex-col items-center border-t border-[var(--clr-celadon)]">
                <h2 className="text-4xl font-domine mb-10 text-center">
                    Thoughts & Prayers
                </h2>

                {/* Toggle Form Button */}
                <div className="text-center mb-8">
                    <button
                        onClick={() => setFormVisible((prev) => !prev)}
                        className="bg-[var(--clr-celadon)] text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition"
                    >
                        {formVisible ? "Hide Form" : "Leave a Thought or Prayer"}
                    </button>
                </div>

                {/* Collapsible Form */}
                <div
                    className={`overflow-hidden transition-all w-2xl duration-300 ${formVisible ? "max-h-[500px]" : "max-h-0"
                        }`}
                >
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4 mb-12"
                    >
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write your thought or prayer here..."
                            className="p-4 border border-gray-300 rounded-lg w-full resize-none h-28"
                            required
                        />

                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="p-3 border border-gray-300 rounded-lg w-full"
                        />

                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-[var(--clr-celadon)] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
                        >
                            {submitting ? "Submitting..." : "Submit"}
                        </button>
                    </form>
                </div>

                {/* Approved Entries */}
                {loading ? (
                    <p className="text-center text-gray-500">Loading entries...</p>
                ) : entries.length === 0 ? (
                    <p className="text-center text-gray-500">No thoughts yet.</p>
                ) : (
                    <>
                        {/* Masonry Grid */}
                        <div
                            className="w-full"
                            style={{
                                columnCount: window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1,
                                columnGap: "1.25rem", // matches Tailwind gap-5
                            }}
                        >
                            {visibleEntries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="break-inside-avoid p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm mb-5"
                                >
                                    <p className="text-gray-800">{entry.message}</p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        {entry.name ? `— ${entry.name}, ` : ""}
                                        {new Date(entry.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Show All / Show Less Button */}
                        {entries.length > 6 && (
                            <div className="text-center mt-8">
                                <button
                                    onClick={() => setShowAll((prev) => !prev)}
                                    className="bg-[var(--clr-celadon)] text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition"
                                >
                                    {showAll ? "Show Less" : "See All"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
