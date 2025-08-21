# Troubleshooting

The application exposes additional logging to help diagnose OCR issues.

## Collecting Debug Logs

1. Open the app with the query string `?debug=1` appended to the URL. Example:
   `https://app.example.com/?debug=1`.
2. Reproduce the problem. While debug mode is enabled the OCR upload screen
   displays a log panel and writes messages to the browser console:
   - Preprocessing input and output image dimensions
   - Tesseract OCR events and progress
   - OpenAI responses and field detection results
3. Open your browser's developer tools console to view or copy the logs. The
   on‑screen debug panel can also be copied directly.
4. Provide these logs when reporting an issue.
