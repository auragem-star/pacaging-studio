/**
 * Storage.js — IndexedDB wrapper using the idb library
 * Stores: brand profiles, projects, versions, assets
 */

import { openDB } from 'idb';

const DB_NAME = 'PackStudio';
const DB_VERSION = 1;

let _db = null;

export async function getDB() {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Brand Profiles
      if (!db.objectStoreNames.contains('brandProfiles')) {
        const bp = db.createObjectStore('brandProfiles', { keyPath: 'id' });
        bp.createIndex('name', 'name');
      }
      // Projects
      if (!db.objectStoreNames.contains('projects')) {
        const proj = db.createObjectStore('projects', { keyPath: 'id' });
        proj.createIndex('createdAt', 'createdAt');
        proj.createIndex('updatedAt', 'updatedAt');
      }
      // Versions (per project)
      if (!db.objectStoreNames.contains('versions')) {
        const ver = db.createObjectStore('versions', { keyPath: 'id' });
        ver.createIndex('projectId', 'projectId');
        ver.createIndex('createdAt', 'createdAt');
      }
      // Assets (logo, barcode, product images, references)
      if (!db.objectStoreNames.contains('assets')) {
        const ast = db.createObjectStore('assets', { keyPath: 'id' });
        ast.createIndex('type', 'type');
        ast.createIndex('brandProfileId', 'brandProfileId');
      }
      // App settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    }
  });
  return _db;
}

// ── Settings ──────────────────────────────────────────────
export async function getSetting(key) {
  const db = await getDB();
  const row = await db.get('settings', key);
  return row ? row.value : null;
}

export async function setSetting(key, value) {
  const db = await getDB();
  await db.put('settings', { key, value });
}

// ── Brand Profiles ────────────────────────────────────────
export async function saveBrandProfile(profile) {
  const db = await getDB();
  profile.updatedAt = Date.now();
  if (!profile.id) profile.id = crypto.randomUUID();
  if (!profile.createdAt) profile.createdAt = Date.now();
  await db.put('brandProfiles', profile);
  return profile;
}

export async function getBrandProfile(id) {
  const db = await getDB();
  return db.get('brandProfiles', id);
}

export async function getAllBrandProfiles() {
  const db = await getDB();
  return db.getAll('brandProfiles');
}

export async function deleteBrandProfile(id) {
  const db = await getDB();
  await db.delete('brandProfiles', id);
}

// ── Projects ──────────────────────────────────────────────
export async function saveProject(project) {
  const db = await getDB();
  project.updatedAt = Date.now();
  if (!project.id) project.id = crypto.randomUUID();
  if (!project.createdAt) project.createdAt = Date.now();
  await db.put('projects', project);
  return project;
}

export async function getProject(id) {
  const db = await getDB();
  return db.get('projects', id);
}

export async function getAllProjects() {
  const db = await getDB();
  const all = await db.getAll('projects');
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteProject(id) {
  const db = await getDB();
  await db.delete('projects', id);
  // Delete associated versions
  const db2 = await getDB();
  const versions = await db2.getAllFromIndex('versions', 'projectId', id);
  for (const v of versions) await db2.delete('versions', v.id);
}

// ── Versions ──────────────────────────────────────────────
export async function saveVersion(version) {
  const db = await getDB();
  version.createdAt = Date.now();
  if (!version.id) version.id = crypto.randomUUID();
  await db.put('versions', version);
  return version;
}

export async function getVersionsForProject(projectId) {
  const db = await getDB();
  const all = await db.getAllFromIndex('versions', 'projectId', projectId);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getVersion(id) {
  const db = await getDB();
  return db.get('versions', id);
}

export async function deleteVersion(id) {
  const db = await getDB();
  await db.delete('versions', id);
}

// ── Assets ────────────────────────────────────────────────
export async function saveAsset(asset) {
  const db = await getDB();
  asset.createdAt = Date.now();
  if (!asset.id) asset.id = crypto.randomUUID();
  await db.put('assets', asset);
  return asset;
}

export async function getAsset(id) {
  const db = await getDB();
  return db.get('assets', id);
}

export async function deleteAsset(id) {
  const db = await getDB();
  await db.delete('assets', id);
}

/**
 * Convert a File to a data URI string
 */
export function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
