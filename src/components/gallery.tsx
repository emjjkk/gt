import React, { useEffect, useState, type JSX } from "react";
import { supabase } from "../db/supabase";

type GalleryItem = {
    id: string;
    title: string;
    caption: string | null;
    image_url: string;
    contributed_by: string | null;
};

export default function Gallery(): JSX.Element {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
    const [formVisible, setFormVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showAll, setShowAll] = useState(false); // <-- new state

    const [title, setTitle] = useState("");
    const [caption, setCaption] = useState("");
    const [contributedBy, setContributedBy] = useState("");

    // Fetch gallery items
    useEffect(() => {
        const fetchGallery = async (): Promise<void> => {
            const { data, error } = await supabase
                .from<GalleryItem>("gallery_items")
                .select("id, title, caption, image_url, contributed_by")
                .eq("status", "ok")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Gallery fetch error:", error);
                return;
            }

            setItems(data ?? []);
        };

        fetchGallery();
    }, []);

    // Handle upload
    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);

        try {
            const input = e.currentTarget.querySelector<HTMLInputElement>(
                'input[type="file"]'
            );
            if (!input?.files || input.files.length === 0) {
                alert("No file selected");
                setUploading(false);
                return;
            }

            const file = input.files[0];
            if (!(file instanceof File)) {
                alert("Invalid file object");
                setUploading(false);
                return;
            }

            if (!title.trim()) {
                alert("Title is required");
                setUploading(false);
                return;
            }

            const fileExt = file.name.split(".").pop();
            const filePath = `${Date.now()}-${Math.floor(Math.random() * 1e6)}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("gallery")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    contentType: file.type,
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            const { data: urlData, error: urlError } = supabase.storage
                .from("gallery")
                .getPublicUrl(filePath);

            if (urlError || !urlData?.publicUrl) throw urlError ?? new Error("Failed to get public URL");

            const publicUrl = urlData.publicUrl;

            const { error: insertError } = await supabase.from("gallery_items").insert({
                title,
                caption: caption || null,
                image_url: publicUrl,
                contributed_by: contributedBy || null,
                status: "draft",
            });

            if (insertError) throw insertError;

            alert("Photo submitted! Pending approval.");

            setTitle("");
            setCaption("");
            setContributedBy("");
            if (input) input.value = "";
            setFormVisible(false);

            // Optimistic update
            setItems((prev) => [
                {
                    id: String(Date.now()),
                    title,
                    caption,
                    image_url: publicUrl,
                    contributed_by: contributedBy || null,
                },
                ...prev,
            ]);
        } catch (error) {
            console.error("Upload failed:", error);
            alert(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        setUploading(false);
    };

    return (
        <section id="gallery" className="dark:text-white dark:bg-black/[0.98] bg-[var(--clr-white)] flex justify-center px-5">
            <div className="w-full max-w-6xl 2xl:max-w-7xl border-t border-[var(--clr-celadon)] dark:border-slate-800 py-20 text-center">
                <h2 className="text-3xl 2xl:text-4xl font-domine mb-5 text-center">Photo Gallery</h2>
                <p className="text-md text-center mb-7">
                    Photos contributed by the many family and acquaintances who were
                    impacted by his legacy.
                </p>

                {/* Toggle Upload Form */}
                <button
                    onClick={() => setFormVisible((prev) => !prev)}
                    className="bg-[var(--clr-celadon)] text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition mb-5"
                >
                    {formVisible ? "Hide Upload Form" : "Contribute a Photo"}
                </button>

                {/* Collapsible Upload Form */}
                <div
                    className={`overflow-hidden transition-all duration-300 ${formVisible ? "max-h-[600px]" : "max-h-0"
                        } mb-10`}
                >
                    <form
                        onSubmit={handleUpload}
                        className="flex flex-col gap-4 mb-12 max-w-xl mx-auto"
                    >
                        <input
                            type="file"
                            accept="image/*"
                            className="border border-gray-300 rounded-lg p-2"
                            required
                        />

                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Title"
                            className="p-3 border border-gray-300 rounded-lg w-full"
                            required
                        />

                        <input
                            type="text"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Caption (optional)"
                            className="p-3 border border-gray-300 rounded-lg w-full"
                        />

                        <input
                            type="text"
                            value={contributedBy}
                            onChange={(e) => setContributedBy(e.target.value)}
                            placeholder="Your name"
                            className="p-3 border border-gray-300 rounded-lg w-full"
                        />

                        <button
                            type="submit"
                            disabled={uploading}
                            className="bg-[var(--clr-celadon)] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
                        >
                            {uploading ? "Uploading..." : "Submit Photo"}
                        </button>
                    </form>
                </div>

                {/* Masonry Gallery */}
                <div className="columns-1 sm:columns-2 lg:columns-4 gap-4 max-w-7xl mx-auto">
                    {(showAll ? items : items.slice(0, 9)).map((item) => (
                        <div
                            key={item.id}
                            className="mb-6 break-inside-avoid cursor-pointer"
                            onClick={() => setActiveItem(item)}
                        >
                            <img
                                src={item.image_url}
                                alt={item.title}
                                className="w-full rounded-lg hover:opacity-90 transition"
                            />
                        </div>
                    ))}
                </div>

                {/* Show All / Show Less Button */}
                {items.length > 9 && (
                    <button
                        onClick={() => setShowAll((prev) => !prev)}
                        className="mt-10 bg-[var(--clr-celadon)] text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition"
                    >
                        {showAll ? "Show Less" : "See All"}
                    </button>
                )}
            </div>

            {/* Lightbox */}
            {activeItem && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6"
                    onClick={() => setActiveItem(null)}
                >
                    <div
                        className="max-w-3xl w-full rounded-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={activeItem.image_url}
                            alt={activeItem.title}
                            className="w-full max-h-[95vh] mt-3 object-contain"
                        />

                        <div className="hidden md:block absolute top-5 left-5 max-w-lg">
                            <h3 className="text-2xl font-semibold mb-2 text-white">{activeItem.title}</h3>

                            {activeItem.caption && (
                                <p className="mb-2 text-gray-200">{activeItem.caption}</p>
                            )}

                            {activeItem.contributed_by && (
                                <p className="text-sm text-gray-500">
                                    Contributed by {activeItem.contributed_by}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
