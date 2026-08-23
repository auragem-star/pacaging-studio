/**
 * VersionManager.js
 * Project versioning — save snapshots of the SVG at named points.
 */

import { saveVersion, getVersionsForProject, getVersion, deleteVersion, saveProject } from './Storage.js';
import { showToast } from '../components/Toast.js';

export class VersionManager {
  constructor(projectId) {
    this.projectId = projectId;
    this._versions = [];
  }

  async load() {
    this._versions = await getVersionsForProject(this.projectId);
    return this._versions;
  }

  get versions() { return this._versions; }

  /**
   * Save a named version snapshot.
   * @param {string} name     - e.g. "V1", "V2_Final"
   * @param {string} svgText  - Current SVG document as string
   * @param {object} meta     - Additional metadata
   */
  async save(name, svgText, meta = {}) {
    const version = await saveVersion({
      projectId: this.projectId,
      name: name || `Version ${this._versions.length + 1}`,
      svgText,
      meta,
    });
    this._versions.unshift(version);
    showToast(`Version "${version.name}" saved`, 'success');
    return version;
  }

  /**
   * Restore a specific version — returns the SVG text.
   */
  async restore(versionId) {
    const ver = await getVersion(versionId);
    if (!ver) throw new Error('Version not found.');
    showToast(`Restored "${ver.name}"`, 'info');
    return ver.svgText;
  }

  /**
   * Duplicate a version with a new name.
   */
  async duplicate(versionId, newName) {
    const ver = await getVersion(versionId);
    if (!ver) throw new Error('Version not found.');
    return this.save(newName || `${ver.name} (copy)`, ver.svgText, { ...ver.meta });
  }

  /**
   * Delete a version.
   */
  async remove(versionId) {
    await deleteVersion(versionId);
    this._versions = this._versions.filter(v => v.id !== versionId);
    showToast('Version deleted', 'info');
  }

  /**
   * Rename a version.
   */
  async rename(versionId, newName) {
    const ver = await getVersion(versionId);
    if (!ver) throw new Error('Version not found.');
    ver.name = newName;
    await saveVersion(ver);
    const idx = this._versions.findIndex(v => v.id === versionId);
    if (idx >= 0) this._versions[idx].name = newName;
    return ver;
  }
}
