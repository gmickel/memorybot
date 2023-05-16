/**
 * The function resolves a URL from a given base URL and returns the resolved URL as a string.
 * @param {string} from - The `from` parameter is a string representing the base URL that the `to`
 * parameter will be resolved against. It can be an absolute or relative URL.
 * @param {string} to - The `to` parameter is a string representing the URL that needs to be resolved.
 * It can be an absolute URL or a relative URL.
 * @returns The function `resolve` returns a string that represents the resolved URL. If the `to`
 * parameter is a relative URL, the function returns a string that represents the resolved URL relative
 * to the `from` parameter. If the `to` parameter is an absolute URL, the function returns a string
 * that represents the resolved URL.
 */
export default function resolve(from: string, to: string) {
  const resolvedUrl = new URL(to, new URL(from, 'resolve://'));
  if (resolvedUrl.protocol === 'resolve:') {
    // `from` is a relative URL.
    const { pathname, search, hash } = resolvedUrl;
    return pathname + search + hash;
  }
  return resolvedUrl.toString();
}
