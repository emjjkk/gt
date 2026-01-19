import React, { useEffect, useState, type JSX, useRef } from "react";
import { supabase } from "../db/supabase";
import Cbtn from './cbtn'

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
    const [showAll, setShowAll] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<ThoughtPrayer | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [truncatedStates, setTruncatedStates] = useState<Record<string, boolean>>({});
    const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

    // Check line height and truncate if needed
    useEffect(() => {
        if (entries.length === 0) return;

        const checkTruncation = () => {
            const newTruncatedStates: Record<string, boolean> = {};
            
            entries.forEach(entry => {
                const element = entryRefs.current[entry.id];
                if (element) {
                    // Check if the text content exceeds approximately 12 lines
                    const lineHeight = parseInt(getComputedStyle(element).lineHeight);
                    const maxHeight = lineHeight * 12; // Approximately 12 lines
                    const needsTruncation = element.scrollHeight > maxHeight;
                    
                    newTruncatedStates[entry.id] = needsTruncation;
                }
            });
            
            setTruncatedStates(newTruncatedStates);
        };

        // Use setTimeout to ensure DOM is rendered
        setTimeout(checkTruncation, 0);
        
        // Re-check on window resize
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [entries]);

    // Truncate text to approximately 12 lines
    const truncateText = (text: string, elementId: string): string => {
        if (!truncatedStates[elementId]) {
            return text;
        }
        
        // This is a fallback truncation for initial render
        // The actual truncation is handled by CSS
        const words = text.split(' ');
        if (words.length > 120) { // Rough approximation
            return words.slice(0, 120).join(' ') + '...';
        }
        return text;
    };

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

    // Open modal with full message
    const openModal = (entry: ThoughtPrayer) => {
        setSelectedEntry(entry);
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEntry(null);
        document.body.style.overflow = 'auto';
    };

    // Close modal on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal();
        };
        
        if (isModalOpen) {
            window.addEventListener('keydown', handleEscape);
        }
        
        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isModalOpen]);

    // Only show first 8 items if showAll is false
    const visibleEntries = showAll ? entries : entries.slice(0, 8);

    return (
        <>
            <section id="thoughts" className="dark:text-white dark:bg-black/[0.98] bg-[var(--clr-white)] w-full flex justify-center px-5">
                <div className="py-20 max-w-6xl 2xl:max-w-7xl w-full flex flex-col items-center border-t dark:border-slate-800 border-[var(--clr-celadon)]">
                    <h2 className="text-3xl 2xl:text-4xl font-domine mb-10 text-center">
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
                        className={`overflow-hidden transition-all w-full max-w-2xl duration-300 ${formVisible ? "max-h-[500px]" : "max-h-0"
                            }`}
                    >
                        <form
                            onSubmit={handleSubmit}
                            className="bg-white dark:bg-neutral-950 p-6 rounded-lg w-full mx-auto border border-neutral-300 dark:border-neutral-700 mb-7"
                        >
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your thought or prayer here..."
                                className="p-4 border border-gray-300 dark:border-neutral-700 rounded-lg w-full resize-none h-28"
                                required
                            />

                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                className="p-3 border border-gray-300 dark:border-neutral-700 rounded-lg w-full mb-2"
                            />

                            <Cbtn text={submitting ? "Submitting..." : "Submit"} type="submit" />
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
                                {visibleEntries.map((entry) => {
                                    const needsTruncation = truncatedStates[entry.id];
                                    const displayText = truncateText(entry.message, entry.id);
                                    
                                    return (
                                        <div
                                            key={entry.id}
                                            className="break-inside-avoid p-6 border border-gray-200 dark:border-neutral-800 rounded-lg bg-gray-50 dark:bg-neutral-950 shadow-sm mb-5"
                                        >
                                            {/* Message content with line clamp */}
                                            <div 
                                                ref={el => entryRefs.current[entry.id] = el}
                                                className={`text-gray-800 dark:text-white ${needsTruncation ? 'line-clamp-12' : ''}`}
                                            >
                                                {displayText.split("\n").map((line, idx) => (
                                                    <p key={idx} className="mb-2">{line}</p>
                                                ))}
                                            </div>

                                            {/* Read More Link - only show if truncation is needed */}
                                            {needsTruncation && (
                                                <button
                                                    onClick={() => openModal(entry)}
                                                    className="mt-2 text-[var(--clr-celadon)] hover:underline text-sm font-medium"
                                                >
                                                    Read more
                                                </button>
                                            )}

                                            {/* Author and Date */}
                                            <p className="text-sm text-gray-500 dark:text-white/90 mt-2">
                                                {entry.name ? `— ${entry.name}, ` : ""}
                                                {new Date(entry.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Show All / Show Less Button */}
                            {entries.length > 8 && (
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

            {/* Modal for full message */}
            {isModalOpen && selectedEntry && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    <div className="bg-white dark:bg-neutral-950 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-neutral-200 dark:border-neutral-800">
                            <h3 className="text-md text-gray-900 dark:text-white">
                                {selectedEntry.name ? `${selectedEntry.name}` : "Anonymous"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto max-h-[80vh]">
                            <div className="text-gray-800 dark:text-white whitespace-pre-line">
                                {selectedEntry.message.split("\n").map((line, idx) => (
                                    <p key={idx} className="mb-3">{line}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}