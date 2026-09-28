// Hands a CV chosen on the homepage to the builder, so the visitor goes
// straight from "choose file" to the builder's own upload progress screen
// without picking the file twice. In-memory only: a page reload clears it.
let pendingFile: File | null = null;

export function setPendingCvUpload(file: File) {
  pendingFile = file;
}

export function takePendingCvUpload(): File | null {
  const file = pendingFile;
  pendingFile = null;
  return file;
}
