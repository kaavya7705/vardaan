"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
import VardaanLogo from "@/components/VardaanLogo";

type Status = "idle" | "submitting" | "success" | "error";
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

type MarvelItem = {
  _id: string;
  title: string;
  tag: string;
  location: string;
  client: string;
  duration: string;
  description: string;
  img: string;
};

type MarvelFormData = {
  title: string;
  tag: string;
  location: string;
  client: string;
  duration: string;
  description: string;
};

const EMPTY_FORM: MarvelFormData = {
  title: "",
  tag: "",
  location: "",
  client: "",
  duration: "",
  description: "",
};

export default function AdminMarvelsForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [listStatus, setListStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [marvels, setMarvels] = useState<MarvelItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MarvelFormData>(EMPTY_FORM);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const isEditing = Boolean(editingId);

  const paginationText = useMemo(() => {
    if (totalItems === 0) {
      return "No records";
    }

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    return `${start}-${end} of ${totalItems}`;
  }, [currentPage, pageSize, totalItems]);

  const loadMarvels = async (options?: { page?: number; query?: string; limit?: number }) => {
    const page = options?.page ?? currentPage;
    const query = options?.query ?? searchQuery;
    const limit = options?.limit ?? pageSize;

    setListStatus("loading");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (query) {
        params.set("q", query);
      }

      const response = await fetch(`/api/marvels?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as {
        items?: MarvelItem[];
        error?: string;
        page?: number;
        totalItems?: number;
        totalPages?: number;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load marvels");
      }

      setMarvels(data.items ?? []);
      setCurrentPage(data.page ?? page);
      setTotalItems(data.totalItems ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setListStatus("ready");
    } catch (error) {
      setListStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to load marvels");
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    loadMarvels({ page: 1, query: searchQuery, limit: pageSize });
  }, [searchQuery, pageSize]);

  const setField = (field: keyof MarvelFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setImageDataUrl("");
    setEditingId(null);
  };

  const beginEdit = (marvel: MarvelItem) => {
    setEditingId(marvel._id);
    setFormData({
      title: marvel.title,
      tag: marvel.tag,
      location: marvel.location,
      client: marvel.client,
      duration: marvel.duration,
      description: marvel.description,
    });
    setImageDataUrl(marvel.img);
    setErrorMessage("");
    setStatus("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    const hasConfirmed = window.confirm("Delete this marvel permanently?");
    if (!hasConfirmed) {
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/marvels", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to delete marvel");
      }

      if (editingId === id) {
        resetForm();
      }

      setStatus("success");
      const nextPage = marvels.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      await loadMarvels({ page: nextPage });
      setTimeout(() => setStatus("idle"), 2500);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete marvel");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImageDataUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload a valid image file.");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setImageDataUrl("");
      setErrorMessage("Image is too large. Please upload an image under 6MB.");
      return;
    }

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Could not read image file"));
      reader.readAsDataURL(file);
    });

    setErrorMessage("");
    setImageDataUrl(base64);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    if (!imageDataUrl) {
      setStatus("error");
      setErrorMessage("Please upload an image. It will be converted to base64 automatically.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      tag: formData.tag.trim(),
      location: formData.location.trim(),
      client: formData.client.trim(),
      duration: formData.duration.trim(),
      description: formData.description.trim(),
      img: imageDataUrl,
      ...(editingId ? { id: editingId } : {}),
    };

    try {
      const response = await fetch("/api/marvels", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save marvel");
      }

      setStatus("success");
      resetForm();
      await loadMarvels({ page: editingId ? currentPage : 1 });
      setTimeout(() => setStatus("idle"), 3500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save marvel";
      setStatus("error");
      setErrorMessage(message);
      setTimeout(() => setStatus("idle"), 5000);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <VardaanLogo />
            <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Admin Panel
            </span>
          </div>

          <h1 className="font-serif text-3xl text-slate-900 sm:text-4xl">
            {isEditing ? "Edit Architectural Marvel" : "Add Architectural Marvel"}
          </h1>
          <p className="mt-3 text-slate-600">
            Manage project cards that appear in the homepage portfolio section.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 grid gap-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <input required name="title" value={formData.title} onChange={(event) => setField("title", event.target.value)} placeholder="Project title" className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-cyan-500 transition focus:ring" />
              <input required name="tag" value={formData.tag} onChange={(event) => setField("tag", event.target.value)} placeholder="Tag (Residential Estate)" className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-cyan-500 transition focus:ring" />
              <input required name="location" value={formData.location} onChange={(event) => setField("location", event.target.value)} placeholder="Location" className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-cyan-500 transition focus:ring" />
              <input required name="client" value={formData.client} onChange={(event) => setField("client", event.target.value)} placeholder="Client" className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-cyan-500 transition focus:ring" />
              <input required name="duration" value={formData.duration} onChange={(event) => setField("duration", event.target.value)} placeholder="Duration (14 Months)" className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-cyan-500 transition focus:ring sm:col-span-2" />
            </div>

            <textarea
              required
              name="description"
              value={formData.description}
              onChange={(event) => setField("description", event.target.value)}
              rows={5}
              placeholder="Project description"
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-cyan-500 transition focus:ring"
            />

            <div className="grid gap-4">
              <label className="text-sm font-semibold text-slate-700">Upload Project Image</label>
              <input
                required={!isEditing && !imageDataUrl}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              />
              {isEditing && (
                <p className="text-xs text-slate-500">
                  Keep current image by leaving upload empty, or upload a new one to replace.
                </p>
              )}
              {imageDataUrl && (
                <div className="relative h-52 overflow-hidden rounded-2xl border border-slate-200">
                  <Image src={imageDataUrl} alt="Preview" fill className="object-cover" unoptimized />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "submitting"
                  ? "Saving..."
                  : isEditing
                  ? "Update Marvel"
                  : "Save Marvel"}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:bg-slate-100"
                >
                  <XCircle size={16} />
                  Cancel Edit
                </button>
              )}
            </div>

            {status === "success" && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
                Architectural Marvel saved successfully.
              </p>
            )}

            {status === "error" && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                {errorMessage || "Something went wrong. Try again."}
              </p>
            )}
          </form>

          <div className="mt-12 border-t border-slate-200 pt-8">
            <h2 className="font-serif text-2xl text-slate-900">Existing Marvels</h2>
            <p className="mt-2 text-sm text-slate-600">
              Tap edit to update details or delete to remove a project.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-md">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search by title, tag, location, client..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none ring-cyan-500 transition focus:ring"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                  >
                    {[6, 10, 20, 30].map((size) => (
                      <option key={size} value={size}>
                        {size} / page
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => loadMarvels()}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100"
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-slate-700 border border-slate-200">
                  Total: {totalItems}
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-slate-700 border border-slate-200">
                  Page {currentPage} of {totalPages}
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-slate-700 border border-slate-200">
                  {paginationText}
                </span>
              </div>
            </div>

            {listStatus === "loading" && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Loading marvels...
              </div>
            )}

            {listStatus === "error" && (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage || "Unable to load marvels."}
              </div>
            )}

            {listStatus === "ready" && marvels.length === 0 && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No marvels added yet.
              </div>
            )}

            {listStatus === "ready" && marvels.length > 0 && (
              <>
                <div className="mt-6 hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Project</th>
                        <th className="px-4 py-3 font-semibold">Tag</th>
                        <th className="px-4 py-3 font-semibold">Location</th>
                        <th className="px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marvels.map((marvel) => (
                        <tr key={marvel._id} className="border-t border-slate-200 bg-white">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-16 overflow-hidden rounded-md border border-slate-200">
                                <Image src={marvel.img} alt={marvel.title} fill className="object-cover" unoptimized />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{marvel.title}</p>
                                <p className="text-xs text-slate-500">{marvel.client}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{marvel.tag}</td>
                          <td className="px-4 py-3 text-slate-700">{marvel.location}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => beginEdit(marvel)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                <Pencil size={13} />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(marvel._id)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                              >
                                <Trash2 size={13} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:hidden">
                {marvels.map((marvel) => (
                  <article key={marvel._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="relative h-44 w-full bg-slate-100">
                      <Image src={marvel.img} alt={marvel.title} fill className="object-cover" unoptimized />
                    </div>
                    <div className="space-y-2 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">{marvel.tag}</p>
                      <h3 className="font-serif text-xl text-slate-900">{marvel.title}</h3>
                      <p className="text-sm text-slate-600">{marvel.location}</p>
                      <p className="line-clamp-2 text-sm text-slate-500">{marvel.description}</p>

                      <div className="pt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => beginEdit(marvel)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(marvel._id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => loadMarvels({ page: Math.max(1, currentPage - 1) })}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </button>
                  <span className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-500">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => loadMarvels({ page: Math.min(totalPages, currentPage + 1) })}
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
