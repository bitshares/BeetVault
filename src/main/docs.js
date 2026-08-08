import fsPromises from 'fs/promises';
import path from 'path';

/**
 * Reads a documentation markdown file for a given locale.
 *
 * Falls back to English if the requested locale file doesn't exist.
 * Includes path traversal protection to prevent reading files outside
 * the docs directory.
 *
 * @param {string} appDir - Absolute path to the application directory.
 * @param {string} locale - The locale code (e.g., 'en', 'de', 'fr').
 * @param {string} docPath - Relative path to the markdown file within the locale folder.
 * @returns {Promise<string>} The file contents as UTF-8 string.
 * @throws {Error} If the resolved path escapes the docs directory or the file cannot be read.
 */
export async function readDocFile(appDir, locale, docPath) {
    const docsBaseDir = path.resolve(path.join(appDir, 'docs'));
    const localeDir = path.resolve(path.join(docsBaseDir, locale));
    const resolvedPath = path.resolve(path.join(localeDir, docPath));

    if (!resolvedPath.startsWith(localeDir)) {
        throw new Error('Path traversal detected');
    }

    try {
        return await fsPromises.readFile(resolvedPath, 'utf-8');
    } catch (err) {
        if (locale !== 'en') {
            const enDir = path.resolve(path.join(docsBaseDir, 'en'));
            const enPath = path.resolve(path.join(enDir, docPath));
            if (enPath.startsWith(enDir)) {
                try {
                    return await fsPromises.readFile(enPath, 'utf-8');
                } catch (_) {
                    // fall through to original error
                }
            }
        }
        throw err;
    }
}

/**
 * Reads and parses the documentation navigation manifest.
 *
 * The manifest defines the sidebar structure, section titles (via i18n keys),
 * file paths, and icons.
 *
 * @param {string} appDir - Absolute path to the application directory.
 * @returns {Promise<object>} The parsed manifest JSON object.
 * @throws {Error} If the manifest file cannot be read or parsed.
 */
export async function readManifest(appDir) {
    const manifestPath = path.join(appDir, 'docs', 'manifest.json');
    const content = await fsPromises.readFile(manifestPath, 'utf-8');
    return JSON.parse(content);
}
