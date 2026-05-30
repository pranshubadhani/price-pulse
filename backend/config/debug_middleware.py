import logging

logger = logging.getLogger(__name__)


class DebugMiddleware:
    """Debug middleware to log request/response details"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        method = request.method
        path = request.path
        logger.info(f"[REQ] {method} {path}")
        
        response = self.get_response(request)
        
        logger.info(f"[RES] {method} {path} → {response.status_code}")
        if response.status_code == 301:
            logger.warning(f"[REDIRECT] {path} → {response.get('Location', 'N/A')}")
        
        return response
