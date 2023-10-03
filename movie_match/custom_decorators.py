from functools import wraps
from django.http import JsonResponse
from .json_response_models import FailedJsonClassObject

def login_required_json(view_func = None, error_msg = 'Must be logged in.'):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if hasattr(request, 'user') and request.user.is_authenticated:
                # User is logged in, proceed to the view
                return view_func(request, *args, **kwargs)
            else:
                # User is not logged in, return a JSON response
                failedResponse = FailedJsonClassObject(
                    message=error_msg,
                    errors=[error_msg]
                )
                return JsonResponse(failedResponse.to_dict())
        
        return _wrapped_view
    
    if view_func is None:
        return decorator
    else:
        return decorator(view_func)