class ContentSecurityPolicyMiddleware:
    """
    Adds a Content-Security-Policy header restricting script execution to this app's
    own origin plus the specific third-party hosts the templates actually load
    (Google Fonts, the jsDelivr Chart.js script, the hotlinked institute logo).
    """
    POLICY = "; ".join(
        [
            "default-src 'self'",
            "script-src 'self' https://cdn.jsdelivr.net",
            "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https://zctindia.org",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response["Content-Security-Policy"] = self.POLICY
        return response


class NoCacheMiddleware:
    """
    Middleware to add Cache-Control headers to prevent the browser from caching
    authenticated responses. This ensures the back button doesn't reveal protected
    pages after logout.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if "text/html" in response.get("Content-Type", "") or "application/json" in response.get("Content-Type", ""):
            response["Cache-Control"] = "no-store, no-cache, private, must-revalidate"
            response["Pragma"] = "no-cache"
            response["Expires"] = "0"
        return response
