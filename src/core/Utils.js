//Sanitiza strings
export function sanitizaSearchQuery(string) {
    if (typeof string !== 'string') {
        return '';
    }
    let cleanedString = string.trim();
    cleanedString = cleanedString.replace(/<[^>]*>?/gm, '');
    cleanedString = cleanedString.toLowerCase();
    cleanedString = cleanedString.replace(/\s+/g, ' ');
    return cleanedString;
}

