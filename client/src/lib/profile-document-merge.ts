import type { ProfileDocument } from "@shared/profile-document";

export type DocumentConflict = {
  path: string;
  local: unknown;
  remote: unknown;
};

const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const plainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function mergeValue(base: unknown, local: unknown, remote: unknown, path: string, conflicts: DocumentConflict[]): unknown {
  if (same(local, base)) return structuredClone(remote);
  if (same(remote, base) || same(local, remote)) return structuredClone(local);

  if (plainObject(base) && plainObject(local) && plainObject(remote)) {
    const result: Record<string, unknown> = {};
    const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)]);
    for (const key of Array.from(keys)) {
      result[key] = mergeValue(base[key], local[key], remote[key], path ? `${path}.${key}` : key, conflicts);
    }
    return result;
  }

  conflicts.push({ path: path || "document", local: structuredClone(local), remote: structuredClone(remote) });
  return structuredClone(remote);
}

export function mergeProfileDocuments(base: ProfileDocument, local: ProfileDocument, remote: ProfileDocument) {
  const conflicts: DocumentConflict[] = [];
  const document = mergeValue(base, local, remote, "", conflicts) as ProfileDocument;
  return { document, conflicts };
}

export function setDocumentPath(document: ProfileDocument, path: string, value: unknown): ProfileDocument {
  if (path === "document") return structuredClone(value) as ProfileDocument;
  const next = structuredClone(document) as unknown as Record<string, unknown>;
  const segments = path.split(".");
  let cursor = next;
  for (const segment of segments.slice(0, -1)) cursor = cursor[segment] as Record<string, unknown>;
  cursor[segments.at(-1)!] = structuredClone(value);
  return next as unknown as ProfileDocument;
}
