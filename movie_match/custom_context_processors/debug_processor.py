from django.conf import settings


# For use in templates to determine if we are in debug mode
def debug_flag(request):
    return {
        "IN_DEBUG": settings.DEBUG,
    }
