from django import template
from django.template.defaultfilters import stringfilter

register = template.Library()

@register.filter
@stringfilter
def prefix(value, arg):
    """Prefixes value with arg"""
    return f'{arg}{value}'