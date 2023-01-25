from django.conf import settings

def debug_flag(request):
    return {
        "IN_DEBUG": settings.DEBUG,
    }