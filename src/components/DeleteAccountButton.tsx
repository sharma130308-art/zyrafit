import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { deleteOwnAccount } from "@/lib/account";
import { hapticMedium } from "@/lib/haptics";

/**
 * Permanent in-app account deletion (App Store guideline 5.1.1(v) /
 * Google Play account-deletion policy). Two-step confirm, then wipes
 * server data + local caches and returns to the welcome screen.
 */
export function DeleteAccountButton() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    hapticMedium();
    setBusy(true);
    const { ok, error } = await deleteOwnAccount();
    setBusy(false);
    if (!ok) {
      toast.error(error || "Couldn't delete your account. Please try again.");
      return;
    }
    toast.success("Your account and data have been deleted");
    navigate({ to: "/welcome", replace: true });
  };

  return (
    <AlertDialog onOpenChange={(o) => !o && setConfirmText("")}>
      <AlertDialogTrigger asChild>
        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
          Delete account
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[360px] rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes your profile, food log, weight history and
            settings. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Type <span className="font-semibold text-foreground">DELETE</span> to confirm
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect="off"
            placeholder="DELETE"
            className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-destructive/30 text-center font-semibold tracking-widest"
          />
        </div>
        <AlertDialogFooter className="flex-row gap-2">
          <AlertDialogCancel className="flex-1 rounded-xl mt-0">Keep account</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
            disabled={busy || confirmText !== "DELETE"}
            className="flex-1 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
