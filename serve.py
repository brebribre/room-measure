#!/usr/bin/env python3
"""Static dev server for RoomPlan that disables caching, so edits to the JS
modules show up on a normal refresh (no hard-reload needed)."""
import http.server
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


with socketserver.TCPServer(('', PORT), NoCacheHandler) as httpd:
    print(f'RoomPlan serving on http://localhost:{PORT}  (press Ctrl+C to stop)')
    httpd.serve_forever()
