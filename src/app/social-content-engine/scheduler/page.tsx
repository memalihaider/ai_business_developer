"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ----------------------
// Post Card Component
// ----------------------
interface PostCardProps {
  title: string;
  date?: string;
  content: string;
  onDelete: () => void;
  onEdit: (updatedPost: { title: string; date?: string; content: string }) => void;
  onPublish?: () => void;
  onSchedule?: () => void;
  isPublished?: boolean;
  isDraft?: boolean;
}

function PostCard({
  title,
  date,
  content,
  onDelete,
  onEdit,
  onPublish,
  onSchedule,
  isPublished = false,
  isDraft = false,
}: PostCardProps) {
  const [editTitle, setEditTitle] = React.useState(title);
  const [editDate, setEditDate] = React.useState(date || "");
  const [editContent, setEditContent] = React.useState(content);

  return (
    <Card
      className={`rounded-2xl shadow-sm border ${
        isPublished
          ? "border-green-400 bg-green-50"
          : isDraft
          ? "border-yellow-400 bg-yellow-50"
          : "border-blue-200 bg-blue-50"
      } hover:shadow-md transition`}
    >
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
          {title}
          {isPublished && <span className="text-green-600">✅</span>}
          {isDraft && <span className="text-yellow-600">📝</span>}
        </CardTitle>
        {date && <p className="text-xs text-gray-500">📅 {date}</p>}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-3">{content}</p>

        <div className="flex flex-wrap gap-2">
          {/* Edit */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="text-xs px-3 rounded-lg hover:bg-[#7A8063] hover:text-white"
              >
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Post</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 py-2">
                <Input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Post Title"
                  className="text-sm rounded-lg"
                />
                {!isDraft && (
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="text-sm rounded-lg"
                  />
                )}
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Post Content"
                  className="text-sm rounded-lg"
                />
              </div>
              <DialogFooter>
                <Button
                  size="sm"
                  onClick={() =>
                    onEdit({
                      title: editTitle,
                      date: isDraft ? undefined : editDate,
                      content: editContent,
                    })
                  }
                  className="bg-[#7A8063] hover:bg-[#7A8055] text-white rounded-lg text-sm"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Draft -> Schedule */}
          {isDraft && onSchedule && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSchedule}
              className="text-xs px-3 rounded-lg hover:bg-blue-600 hover:text-white"
            >
              Schedule
            </Button>
          )}

          {/* Scheduled -> Published */}
          {!isPublished && !isDraft && onPublish && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPublish}
              className="text-xs px-3 rounded-lg hover:bg-green-600 hover:text-white"
            >
              Publish
            </Button>
          )}

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="text-xs px-3 rounded-lg hover:bg-red-500 hover:text-white"
              >
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this post? This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-lg">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-500 hover:bg-red-600 text-white rounded-lg"
                  onClick={onDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------
// Scheduler Form
// ----------------------
interface SchedulerFormProps {
  onAdd: (post: { title: string; date: string; content: string }) => void;
  onDraft: (post: { title: string; content: string }) => void;
}

function SchedulerForm({ onAdd, onDraft }: SchedulerFormProps) {
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState("");
  const [content, setContent] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim() || !content.trim()) return;
    onAdd({ title, date, content });
    setTitle("");
    setDate("");
    setContent("");
  };

  const handleDraft = () => {
    if (!title.trim() || !content.trim()) return;
    onDraft({ title, content });
    setTitle("");
    setDate("");
    setContent("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 mb-6 bg-gray-50 p-4 rounded-2xl shadow-sm border border-gray-200"
    >
      <Input
        type="text"
        placeholder="Post Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-lg text-sm"
      />
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg text-sm"
      />
      <Textarea
        placeholder="Post Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="rounded-lg text-sm"
      />
      <div className="flex gap-3">
        <Button
          type="submit"
          className="bg-[#7A8063] hover:bg-[#7A8055] text-white px-6 py-2 rounded-lg text-sm"
        >
          Schedule Post
        </Button>
        <Button
          type="button"
          onClick={handleDraft}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg text-sm"
        >
          Save as Draft
        </Button>
      </div>
    </form>
  );
}

// ----------------------
// Main Scheduler
// ----------------------
export default function Scheduler() {
  const [drafts, setDrafts] = React.useState<
    { title: string; content: string }[]
  >([]);
  const [posts, setPosts] = React.useState<
    { title: string; date: string; content: string }[]
  >([]);
  const [publishedPosts, setPublishedPosts] = React.useState<
    { title: string; date: string; content: string }[]
  >([]);

  const addPost = (post: { title: string; date: string; content: string }) => {
    setPosts((prev) => [...prev, post]);
  };

  const addDraft = (draft: { title: string; content: string }) => {
    setDrafts((prev) => [...prev, draft]);
  };

  const deletePost = (
    index: number,
    type: "draft" | "scheduled" | "published"
  ) => {
    if (type === "draft") {
      setDrafts((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "scheduled") {
      setPosts((prev) => prev.filter((_, i) => i !== index));
    } else {
      setPublishedPosts((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const editPost = (
    index: number,
    updatedPost: { title: string; date?: string; content: string },
    type: "draft" | "scheduled" | "published"
  ) => {
    if (type === "draft") {
      setDrafts((prev) =>
        prev.map((p, i) => (i === index ? { ...p, ...updatedPost } : p))
      );
    } else if (type === "scheduled") {
      setPosts((prev) =>
        prev.map((p, i) => (i === index ? { ...p, ...updatedPost } : p))
      );
    } else {
      setPublishedPosts((prev) =>
        prev.map((p, i) => (i === index ? { ...p, ...updatedPost } : p))
      );
    }
  };

  const scheduleDraft = (index: number) => {
    const draftToSchedule = drafts[index];
    if (!draftToSchedule) return;
    setDrafts((prev) => prev.filter((_, i) => i !== index));
    setPosts((prev) => [
      ...prev,
      {
        title: draftToSchedule.title,
        date: new Date().toISOString().slice(0, 10),
        content: draftToSchedule.content,
      },
    ]);
  };

  const publishPost = (index: number) => {
    const postToPublish = posts[index];
    if (!postToPublish) return;
    setPosts((prev) => prev.filter((_, i) => i !== index));
    setPublishedPosts((prev) => [...prev, postToPublish]);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4"> Scheduler</h2>
      <SchedulerForm onAdd={addPost} onDraft={addDraft} />

      {/* Drafts */}
      <h3 className="text-lg font-semibold text-gray-700 mb-2">📝 Drafts</h3>
      {drafts.length === 0 ? (
        <p className="text-gray-500 text-sm italic">No drafts saved yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {drafts.map((draft, index) => (
            <PostCard
              key={index}
              title={draft.title}
              content={draft.content}
              isDraft
              onDelete={() => deletePost(index, "draft")}
              onEdit={(updated) => editPost(index, updated, "draft")}
              onSchedule={() => scheduleDraft(index)}
            />
          ))}
        </div>
      )}

      {/* Scheduled Posts */}
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        🕑 Scheduled Posts
      </h3>
      {posts.length === 0 ? (
        <p className="text-gray-500 text-sm italic">No posts scheduled yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {posts.map((post, index) => (
            <PostCard
              key={index}
              title={post.title}
              date={post.date}
              content={post.content}
              onDelete={() => deletePost(index, "scheduled")}
              onEdit={(updated) => editPost(index, updated, "scheduled")}
              onPublish={() => publishPost(index)}
            />
          ))}
        </div>
      )}

      {/* Published Posts */}
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        ✅ Published Posts
      </h3>
      {publishedPosts.length === 0 ? (
        <p className="text-gray-500 text-sm italic">No posts published yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {publishedPosts.map((post, index) => (
            <PostCard
              key={index}
              title={post.title}
              date={post.date}
              content={post.content}
              isPublished
              onDelete={() => deletePost(index, "published")}
              onEdit={(updated) => editPost(index, updated, "published")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
