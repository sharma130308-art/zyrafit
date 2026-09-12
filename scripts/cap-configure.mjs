#!/usr/bin/env node
/**
 * Post-`cap add` / post-`cap sync` patcher.
 *
 * Injects the iOS permission strings and Android permissions that the
 * camera, photo picker, barcode scanner and notifications need. Safe to run
 * repeatedly — every write is idempotent.
 *
 *   node scripts/cap-configure.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
let changed = 0;

/* ------------------------------------------------------------------ iOS */
const plistPath = resolve(root, "ios/App/App/Info.plist");
if (existsSync(plistPath)) {
  let plist = readFileSync(plistPath, "utf8");

  const iosStrings = {
    NSCameraUsageDescription:
      "ZyraFit uses the camera to photograph meals for calorie estimates and to scan barcodes.",
    NSPhotoLibraryUsageDescription:
      "ZyraFit lets you pick an existing photo of a meal or body-scale readout to log it.",
    NSPhotoLibraryAddUsageDescription:
      "ZyraFit can save meal photos you take to your photo library.",
    NSUserNotificationsUsageDescription:
      "ZyraFit sends gentle meal reminders at the times you choose.",
  };

  for (const [key, value] of Object.entries(iosStrings)) {
    if (plist.includes(`<key>${key}</key>`)) continue;
    plist = plist.replace(
      /<\/dict>\s*<\/plist>\s*$/,
      `\t<key>${key}</key>\n\t<string>${value}</string>\n</dict>\n</plist>\n`,
    );
    changed++;
  }

  // Background modes for remote notifications
  if (!plist.includes("<key>UIBackgroundModes</key>")) {
    plist = plist.replace(
      /<\/dict>\s*<\/plist>\s*$/,
      `\t<key>UIBackgroundModes</key>\n\t<array>\n\t\t<string>remote-notification</string>\n\t</array>\n</dict>\n</plist>\n`,
    );
    changed++;
  }

  // Custom URL scheme (used by OAuth callbacks / deep links)
  if (!plist.includes("<string>com.zyrafit.app</string>")) {
    plist = plist.replace(
      /<\/dict>\s*<\/plist>\s*$/,
      `\t<key>CFBundleURLTypes</key>\n\t<array>\n\t\t<dict>\n\t\t\t<key>CFBundleURLName</key>\n\t\t\t<string>com.zyrafit.app</string>\n\t\t\t<key>CFBundleURLSchemes</key>\n\t\t\t<array>\n\t\t\t\t<string>zyrafit</string>\n\t\t\t</array>\n\t\t</dict>\n\t</array>\n</dict>\n</plist>\n`,
    );
    changed++;
  }

  writeFileSync(plistPath, plist);
  console.log("✔ iOS Info.plist checked");
} else {
  console.log("• ios/ not present yet — run `npx cap add ios` first");
}

/* -------------------------------------------------------------- Android */
const manifestPath = resolve(root, "android/app/src/main/AndroidManifest.xml");
if (existsSync(manifestPath)) {
  let manifest = readFileSync(manifestPath, "utf8");

  const permissions = [
    "android.permission.INTERNET",
    "android.permission.CAMERA",
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.SCHEDULE_EXACT_ALARM",
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.VIBRATE",
    "android.permission.READ_MEDIA_IMAGES",
  ];
  for (const p of permissions) {
    const line = `<uses-permission android:name="${p}" />`;
    if (manifest.includes(`android:name="${p}"`)) continue;
    manifest = manifest.replace(/<\/manifest>\s*$/, `    ${line}\n</manifest>\n`);
    changed++;
  }

  // Camera is optional hardware — don't exclude tablets without one.
  if (!manifest.includes('android:name="android.hardware.camera"')) {
    manifest = manifest.replace(
      /<\/manifest>\s*$/,
      `    <uses-feature android:name="android.hardware.camera" android:required="false" />\n</manifest>\n`,
    );
    changed++;
  }

  // ML Kit barcode model download on install
  if (!manifest.includes("com.google.mlkit.vision.DEPENDENCIES")) {
    manifest = manifest.replace(
      /<\/application>/,
      `        <meta-data android:name="com.google.mlkit.vision.DEPENDENCIES" android:value="barcode_ui" />\n    </application>`,
    );
    changed++;
  }

  // Deep link scheme for OAuth callbacks
  if (!manifest.includes('android:scheme="zyrafit"')) {
    manifest = manifest.replace(
      /(<activity[^>]*android:name="\.MainActivity"[\s\S]*?)(<\/activity>)/,
      `$1    <intent-filter>\n                <action android:name="android.intent.action.VIEW" />\n                <category android:name="android.intent.category.DEFAULT" />\n                <category android:name="android.intent.category.BROWSABLE" />\n                <data android:scheme="zyrafit" />\n            </intent-filter>\n        $2`,
    );
    changed++;
  }

  writeFileSync(manifestPath, manifest);
  console.log("✔ AndroidManifest.xml checked");

  // Ensure minSdk >= 26 (ML Kit) in variables.gradle
  const varsPath = resolve(root, "android/variables.gradle");
  if (existsSync(varsPath)) {
    let vars = readFileSync(varsPath, "utf8");
    const m = vars.match(/minSdkVersion\s*=\s*(\d+)/);
    if (m && Number(m[1]) < 26) {
      vars = vars.replace(/minSdkVersion\s*=\s*\d+/, "minSdkVersion = 26");
      writeFileSync(varsPath, vars);
      changed++;
    }
    console.log("✔ android/variables.gradle checked");
  }
} else {
  console.log("• android/ not present yet — run `npx cap add android` first");
}

console.log(changed ? `Applied ${changed} change(s).` : "Nothing to change.");
