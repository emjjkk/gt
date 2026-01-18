import React, { useEffect, useState, type JSX } from "react";
import { supabase } from "../db/supabase";
import Cbtn from './cbtn'

type GalleryItem = {
    id: string;
    title: string;
    caption: string | null;
    image_url: string;
    contributed_by: string | null;
    media_type: 'image' | 'video';
    video_source?: 'upload' | 'youtube';
};

export default function Gallery(): JSX.Element {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
    const [formVisible, setFormVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
    const [videoFormType, setVideoFormType] = useState<'upload' | 'youtube'>('upload');
    const [showVideoInfo, setShowVideoInfo] = useState(false);

    const [title, setTitle] = useState("");
    const [caption, setCaption] = useState("");
    const [contributedBy, setContributedBy] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Fetch gallery items
    useEffect(() => {
        const fetchGallery = async (): Promise<void> => {
            const { data, error } = await supabase
                .from<GalleryItem>("gallery_items")
                .select("id, title, caption, image_url, contributed_by, media_type, video_source")
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

    // Extract YouTube video ID from URL
    const extractYoutubeId = (url: string): string | null => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /^([a-zA-Z0-9_-]{11})$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    // Handle image upload
    const handleImageUpload = async () => {
        if (!selectedFile) {
            alert("No file selected");
            return;
        }

        if (!title.trim()) {
            alert("Title is required");
            return;
        }

        setUploading(true);

        try {
            const fileExt = selectedFile.name.split(".").pop();
            const filePath = `${Date.now()}-${Math.floor(Math.random() * 1e6)}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("gallery")
                .upload(filePath, selectedFile, {
                    cacheControl: "3600",
                    contentType: selectedFile.type,
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
                media_type: "image",
            });

            if (insertError) throw insertError;

            alert("Photo submitted! Pending approval.");
            resetForm();
        } catch (error) {
            console.error("Upload failed:", error);
            alert(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        setUploading(false);
    };

    // Handle video upload
    const handleVideoUpload = async () => {
        if (!selectedFile) {
            alert("No file selected");
            return;
        }

        // Check file size (30MB limit)
        const maxSize = 30 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
            alert("Video file exceeds 30MB limit. Please use the YouTube link option instead.");
            return;
        }

        if (!title.trim()) {
            alert("Title is required");
            return;
        }

        setUploading(true);

        try {
            const fileExt = selectedFile.name.split(".").pop();
            const filePath = `videos/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("gallery")
                .upload(filePath, selectedFile, {
                    cacheControl: "3600",
                    contentType: selectedFile.type,
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
                media_type: "video",
                video_source: "upload",
            });

            if (insertError) throw insertError;

            alert("Video submitted! Pending approval.");
            resetForm();
        } catch (error) {
            console.error("Upload failed:", error);
            alert(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        setUploading(false);
    };

    // Handle YouTube link submission
    const handleYoutubeSubmit = async () => {
        if (!title.trim()) {
            alert("Title is required");
            return;
        }

        if (!youtubeUrl.trim()) {
            alert("YouTube URL is required");
            return;
        }

        const videoId = extractYoutubeId(youtubeUrl);
        if (!videoId) {
            alert("Invalid YouTube URL. Please provide a valid YouTube link.");
            return;
        }

        setUploading(true);

        try {
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;

            const { error: insertError } = await supabase.from("gallery_items").insert({
                title,
                caption: caption || null,
                image_url: embedUrl,
                contributed_by: contributedBy || null,
                status: "draft",
                media_type: "video",
                video_source: "youtube",
            });

            if (insertError) throw insertError;

            alert("Video submitted! Pending approval.");
            resetForm();
            setYoutubeUrl("");
        } catch (error) {
            console.error("Submission failed:", error);
            alert(`Submission failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        setUploading(false);
    };

    const resetForm = () => {
        setTitle("");
        setCaption("");
        setContributedBy("");
        setSelectedFile(null);
        setFormVisible(false);
    };

    const getYoutubeThumbnail = (embedUrl: string): string => {
        const videoId = embedUrl.split('/').pop();
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    };

    return (
        <section id="gallery" className="dark:text-white dark:bg-black/[0.98] bg-[var(--clr-white)] flex justify-center px-5">
            <div className="w-full max-w-6xl 2xl:max-w-7xl border-t border-[var(--clr-celadon)] dark:border-slate-800 py-20 text-center">
                <h2 className="text-3xl 2xl:text-4xl font-domine mb-5 text-center">Gallery</h2>
                <p className="text-md text-center mb-7">
                    Photos and videos contributed by the many family and acquaintances who were
                    impacted by his legacy.
                </p>

                {/* Toggle Upload Form */}
                <button
                    onClick={() => setFormVisible((prev) => !prev)}
                    className="bg-[var(--clr-celadon)] text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition mb-7"
                >
                    {formVisible ? "Hide Upload Form" : "Contribute a Photo or Video"}
                </button>

                {/* Collapsible Upload Form */}
                <div
                    className={`text-center overflow-hidden transition-all duration-300 ${formVisible ? "max-h-[800px]" : "max-h-0"
                        } mb-10`}
                >
                    <div className="bg-white dark:bg-neutral-950 p-6 rounded-lg w-full mx-auto border border-neutral-300 dark:border-neutral-700">
                        {/* Tabs */}
                        <div className="flex gap-2 mb-7 flex items-center justify-center border-gray-300 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setActiveTab('image');
                                    setVideoFormType('upload');
                                }}
                                className={`px-4 py-2 font-semibold transition ${activeTab === 'image'
                                    ? 'border-b-2 border-[var(--clr-celadon)] text-[var(--clr-celadon)]'
                                    : 'text-gray-500'
                                    }`}
                            >
                                Image
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('video');
                                    setVideoFormType('upload');
                                }}
                                className={`px-4 py-2 font-semibold transition ${activeTab === 'video'
                                    ? 'border-b-2 border-[var(--clr-celadon)] text-[var(--clr-celadon)]'
                                    : 'text-gray-500'
                                    }`}
                            >
                                Video
                            </button>
                        </div>

                        {/* Image Form */}
                        {activeTab === 'image' && (<>

                            {/* Image Size Notice */}
                            <div className="mb-5 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-left">
                                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                                    Image upload limit: 5MB.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column - Form Fields */}
                                <div className="flex flex-col gap-4">
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Title"
                                        className="p-3 border border-gray-300 dark:border-neutral-700 rounded-lg w-full"
                                        required
                                    />

                                    <input
                                        type="text"
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder="Caption (optional)"
                                        className="p-3 border border-gray-300 dark:border-neutral-700 rounded-lg w-full"
                                    />

                                    <input
                                        type="text"
                                        value={contributedBy}
                                        onChange={(e) => setContributedBy(e.target.value)}
                                        placeholder="Your name"
                                        required
                                        className="p-3 border border-gray-300 dark:border-neutral-700 rounded-lg w-full"
                                    />

                                    <div onClick={handleImageUpload}>
                                        <Cbtn type="button" text={uploading ? "Uploading..." : "Submit Photo"} />
                                    </div>
                                </div>

                                {/* Right Column - File Upload */}
                                <div className="flex items-center justify-center">
                                    <div className="relative w-full h-full min-h-[200px] border-2 border-dashed rounded-lg p-4 flex items-center justify-center border-gray-300 dark:border-gray-600 transition-colors hover:border-blue-400">

                                        {/* Empty state */}
                                        {!selectedFile && (
                                            <div className="group flex flex-col items-center gap-2 pointer-events-none">
                                                <i className="fa fa-upload text-3xl text-gray-400 transition-opacity group-hover:opacity-0" />

                                                <img
                                                    src="/upload-preview.png"
                                                    alt="Upload"
                                                    className="absolute w-12 h-12 opacity-0 transition-opacity group-hover:opacity-100"
                                                />

                                                <p className="text-sm text-gray-500 transition-all group-hover:text-blue-500">
                                                    <span className="group-hover:hidden">Click or drag to upload</span>
                                                    <span className="hidden group-hover:inline">Drop file here</span>
                                                </p>
                                            </div>
                                        )}

                                        {/* File selected state */}
                                        {selectedFile && (
                                            <div className="pointer-events-none flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <i className="fa fa-file-image-o text-blue-500" />
                                                <span className="truncate max-w-[80%]">{selectedFile.name}</span>
                                            </div>
                                        )}

                                        {/* File input */}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            required
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>


                                </div>
                            </div>
                        </>)}

                        {/* Video Form */}
                        {activeTab === 'video' && (
                            <>
                                {videoFormType === 'upload' ? (
                                    <>
                                        {/* Video Size Notice */}
                                        <div className="mb-5 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-left">
                                            <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                                                Maximum upload limit: 30MB. Please keep videos under 60 seconds.
                                            </p>
                                            <p className="text-sm">Video files are significantly larger than images. A 30MB limit helps ensure everyone has space to upload their content while making sure it remains sustainable to run this site in the long term. Thank you for your understanding.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Left Column - Form Fields */}
                                            <div className="flex flex-col gap-4">
                                                <input
                                                    type="text"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    placeholder="Title"
                                                    className="p-3 border border-gray-300 dark:border-neutral-700 rounded-lg w-full"
                                                    required
                                                />

                                                <input
                                                    type="text"
                                                    value={caption}
                                                    onChange={(e) => setCaption(e.target.value)}
                                                    placeholder="Caption (optional)"
                                                    className="p-3 border border-gray-300 dark:border-neutral-700 rounded-lg w-full"
                                                />

                                                <input
                                                    type="text"
                                                    value={contributedBy}
                                                    onChange={(e) => setContributedBy(e.target.value)}
                                                    placeholder="Your name"
                                                    className="p-3 border border-gray-300 dark:border-neutral-700 rounded-lg w-full"
                                                />

                                                <div onClick={handleVideoUpload}>
                                                    <Cbtn type="button" text={uploading ? "Uploading..." : "Submit Video"} />
                                                </div>
                                            </div>

                                            {/* Right Column - File Upload */}
                                            <div className="flex items-center justify-center">
                                                <div className="relative w-full h-full min-h-[200px] border-2 border-dashed rounded-lg p-4 flex items-center justify-center border-gray-300 dark:border-gray-600 transition-colors hover:border-purple-400">

                                                    {!selectedFile && (
                                                        <div className="group flex flex-col items-center gap-2 pointer-events-none">
                                                            <i className="fa fa-video-camera text-3xl text-gray-400 transition-opacity group-hover:opacity-0" />

                                                            <img
                                                                src="/video-upload-preview.png"
                                                                alt="Upload video"
                                                                className="absolute w-12 h-12 opacity-0 transition-opacity group-hover:opacity-100"
                                                            />

                                                            <p className="text-sm text-gray-500 transition-all group-hover:text-purple-500">
                                                                <span className="group-hover:hidden">Click or drag to upload video</span>
                                                                <span className="hidden group-hover:inline">Drop file here</span>
                                                            </p>
                                                        </div>
                                                    )}

                                                    {selectedFile && (
                                                        <div className="pointer-events-none flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                            <i className="fa fa-file-video-o text-purple-500" />
                                                            <span className="truncate max-w-[80%]">{selectedFile.name}</span>
                                                        </div>
                                                    )}

                                                    <input
                                                        type="file"
                                                        accept="video/mp4,video/quicktime"
                                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                        required
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                </div>

                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setVideoFormType('youtube')}
                                            className="mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-[var(--clr-celadon)] dark:hover:text-[var(--clr-celadon)] underline"
                                        >
                                            I can't keep it below this limit
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-left">
                                            <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                                📺 Share via YouTube
                                            </p>
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                Upload your video to YouTube first, then paste the link here. Your video will be embedded in the gallery.
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <input
                                                type="text"
                                                value={youtubeUrl}
                                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                                placeholder="YouTube URL (e.g., https://youtube.com/watch?v=...)"
                                                className="p-3 border border-gray-300 dark:border-neutral-700 rounded-lg w-full"
                                                required
                                            />

                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Title"
                                                className="p-3 border border-gray-300 dark:border-neutral-700 rounded-lg w-full"
                                                required
                                            />

                                            <input
                                                type="text"
                                                value={caption}
                                                onChange={(e) => setCaption(e.target.value)}
                                                placeholder="Caption (optional)"
                                                className="p-3 border border-gray-300 dark:border-neutral-700 rounded-lg w-full"
                                            />

                                            <input
                                                type="text"
                                                value={contributedBy}
                                                onChange={(e) => setContributedBy(e.target.value)}
                                                placeholder="Your name"
                                                className="p-3 border border-gray-300 dark:border-neutral-700 rounded-lg w-full"
                                            />

                                            <div onClick={handleYoutubeSubmit}>
                                                <Cbtn type="button" text={uploading ? "Submitting..." : "Submit Video"} />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setVideoFormType('upload')}
                                            className="mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-[var(--clr-celadon)] dark:hover:text-[var(--clr-celadon)] underline"
                                        >
                                            ← Back to video upload
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Masonry Gallery */}
                <div className="columns-1 sm:columns-2 lg:columns-6 gap-4 max-w-7xl mx-auto">
                    {(showAll ? items : items.slice(0, 17)).map((item) => (
                        <div
                            key={item.id}
                            className="mb-6 break-inside-avoid cursor-pointer relative group"
                            onClick={() => setActiveItem(item)}
                        >
                            {item.media_type === 'video' ? (
                                <div className="relative">
                                    {item.video_source === 'youtube' ? (
                                        <img
                                            src={getYoutubeThumbnail(item.image_url)}
                                            alt={item.title}
                                            className="w-full rounded-lg hover:opacity-90 transition"
                                            oncontextmenu="return false;"
                                        />
                                    ) : (
                                        <video
                                            src={item.image_url}
                                            className="w-full rounded-lg hover:opacity-90 transition"
                                            preload="metadata"
                                        />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-black/60 rounded-full p-4 group-hover:bg-black/80 transition">
                                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={item.image_url}
                                    alt={item.title}
                                    className="w-full rounded-lg hover:opacity-90 transition"
                                />
                            )}
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
                        className="max-w-4xl w-full rounded-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {activeItem.media_type === 'video' ? (
                            activeItem.video_source === 'youtube' ? (
                                <iframe
                                    src={activeItem.image_url}
                                    className="w-full aspect-video rounded-lg"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    src={activeItem.image_url}
                                    controls
                                    autoPlay
                                    className="w-full max-h-[80vh] rounded-lg"
                                />
                            )
                        ) : (
                            <img
                                src={activeItem.image_url}
                                alt={activeItem.title}
                                className="w-full max-h-[95vh] mt-3 object-contain"
                            />
                        )}

                        <div className="hidden md:block absolute top-5 left-5 max-w-md">
                            <h3 className="text-2xl font-semibold mb-2 text-white">{activeItem.title}</h3>

                            {activeItem.caption && (
                                <p className="mb-2 text-gray-200">{activeItem.caption}</p>
                            )}

                            {activeItem.contributed_by && (
                                <p className="text-sm text-gray-400">
                                    Contributed by {activeItem.contributed_by}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={() => setActiveItem(null)}
                            className="absolute top-5 right-5 text-white hover:text-gray-300 text-3xl font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}