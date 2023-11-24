from django import template
from django.conf import settings
from django.templatetags.static import static
from django.utils.html import format_html
from django.utils.safestring import mark_safe

register = template.Library()


@register.simple_tag
def bundle_tag(asset_url, block_content=""):
    def css_tag(url):
        return format_html(
            '<link rel="stylesheet" type="text/css" href="{}">',
            mark_safe(static(url))
        )

    def js_tag(url):
        return format_html(
            '<script type="module" src="{}"></script>',
            mark_safe(static(url))
        )

    if asset_url.endswith(".js"):
        input_file = "index.js"
        output_file = "main.bundle.js"
        script_tag = js_tag
    elif asset_url.endswith(".css"):
        input_file = "style.css"
        output_file = "styles.bundle.css"
        script_tag = css_tag
    else:
        raise Exception("tt6 tag only supports .js and .css files")

    def bundled_path(path_string):
        path_string = path_string.replace(input_file, output_file)
        return path_string

    if settings.DEBUG:
        html_link = script_tag(asset_url)
        return format_html("{}\n{}", mark_safe(html_link), mark_safe(block_content))
    else:
        return script_tag(bundled_path(asset_url))
