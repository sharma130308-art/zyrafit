/**
 * Native photo capture via @capacitor/camera.
 * On iOS/Android this opens the system camera / photo picker (with the OS
 * permission prompts wired to the Info.plist / AndroidManifest strings).
 * Returns a File so the existing upload/analysis pipeline is unchanged.
 * Resolves null when the user cancels.
 */
import { isNative } from "./native";

export type PhotoSource = "prompt" | "camera" | "photos";

export async function pickNativePhoto(
  source: PhotoSource = "prompt",
  opts: { header?: string } = {},
): Promise<File | null> {
  if (!isNative()) return null;
  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");

  const cameraSource =
    source === "camera"
      ? CameraSource.Camera
      : source === "photos"
        ? CameraSource.Photos
        : CameraSource.Prompt;

  try {
    // Request only what we need; Camera plugin handles "limited" library access.
    const perm = await Camera.checkPermissions();
    if (perm.camera !== "granted" || perm.photos !== "granted") {
      await Camera.requestPermissions({ permissions: ["camera", "photos"] });
    }

    const photo = await Camera.getPhoto({
      source: cameraSource,
      resultType: CameraResultType.Uri,
      quality: 75,
      width: 1600,
      correctOrientation: true,
      allowEditing: false,
      saveToGallery: false,
      promptLabelHeader: opts.header ?? "Add a photo",
      promptLabelPhoto: "Choose from library",
      promptLabelPicture: "Take photo",
      promptLabelCancel: "Cancel",
    });

    if (!photo.webPath) return null;
    const res = await fetch(photo.webPath);
    const blob = await res.blob();
    const ext = photo.format || "jpeg";
    return new File([blob], `photo-${Date.now()}.${ext}`, {
      type: blob.type || `image/${ext}`,
    });
  } catch (err: any) {
    const msg = String(err?.message || err || "").toLowerCase();
    // User dismissed the picker — not an error.
    if (msg.includes("cancel")) return null;
    console.error("[native-camera] getPhoto failed:", err);
    return null;
  }
}
