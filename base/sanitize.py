import bleach

# Matches the rich-text formatting the Quill editor actually produces on the
# resume form (bold/italic/underline, lists, links, headings, paragraphs) -
# everything else (script, style, iframe, on* handlers, etc.) is stripped.
ALLOWED_TAGS = [
    "p", "br", "strong", "b", "em", "i", "u", "s",
    "ul", "ol", "li", "a", "h1", "h2", "h3", "blockquote", "span",
]
ALLOWED_ATTRIBUTES = {
    "a": ["href", "title", "target", "rel"],
}


def sanitize_html(value):
    if not value:
        return value
    return bleach.clean(
        value, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True
    )
