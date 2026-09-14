// One-time (or re-runnable) uploader for the exercise video library.
//
// Usage:
//   1. Create supabase/.env.local (NOT committed - already gitignored via
//      the *.local pattern) with:
//        SUPABASE_URL="https://<your-project>.supabase.co"
//        SUPABASE_SERVICE_ROLE_KEY="<service role key from Supabase Dashboard -> Settings -> API>"
//      The service role key bypasses RLS - never commit it, never paste it
//      into chat, never put it in the regular .env that ships with the app.
//   2. Point this at your local folder of category subfolders (e.g. "men/",
//      with subfolders like "back/", "chest/", "Hips/", etc. containing
//      .mp4 files):
//        node --env-file=.env.local scripts/upload-exercises.mjs ./men
//
// It's safe to re-run - both the storage upload and the database row use
// upsert, so interrupting and restarting won't create duplicates.

import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "exercises";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
    "Put them in supabase/.env.local and run with:\n" +
    "  node --env-file=supabase/.env.local scripts/upload-exercises.mjs <folder>",
  );
  process.exit(1);
}

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error("Usage: node scripts/upload-exercises.mjs <path-to-folder-of-category-subfolders>");
  process.exit(1);
}

// Must match the CHECK constraint in the exercises table migration.
const KNOWN_GROUPS = new Set([
  "chest", "back", "shoulders", "biceps", "triceps", "forearms",
  "trapezius", "abs", "hips", "calves", "cardio",
]);

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) return;
  console.log(`Creating storage bucket "${BUCKET}" (public)...`);
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error) throw error;
}

async function main() {
  await ensureBucket();

  const categoryDirs = readdirSync(sourceDir).filter((entry) =>
    statSync(join(sourceDir, entry)).isDirectory(),
  );

  let uploaded = 0;
  let skipped = 0;
  let sortOrder = 0;

  for (const rawCategory of categoryDirs) {
    const muscleGroup = rawCategory.toLowerCase();
    if (!KNOWN_GROUPS.has(muscleGroup)) {
      console.warn(`⚠ Skipping folder "${rawCategory}" - not in the known category list (${[...KNOWN_GROUPS].join(", ")}). Add it to the migration's CHECK constraint first if this is intentional.`);
      skipped++;
      continue;
    }

    const categoryPath = join(sourceDir, rawCategory);
    const files = readdirSync(categoryPath).filter((f) => extname(f).toLowerCase() === ".mp4");

    console.log(`\n${rawCategory} -> ${muscleGroup} (${files.length} files)`);

    for (const file of files) {
      const name = basename(file, extname(file));
      const fileSlug = slugify(name);
      const videoPath = `${muscleGroup}/${fileSlug}.mp4`;
      const fullPath = join(categoryPath, file);
      const buffer = readFileSync(fullPath);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(videoPath, buffer, { contentType: "video/mp4", upsert: true });

      if (uploadError) {
        console.error(`  ✗ ${file}: ${uploadError.message}`);
        continue;
      }

      const { error: rowError } = await supabase
        .from("exercises")
        .upsert(
          { muscle_group: muscleGroup, name, video_path: videoPath, sort_order: sortOrder },
          { onConflict: "video_path" },
        );

      if (rowError) {
        console.error(`  ✗ ${file} (row insert): ${rowError.message}`);
        continue;
      }

      uploaded++;
      sortOrder++;
      process.stdout.write(`  ✓ ${name}\n`);
    }
  }

  console.log(`\nDone. Uploaded/updated ${uploaded} exercises. Skipped ${skipped} unrecognized folder(s).`);
}

main().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
