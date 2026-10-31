/** Quote every field and neutralize formula prefixes, including leading whitespace. */
export function csvCell(value) {
  let text = String(value ?? "");
  if (/^[\s\x00-\x1f]*[=+@-]/u.test(text) || /^[\t\r\n]/u.test(text))
    text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
