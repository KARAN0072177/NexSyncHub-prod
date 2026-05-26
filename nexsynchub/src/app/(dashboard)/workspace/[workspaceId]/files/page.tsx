"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

import {

  Search,
  FileText,
  ImageIcon,
  Video,
  Download,
  Calendar,
  Hash,

} from "lucide-react";

interface WorkspaceFile {

  id: string;

  key: string;

  type:
    "image" |
    "video" |
    "file";

  name: string;

  size: number;

  url: string;

  uploadedAt: string;

  uploadedBy: {

    username: string;

    avatar: string;

  };

  channel: {

    name: string;

  };

}

const tabs = [

  "all",

  "image",

  "video",

  "file",

];

export default function
WorkspaceFilesPage() {

  const {
    workspaceId,
  } = useParams();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    files,
    setFiles,
  ] = useState<
    WorkspaceFile[]
  >([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    activeTab,
    setActiveTab,
  ] = useState("all");

  // 🔥 Fetch files
  useEffect(() => {

    const fetchFiles =
      async () => {

        try {

          const res =
            await fetch(

              `/api/workspace/${workspaceId}/files`

            );

          const data =
            await res.json();

          if (!res.ok) {

            alert(
              data.error
            );

            return;

          }

          setFiles(
            data.files
          );

        } catch (error) {

          console.error(
            error
          );

        } finally {

          setLoading(false);

        }

      };

    fetchFiles();

  }, [workspaceId]);

  // 🔥 Filtered files
  const filteredFiles =
    useMemo(() => {

      return files.filter(

        (file) => {

          const matchesTab =

            activeTab ===
            "all"

              ? true

              : file.type ===
                activeTab;

          const matchesSearch =

            file.name

              .toLowerCase()

              .includes(

                search
                  .toLowerCase()

              );

          return (
            matchesTab &&
            matchesSearch
          );

        }

      );

    }, [

      files,

      activeTab,

      search,

    ]);

  return (

    <div className="min-h-screen bg-[#030712] text-white p-6">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

        <div>

          <h1 className="text-3xl font-bold">
            Workspace Files
          </h1>

          <p className="text-gray-400 mt-2">
            Browse all uploaded workspace files, media and attachments.
          </p>

        </div>

        {/* SEARCH */}
        <div className="relative w-full lg:w-[350px]">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input

            value={search}

            onChange={(e) =>

              setSearch(
                e.target.value
              )

            }

            placeholder="Search files..."

            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-violet-500/40"

          />

        </div>

      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3 mb-8">

        {

          tabs.map((tab) => (

            <button

              key={tab}

              onClick={() =>

                setActiveTab(
                  tab
                )

              }

              className={`px-5 py-2 rounded-2xl border transition-all capitalize ${

                activeTab === tab

                  ? "bg-violet-600 border-violet-500"

                  : "bg-white/[0.03] border-white/10 hover:border-violet-500/30"

              }`}

            >

              {tab}

            </button>

          ))

        }

      </div>

      {/* LOADING */}
      {loading && (

        <div className="text-gray-400">
          Loading files...
        </div>

      )}

      {/* EMPTY */}
      {

        !loading &&
        filteredFiles.length === 0 && (

          <div className="border border-white/10 rounded-3xl p-10 text-center bg-white/[0.03]">

            <p className="text-gray-400">
              No files found.
            </p>

          </div>

        )

      }

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {

          filteredFiles.map(

            (file) => (

              <div

                key={file.id}

                className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden"

              >

                {/* PREVIEW */}
                <div className="aspect-video bg-black/30 flex items-center justify-center overflow-hidden">

                  {

                    file.type ===
                    "image"

                      ? (

                        <img

                          src={file.url}

                          alt={file.name}

                          className="w-full h-full object-cover"

                        />

                      )

                      : file.type ===
                        "video"

                        ? (

                          <video

                            src={file.url}

                            className="w-full h-full object-cover"

                            controls

                          />

                        )

                        : (

                          <FileText
                            size={60}
                            className="text-violet-400"
                          />

                        )

                  }

                </div>

                {/* BODY */}
                <div className="p-5">

                  {/* FILE NAME */}
                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <h3 className="font-semibold break-all">
                        {file.name}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {

                          (
                            file.size /
                            1024 /
                            1024
                          ).toFixed(2)

                        } MB
                      </p>

                    </div>

                    {

                      file.type ===
                      "image"

                        ? (

                          <ImageIcon
                            size={18}
                            className="text-violet-400"
                          />

                        )

                        : file.type ===
                          "video"

                          ? (

                            <Video
                              size={18}
                              className="text-pink-400"
                            />

                          )

                          : (

                            <FileText
                              size={18}
                              className="text-cyan-400"
                            />

                          )

                    }

                  </div>

                  {/* USER */}
                  <div className="flex items-center gap-3 mt-5">

                    <img

                      src={
                        file
                          .uploadedBy
                          .avatar
                      }

                      alt="avatar"

                      className="w-10 h-10 rounded-full object-cover"

                    />

                    <div>

                      <p className="text-sm font-medium">
                        {
                          file
                            .uploadedBy
                            .username
                        }
                      </p>

                      <p className="text-xs text-gray-500">
                        Uploaded by
                      </p>

                    </div>

                  </div>

                  {/* META */}
                  <div className="space-y-2 mt-5 text-sm text-gray-400">

                    <div className="flex items-center gap-2">

                      <Hash
                        size={14}
                      />

                      <span>
                        {
                          file.channel
                            .name
                        }
                      </span>

                    </div>

                    <div className="flex items-center gap-2">

                      <Calendar
                        size={14}
                      />

                      <span>

                        {

                          new Date(

                            file.uploadedAt

                          ).toLocaleString()

                        }

                      </span>

                    </div>

                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center gap-3 mt-6">

                    <a

                      href={file.url}

                      target="_blank"

                      className="flex-1 text-center py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 transition-all font-medium"

                    >

                      Open

                    </a>

                    <a

                      href={file.url}

                      download

                      className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center hover:bg-white/[0.08] transition-all"

                    >

                      <Download
                        size={18}
                      />

                    </a>

                  </div>

                </div>

              </div>

            )

          )

        }

      </div>

    </div>

  );

}