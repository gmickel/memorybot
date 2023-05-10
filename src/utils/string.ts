/**
 * The function sanitizes a string input by removing leading/trailing white spaces and replacing new
 * lines with spaces.
 * @param {string} input - The input parameter is a string that needs to be sanitized.
 * @returns The function `sanitizeInput` is returning a string. The string is the input string with
 * leading and trailing whitespace removed, and all newline characters replaced with a space character.
 */
function sanitizeInput(input: string): string {
  return input.trim().replaceAll('\n', ' ');
}

export { sanitizeInput };
