from django import template
from django.templatetags.static import static

register = template.Library()

@register.simple_tag(name="bundled")
def bundled_url(path_string):
    path_string = path_string.replace("index.js", "main.bundle.js")
    return static(path_string)