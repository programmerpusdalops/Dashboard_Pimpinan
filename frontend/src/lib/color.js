export function hexToRgbString(hex) {
    const value = String(hex || '').trim().replace('#', '');
    const normalized = value.length === 3
        ? value.split('').map((char) => char + char).join('')
        : value;

    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
        return '245, 158, 11';
    }

    const intValue = Number.parseInt(normalized, 16);
    const red = (intValue >> 16) & 255;
    const green = (intValue >> 8) & 255;
    const blue = intValue & 255;

    return `${red}, ${green}, ${blue}`;
}

