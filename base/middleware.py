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
