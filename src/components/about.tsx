import React, { useEffect, useState, type JSX } from "react";
import { supabase } from "../db/supabase";

type AboutRow = {
  id: string;
  text: string;
  name: string;
  created_at: string;
};

export default function About(): JSX.Element {
  const [about, setAbout] = useState<AboutRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editName, setEditName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch latest about
  useEffect(() => {
    const fetchAbout = async (): Promise<void> => {
      const { data, error } = await supabase
        .from<AboutRow>("about_section")
        .select("id, text, name, created_at")
        .eq("status", "ok")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching about:", error);
      } else {
        setAbout(data);
        setEditText(data?.text ?? "");
      }
      setLoading(false);
    };
    fetchAbout();
  }, []);

  // Handle suggestion submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return alert("Text cannot be empty");

    setSubmitting(true);

    try {
      await supabase.from("about_section").insert({
        text: editText,
        name: editName || null,
        status: "draft", // moderation
      });

      alert("Your suggested edit has been submitted! Pending approval.");
      setIsEditing(false);
      setEditName("");
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      alert("Failed to submit suggestion.");
    }

    setSubmitting(false);
  };

  return (
    <section id="about" className="flex justify-center bg-[var(--clr-white)] bg-opacity-50 px-5">
      <div className="min-h-[50vh] w-full max-w-7xl py-20 border-t border-[var(--clr-celadon)] md:flex justify-between gap-10">
        <div className="md:w-1/2">
          <h1 className="text-5xl font-domine mb-10">
            The Story and Legacy of a Life Well Lived
          </h1>

          {loading && (
            <p className="text-sm text-slate-500/50">
              <i className="fa-solid fa-spinner animate-spin"></i>
            </p>
          )}

          {!loading && about && (
            <>
              {!isEditing ? (
                <>
                  <p className="text-[var(--clr-ebony)] text-lg leading-relaxed whitespace-pre-line">
                    {about.text}
                  </p>

                  <div className="mt-6 flex items-center gap-3">
                    <p className="text-sm text-gray-500">
                      Last edited by {about.name} on{" "}
                      {new Date(about.created_at).toLocaleDateString()}
                    </p>

                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-blue-500 text-sm flex items-center gap-1 hover:underline"
                    >
                     { /*<i className="fa-solid fa-pencil"></i> Suggest an edit*/}
                    </button>
                  </div>
                </>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4 mt-4"
                >
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="p-4 border border-gray-300 rounded-lg w-full resize-none h-72"
                    required
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                    className="p-3 border border-gray-300 rounded-lg w-full"
                  />
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-[var(--clr-celadon)] text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition"
                    >
                      {submitting ? "Submitting..." : "Submit Suggestion"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="py-3 px-6 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        <img
          src="/images/1.jpeg"
          alt="Granddad"
          className="h-[720px] md:w-1/2 object-cover mt-5 md:mt-0 grayscale-0 hover:grayscale-70 hover:scale-[1.01] hover:shadow-2xl"
        />
      </div>
    </section>
  );
}
